import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as THREE from 'three';
import { attachMilitaryGear } from '../src/soldier-gear.js';

// Reconstruct the checked-in rig and its animation samples without loading
// textures or requiring a browser/WebGL context. These tests exercise the
// imported hierarchy and poses, not rendered visibility or device performance.
const glb = readFileSync(new URL('../public/models/Soldier.glb', import.meta.url));
assert.equal(glb.readUInt32LE(0), 0x46546c67, 'fixture is a GLB');
assert.equal(glb.readUInt32LE(4), 2, 'fixture uses glTF 2');
assert.equal(glb.readUInt32LE(8), glb.length, 'fixture is complete');

let model;
let binary;
for (let offset = 12; offset < glb.length;) {
  const length = glb.readUInt32LE(offset);
  const type = glb.readUInt32LE(offset + 4);
  const chunk = glb.subarray(offset + 8, offset + 8 + length);
  if (type === 0x4e4f534a) model = JSON.parse(chunk.toString('utf8'));
  if (type === 0x004e4942) binary = chunk;
  offset += 8 + length;
}
assert.ok(model && binary, 'fixture has JSON and binary chunks');

function animationValues(accessorIndex) {
  const accessor = model.accessors[accessorIndex];
  const view = model.bufferViews[accessor.bufferView];
  assert.equal(accessor.componentType, 5126, 'animation samples are floats');
  assert.equal(view.buffer, 0, 'animation samples use the embedded buffer');
  assert.equal(accessor.sparse, undefined, 'fixture has dense animation samples');
  const components = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type];
  assert.ok(components, 'supported animation accessor shape');
  const stride = view.byteStride ?? components * 4;
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const values = new Float32Array(accessor.count * components);
  for (let item = 0; item < accessor.count; item++) {
    for (let component = 0; component < components; component++) {
      values[item * components + component] = binary.readFloatLE(start + item * stride + component * 4);
    }
  }
  return values;
}

function createRig() {
  const joints = new Set(model.skins.flatMap((skin) => skin.joints));
  const nodes = model.nodes.map((definition, index) => {
    const object = joints.has(index) ? new THREE.Bone() : new THREE.Group();
    // GLTFLoader strips ':' and other reserved track characters from names.
    object.name = THREE.PropertyBinding.sanitizeNodeName(definition.name ?? `node_${index}`);
    if (definition.matrix) {
      new THREE.Matrix4().fromArray(definition.matrix).decompose(object.position, object.quaternion, object.scale);
    } else {
      if (definition.translation) object.position.fromArray(definition.translation);
      if (definition.rotation) object.quaternion.fromArray(definition.rotation);
      if (definition.scale) object.scale.fromArray(definition.scale);
    }
    return object;
  });
  model.nodes.forEach((definition, index) => {
    for (const child of definition.children ?? []) nodes[index].add(nodes[child]);
  });
  const soldier = new THREE.Group();
  soldier.name = 'SoldierFixture';
  for (const index of model.scenes[model.scene ?? 0].nodes) soldier.add(nodes[index]);
  // Exercise normalization and the player's translation without altering the
  // imported Character rotation/scale or the bone-local coordinates.
  soldier.scale.setScalar(1.1);
  soldier.position.set(0.03, 0.02, -0.01);
  const player = new THREE.Group();
  player.position.set(0, 0, 3);
  player.add(soldier);
  player.updateMatrixWorld(true);
  return { player, soldier, nodes };
}

function createClip(name, nodes) {
  const animation = model.animations.find((candidate) => candidate.name === name);
  assert.ok(animation, `${name} exists in the checked-in GLB`);
  const tracks = animation.channels.map((channel) => {
    const sampler = animation.samplers[channel.sampler];
    assert.equal(sampler.interpolation ?? 'LINEAR', 'LINEAR');
    const property = { translation: 'position', rotation: 'quaternion', scale: 'scale' }[channel.target.path];
    assert.ok(property, 'fixture channel animates a transform');
    const Track = property === 'quaternion' ? THREE.QuaternionKeyframeTrack : THREE.VectorKeyframeTrack;
    // UUID targeting avoids ambiguous names and ':' parsing: every channel
    // must bind to the exact reconstructed node, including the animated hips.
    return new Track(`${nodes[channel.target.node].uuid}.${property}`,
      animationValues(sampler.input), animationValues(sampler.output));
  });
  return new THREE.AnimationClip(name, -1, tracks);
}

function snapshot(objects) {
  return objects.map((object) => ({
    object,
    parent: object.parent,
    name: object.name,
    position: object.position.toArray(),
    quaternion: object.quaternion.toArray(),
    scale: object.scale.toArray(),
    world: object.matrixWorld.elements.slice()
  }));
}

function assertClose(actual, expected, label, tolerance = 1e-6) {
  assert.equal(actual.length, expected.length, label);
  actual.forEach((value, index) => {
    assert.ok(Number.isFinite(value), `${label}[${index}] is finite`);
    assert.ok(Math.abs(value - expected[index]) <= tolerance,
      `${label}[${index}]: ${value} differs from ${expected[index]}`);
  });
}

function assertUnchanged(before) {
  for (const entry of before) {
    assert.equal(entry.object.parent, entry.parent, `${entry.name} retains its parent`);
    assert.equal(entry.object.name, entry.name);
    assert.deepEqual(entry.object.position.toArray(), entry.position, `${entry.name} position`);
    assert.deepEqual(entry.object.quaternion.toArray(), entry.quaternion, `${entry.name} rotation`);
    assert.deepEqual(entry.object.scale.toArray(), entry.scale, `${entry.name} scale`);
    assertClose(entry.object.matrixWorld.elements, entry.world, `${entry.name} world transform`);
  }
}

function descendants(root) {
  const result = [];
  root.traverse((object) => result.push(object));
  return result;
}

function gearGroups(soldier) {
  return ['military-gear-torso', 'military-gear-hips'].map((name) => {
    const group = soldier.getObjectByName(name);
    assert.ok(group?.isGroup, `${name} exists`);
    return group;
  });
}

test('gear preserves the imported rig and stays aligned with the upright soldier frame', () => {
  const { player, soldier, nodes } = createRig();
  const before = snapshot([player, soldier, ...nodes]);
  assert.equal(attachMilitaryGear(soldier), true);
  player.updateMatrixWorld(true);
  assertUnchanged(before);

  const [torso, hips] = gearGroups(soldier);
  assert.equal(torso.parent, soldier.getObjectByName('mixamorigSpine2'));
  assert.equal(hips.parent, soldier.getObjectByName('mixamorigHips'));
  for (const group of [torso, hips]) {
    const relative = soldier.matrixWorld.clone().invert().multiply(group.matrixWorld);
    const rotation = new THREE.Quaternion();
    relative.decompose(new THREE.Vector3(), rotation, new THREE.Vector3());
    assertClose(rotation.toArray(), [0, 0, 0, 1], `${group.name} upright orientation`);
    assertClose(group.getWorldPosition(new THREE.Vector3()).toArray(),
      group.parent.getWorldPosition(new THREE.Vector3()).toArray(), `${group.name} attachment origin`);
  }
});

for (const clipName of ['Run', 'Idle']) {
  test(`gear follows actual ${clipName} poses and player jumps without changing animation`, () => {
    const geared = createRig();
    const original = createRig();
    assert.equal(attachMilitaryGear(geared.soldier), true);
    const groups = gearGroups(geared.soldier);
    const localAttachments = groups.map((group) => group.matrix.clone());
    const originalParentPoses = groups.map((group) => group.parent.matrix.clone());
    const clip = createClip(clipName, geared.nodes);
    const controlClip = createClip(clipName, original.nodes);
    const mixer = new THREE.AnimationMixer(geared.soldier);
    const controlMixer = new THREE.AnimationMixer(original.soldier);
    mixer.clipAction(clip).play();
    controlMixer.clipAction(controlClip).play();
    let animatedAttachmentMoved = false;

    for (const fraction of [0, 0.17, 0.39, 0.67, 0.91]) {
      mixer.setTime(clip.duration * fraction);
      controlMixer.setTime(controlClip.duration * fraction);
      for (const rig of [geared, original]) {
        rig.player.position.set(0.4, fraction > 0.3 && fraction < 0.8 ? 1.2 : 0, 3);
        rig.player.updateMatrixWorld(true);
      }
      geared.nodes.forEach((node, index) => {
        assertClose(node.matrixWorld.elements, original.nodes[index].matrixWorld.elements,
          `${clipName} pose ${fraction}: ${node.name}`, 1e-5);
      });
      groups.forEach((group, index) => {
        const expected = group.parent.matrixWorld.clone().multiply(localAttachments[index]);
        assertClose(group.matrixWorld.elements, expected.elements,
          `${clipName} pose ${fraction}: ${group.name}`, 1e-5);
        // Check a bone-local change, so moving/jumping the player cannot make
        // this assertion pass when animation bindings silently fail.
        if (group.parent.matrix.elements.some((value, element) =>
          Math.abs(value - originalParentPoses[index].elements[element]) > 1e-5)) {
          animatedAttachmentMoved = true;
        }
      });
    }
    assert.ok(animatedAttachmentMoved, `${clipName} tracks actually moved the reconstructed rig`);
    mixer.stopAllAction();
    controlMixer.stopAllAction();
  });
}

test('gear limits draw calls and shares two untextured materials without shadow casters', () => {
  const { soldier } = createRig();
  assert.equal(attachMilitaryGear(soldier), true);
  const meshes = gearGroups(soldier).flatMap((group) => descendants(group).filter((object) => object.isMesh));
  assert.ok(meshes.length > 0 && meshes.length <= 4, 'at most four gear meshes');
  const materials = new Set(meshes.flatMap((mesh) => Array.isArray(mesh.material) ? mesh.material : [mesh.material]));
  assert.equal(materials.size, 2, 'canvas and leather materials are shared across attachments');
  for (const mesh of meshes) {
    assert.equal(mesh.castShadow, false, 'gear adds no shadow-map draw');
    assert.ok(mesh.geometry.isBufferGeometry);
    assert.ok(mesh.geometry.attributes.position.count > 0);
    assert.ok(mesh.geometry.attributes.normal.count > 0);
    assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite), 'finite gear geometry');
  }
  for (const material of materials) {
    assert.ok(material.isMeshStandardMaterial, 'gear uses standard lighting');
    assert.equal(Object.values(material).some((value) => value?.isTexture), false, 'no texture assets');
  }
});

test('calling the attachment twice leaves the existing gear and scene unchanged', () => {
  const { player, soldier } = createRig();
  assert.equal(attachMilitaryGear(soldier), true);
  player.updateMatrixWorld(true);
  const objects = descendants(player);
  const before = snapshot(objects);
  assert.equal(attachMilitaryGear(soldier), false);
  player.updateMatrixWorld(true);
  assert.deepEqual(descendants(player), objects, 'no duplicate nodes or replacement resources');
  assertUnchanged(before);
});

test('missing attachment bones retain the original rig without partial gear', () => {
  const { player, soldier, nodes } = createRig();
  soldier.getObjectByName('mixamorigSpine2').name = 'unsupportedChest';
  const before = snapshot([player, soldier, ...nodes]);
  const originalObjects = descendants(player);
  assert.equal(attachMilitaryGear(soldier), false);
  player.updateMatrixWorld(true);
  assert.deepEqual(descendants(player), originalObjects);
  assertUnchanged(before);
});

test('a degenerate rig retains the original hierarchy without allocating partial gear', () => {
  const { player, soldier, nodes } = createRig();
  for (const node of nodes) {
    if (node.isBone) node.position.set(0, 0, 0);
  }
  player.updateMatrixWorld(true);
  const before = snapshot([player, soldier, ...nodes]);
  const originalObjects = descendants(player);
  assert.equal(attachMilitaryGear(soldier), false);
  player.updateMatrixWorld(true);
  assert.deepEqual(descendants(player), originalObjects);
  assertUnchanged(before);
});
