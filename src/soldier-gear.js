import {
  BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute,
  Group, Mesh, MeshStandardMaterial, Vector3
} from 'three';

// Untextured canvas and leather shapes; no downloaded assets or per-frame work.
function mergeParts(parts) {
  const positions = [];
  const normals = [];
  for (const part of parts) {
    const geometry = part.index ? part.toNonIndexed() : part;
    positions.push(...geometry.attributes.position.array);
    normals.push(...geometry.attributes.normal.array);
    if (geometry !== part) geometry.dispose();
    part.dispose();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function box(size, position) {
  return new BoxGeometry(...size).translate(...position);
}

function addMesh(group, parts, material, size) {
  const geometry = mergeParts(parts);
  geometry.scale(size, size, size);
  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  // Keep the existing mobile shadow budget: gear adds no shadow-map draws.
  mesh.castShadow = false;
  group.add(mesh);
}

export function attachMilitaryGear(soldier) {
  if (soldier.getObjectByName('military-gear-torso')) return false;
  const bones = new Map();
  soldier.traverse((object) => {
    if (object.isBone) {
      bones.set(object.name.replace(/[^a-z0-9]/gi, '').toLowerCase(), object);
    }
  });
  const hips = bones.get('mixamorighips') || bones.get('hips');
  const torso = bones.get('mixamorigspine2') || bones.get('spine2');
  // A different or missing rig keeps the original soldier fully playable.
  if (!hips || !torso) return false;

  soldier.updateWorldMatrix(true, true);
  const hipsPosition = soldier.worldToLocal(hips.getWorldPosition(new Vector3()));
  const torsoPosition = soldier.worldToLocal(torso.getWorldPosition(new Vector3()));
  const size = torsoPosition.distanceTo(hipsPosition);
  if (!Number.isFinite(size) || size < 0.01 || size > 3) return false;

  const canvas = new MeshStandardMaterial({ color: 0x5c6046, roughness: 0.98 });
  const leather = new MeshStandardMaterial({ color: 0x46372a, roughness: 0.9 });
  const torsoGear = new Group();
  torsoGear.name = 'military-gear-torso';
  torsoGear.position.copy(torsoPosition);
  const hipsGear = new Group();
  hipsGear.name = 'military-gear-hips';
  hipsGear.position.copy(hipsPosition);

  // Soldier faces -Z. Author shapes in its upright model frame (+Z is rear),
  // then preserve that frame when reparenting to the rotated Mixamo bones.
  const bedroll = new CylinderGeometry(0.18, 0.18, 1.2, 8)
    .rotateZ(Math.PI / 2).translate(0, 0.48, 0.54);
  addMesh(torsoGear, [
    box([1.02, 1.06, 0.38], [0, -0.2, 0.54]),
    box([1.08, 0.22, 0.42], [0, 0.23, 0.54]),
    box([0.73, 0.33, 0.12], [0, -0.43, 0.79]),
    bedroll
  ], canvas, size);
  addMesh(torsoGear, [
    ...[-0.3, 0.3].map((x) => box([0.065, 1.1, 0.035], [x, -0.2, 0.75])),
    ...[-0.36, 0.36].map((x) => box([0.06, 0.38, 0.36], [x, 0.48, 0.54]))
  ], leather, size);
  addMesh(hipsGear, [-0.4, 0.4].flatMap((x) => [
    box([0.34, 0.38, 0.3], [x, -0.08, 0.43]),
    box([0.36, 0.09, 0.32], [x, 0.1, 0.43])
  ]), canvas, size);
  addMesh(hipsGear, [
    box([1.2, 0.09, 0.06], [0, 0.09, 0.25]),
    ...[-0.4, 0.4].map((x) => box([0.06, 0.24, 0.025], [x, -0.02, 0.6]))
  ], leather, size);

  soldier.add(torsoGear, hipsGear);
  soldier.updateWorldMatrix(true, true);
  torso.attach(torsoGear);
  hips.attach(hipsGear);
  return true;
}
