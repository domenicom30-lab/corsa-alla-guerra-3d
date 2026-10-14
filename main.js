import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

// CORSA ALLA GUERRA 3D - Enhanced Edition
// Three.js / Android

const canvas = document.querySelector('#game');
const message = document.querySelector('#message');
const stats = document.querySelector('#stats');

const leftButton = document.querySelector('#left');
const rightButton = document.querySelector('#right');
const jumpButton = document.querySelector('#jump');

if (!canvas || !message || !stats ||
    !leftButton || !rightButton || !jumpButton) {
  throw new Error('Elementi del gioco mancanti in index.html');
}

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});

// Limita i pixel elaborati sui display Android ad alta densità.
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.15));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.autoUpdate = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9dbbd1);
scene.fog = new THREE.FogExp2(0x9dbbd1, 0.0055);

const camera = new THREE.PerspectiveCamera(
  62, innerWidth / innerHeight, 0.1, 180
);

camera.position.set(0, 2.9, 6.1);
camera.lookAt(0, 1.35, -5);

// Illuminazione
scene.add(
  new THREE.HemisphereLight(0xdce8e8, 0x35372b, 1.9)
);

const sun = new THREE.DirectionalLight(0xffdfb8, 2.8);
sun.position.set(-7, 13, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -11;
sun.shadow.camera.right = 11;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -10;
sun.shadow.normalBias = 0.035;
scene.add(sun);

const fillLight = new THREE.DirectionalLight(0xaac4d2, 0.65);
fillLight.position.set(6, 5, -8);
scene.add(fillLight);

// Materiali
function mat(color, roughness = 0.9, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    ...extra
  });
}

const dirtMat = mat(0x514634);
const roadMat = mat(0x53504a);
const vergeMat = mat(0x897b61);
const stripeMat = mat(0xc9c2aa);
const barkMat = mat(0x403024);
const darkMat = mat(0x282c28);
const uniformMat = mat(0x555d3d);
const uniformDarkMat = mat(0x414833);
const skinMat = mat(0x9e755a);
const bootMat = mat(0x252620);
const beltMat = mat(0x35372a);
const metalMat = mat(0x41473f, 0.62, {
  metalness: 0.25
});
const packMat = mat(0x424a32);

const leafMats = [
  mat(0x243a29),
  mat(0x30462e),
  mat(0x3b5033),
  mat(0x46583a)
];

const rockMats = [
  mat(0x57564c),
  mat(0x48483e),
  mat(0x716959)
];

// Texture procedurale del terreno
function createDirtTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;

  const ctx = c.getContext('2d');
  ctx.fillStyle = '#514634';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 6000; i++) {
    const shade = 35 + Math.random() * 60;

    ctx.fillStyle =
      `rgba(${shade},${shade * 0.87},${shade * 0.65},${Math.random() * 0.28})`;

    ctx.beginPath();
    ctx.ellipse(
      Math.random() * 256,
      Math.random() * 256,
      1 + Math.random() * 4,
      1 + Math.random() * 2,
      Math.random() * 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(c);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 25);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(
    4,
    renderer.capabilities.getMaxAnisotropy()
  );

  return texture;
}

// Texture procedurali leggere: dettagli visivi senza download esterni
function createSurfaceTexture(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const road = kind === 'road';
  ctx.fillStyle = road ? '#55524d' : '#63533e';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 17000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const v = Math.floor(35 + Math.random() * 110);
    ctx.fillStyle = road
      ? `rgba(${v},${v},${v},${Math.random() * .18})`
      : `rgba(${v},${Math.floor(v*.82)},${Math.floor(v*.6)},${Math.random()*.2})`;
    ctx.fillRect(x, y, Math.random()*4+1, Math.random()*4+1);
  }
  if (road) {
    for (let i=0;i<70;i++) {
      ctx.strokeStyle = `rgba(24,22,20,${Math.random()*.13})`;
      ctx.lineWidth = Math.random()*2+.3;
      ctx.beginPath();
      const x=Math.random()*512, y=Math.random()*512;
      ctx.moveTo(x,y); ctx.lineTo(x+Math.random()*12-6,y+Math.random()*100);
      ctx.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(2, 30);
  t.colorSpace=THREE.SRGBColorSpace;
  t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return t;
}
const dirtTexture = createDirtTexture();
dirtMat.map = dirtTexture;
roadMat.map = createSurfaceTexture('road');
// Preferisce mappe PBR locali quando presenti; mantiene le texture generate come fallback.
const pbrLoader = new THREE.TextureLoader();
function installPBR(material, basePath, repeatX, repeatY) {
  const configure = (texture, color = false) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (color) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };
  pbrLoader.load(basePath + '_color.jpg', tex => {
    material.map = configure(tex, true);
    material.color.set(0xffffff);
    material.needsUpdate = true;
  }, undefined, () => {});
  pbrLoader.load(basePath + '_normal.jpg', tex => {
    material.normalMap = configure(tex);
    material.normalScale = new THREE.Vector2(0.6, 0.6);
    material.needsUpdate = true;
  }, undefined, () => {});
  pbrLoader.load(basePath + '_roughness.jpg', tex => {
    material.roughnessMap = configure(tex);
    material.roughness = 1;
    material.needsUpdate = true;
  }, undefined, () => {});
}
installPBR(roadMat, './assets/textures/road', 2, 30);
installPBR(dirtMat, './assets/textures/forest', 2, 25);

vergeMat.map = createSurfaceTexture('dirt');

// Funzioni per creare oggetti 3D
function addBox(parent, size, material, pos, cast = true) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    material
  );

  mesh.position.set(...pos);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

function addSphere(parent, radius, material, pos, scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 12, 8),
    material
  );

  mesh.position.set(...pos);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  parent.add(mesh);

  return mesh;
}

function addCylinder(
  parent, top, bottom, height, material, pos, sides = 8
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(top, bottom, height, sides),
    material
  );

  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

// Terreno e strada
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 190),
  dirtMat
);

ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.23, -55);
ground.receiveShadow = true;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 180),
  roadMat
);

road.rotation.x = -Math.PI / 2;
road.position.set(0, -0.07, -55);
road.receiveShadow = true;
scene.add(road);

for (const x of [-4.1, 4.1]) {
  const verge = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.025, 180),
    vergeMat
  );

  verge.position.set(x, -0.065, -55);
  verge.receiveShadow = true;
  scene.add(verge);
}

// Tracce di pneumatici
for (const x of [-1.15, 1.15]) {
  const track = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 180),
    mat(0x615545)
  );

  track.rotation.x = -Math.PI / 2;
  track.position.set(x, -0.052, -55);
  scene.add(track);
}

// Strada forestale: niente strisce bianche da asfalto.
const dashes = [];

const forest = [];
const bushes = [];
const rocks = [];

// Alberi
function createTree(x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);

  addCylinder(
    group, 0.16, 0.29, 3.1,
    barkMat, [0, 1.5, 0], 8
  );

  // Rami asimmetrici con aghi a ciuffi: silhouette meno geometrica
  // rispetto alle precedenti quattro chiome coniche.
  const twigMat = barkMat;
  for (let tier = 0; tier < 5; tier++) {
    const h = 1.15 + tier * 0.39;
    const radius = 1.36 * (1 - tier / 9);
    const branches = tier < 2 ? 5 : 4;
    for (let j = 0; j < branches; j++) {
      const angle = (j / branches) * Math.PI * 2 + tier * 1.17;
      const reach = radius * (0.77 + Math.random() * 0.3);
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.052, reach, 4),
        twigMat
      );
      branch.position.set(Math.cos(angle) * reach * 0.48, h + 0.05, Math.sin(angle) * reach * 0.48);
      branch.rotation.z = Math.PI / 2 - Math.atan2(0.22, reach);
      branch.rotation.y = -angle;
      group.add(branch);
      const needle = new THREE.Mesh(
        new THREE.ConeGeometry(0.23 + radius * 0.13, reach * 1.03, 6),
        leafMats[(Math.random() * leafMats.length) | 0]
      );
      needle.position.set(Math.cos(angle) * reach * 0.65, h + 0.13, Math.sin(angle) * reach * 0.65);
      needle.rotation.z = Math.cos(angle) * 0.65;
      needle.rotation.x = -Math.sin(angle) * 0.65;
      needle.castShadow = tier % 2 === 0;
      group.add(needle);
    }
  }

  scene.add(group);
  forest.push(group);
}

// Cespugli
function createBush(x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);

  for (let i = 0; i < 5; i++) {
    addSphere(
      group,
      0.4,
      leafMats[i % leafMats.length],
      [
        (Math.random() - 0.5) * 0.9,
        0.22 + Math.random() * 0.35,
        (Math.random() - 0.5) * 0.8
      ],
      [1.1, 0.75, 1]
    );
  }

  scene.add(group);
  bushes.push(group);
}

// Rocce
function createRock(x, z, scale = 1) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.4, 0),
    rockMats[(Math.random() * rockMats.length) | 0]
  );

  rock.position.set(x, scale * 0.1, z);
  rock.scale.set(scale * 1.3, scale * 0.75, scale);
  rock.rotation.set(Math.random(), Math.random() * 3, Math.random());
  rock.castShadow = true;
  rock.receiveShadow = true;

  scene.add(rock);
  rocks.push(rock);
}

// Scenario militare ispirato a un percorso forestale storico
const scenery = [];
function sandbagWall(x, z, width = 2.4) {
  const group = new THREE.Group();
  const sack = mat(0x99856a);
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 6; i++) {
      const mesh = addSphere(group, 0.24, sack,
        [(i - 2.5) * width / 6 + (row % 2) * 0.12, 0.2 + row * 0.27, 0],
        [1.3, 0.68, 0.85]);
      mesh.rotation.z = (i % 2 ? 1 : -1) * 0.05;
    }
  }
  group.position.set(x, 0, z);
  scene.add(group);
  scenery.push(group);
}
function watchTower(x, z) {
  const g = new THREE.Group();
  const timber = mat(0x54422e);
  for (const dx of [-0.7, 0.7]) for (const dz of [-0.7, 0.7]) {
    addBox(g, [0.18, 5.6, 0.18], timber, [dx, 2.8, dz]);
  }
  addBox(g, [2.2, 0.25, 2.2], timber, [0, 5.25, 0]);
  addBox(g, [2.5, 0.24, 2.5], timber, [0, 6.7, 0]);
  // Ringhiere e parapetti per dare alla torre una silhouette credibile.
  for (const side of [-1, 1]) {
    addBox(g, [2.35, 0.12, 0.12], timber, [0, 6.15, side * 1.12]);
    addBox(g, [0.12, 0.12, 2.35], timber, [side * 1.12, 6.15, 0]);
    for (const offset of [-0.9, 0, 0.9]) {
      addBox(g, [0.1, 0.95, 0.1], timber, [offset, 5.7, side * 1.12]);
      addBox(g, [0.1, 0.95, 0.1], timber, [side * 1.12, 5.7, offset]);
    }
  }
  // Scala in legno appoggiata al lato della torre.
  for (const side of [-0.38, 0.38]) {
    const rail = addBox(g, [0.1, 5.8, 0.1], timber, [side, 2.8, 1.03]);
    rail.rotation.x = -0.15;
  }
  for (let step = 0; step < 13; step++) {
    addBox(g, [0.88, 0.09, 0.12], timber, [0, 0.42 + step * 0.4, 1.45 - step * 0.045]);
  }
  // Copertura a falde con una piccola sporgenza.
  const roofMat = mat(0x3f3a32, 1);
  for (const side of [-1, 1]) {
    const roof = addBox(g, [2.9, 0.12, 1.75], roofMat, [0, 7.2, side * 0.72]);
    roof.rotation.x = side * 0.38;
  }
  for (const y of [1.4, 3.0, 4.6]) {
    for (const side of [-1, 1]) {
      const beam = addBox(g, [0.12, 1.8, 0.12], timber, [side * 0.7, y, 0]);
      beam.rotation.z = side * 0.65;
    }
  }
  g.position.set(x, 0, z);
  scene.add(g);
  scenery.push(g);
}
function barricade(x, z) {
  const g = new THREE.Group();
  const wood = mat(0x54412d);
  for (const angle of [-0.72, 0.72]) {
    const beam = addBox(g, [0.18, 2.5, 0.18], wood, [0, 1.05, 0]);
    beam.rotation.z = angle;
  }
  addBox(g, [2.2, 0.16, 0.16], wood, [0, 1.1, 0]);
  g.position.set(x, 0, z);
  scene.add(g);
  scenery.push(g);
}
for (let z = -28; z > -150; z -= 38) {
  sandbagWall(-5.3, z);
  sandbagWall(5.3, z - 12);
  watchTower(9.2, z - 18);
  barricade(-5.1, z - 7);
}
// Foschia naturale al posto delle montagne coniche artificiali.
// Dettagli del sottobosco
// Vegetazione istanziata: una draw call per 500 fili anziché 500 mesh.
const grassCount = 300;
const grassMaterial = new THREE.MeshStandardMaterial({
  color: 0x647552, side: THREE.DoubleSide, roughness: 1
});
const grassGeometry = new THREE.ConeGeometry(0.12, 0.7, 3);
const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount);
const grassTransform = new THREE.Object3D();
const grassPositions = [];
let grassUpdateFrame = 0;
for (let i = 0; i < grassCount; i++) {
  const side = Math.random() < 0.5 ? -1 : 1;
  grassPositions.push({
    x: side * (4.7 + Math.random() * 17),
    z: 10 - Math.random() * 150,
    size: 0.45 + Math.random() * 1.25,
    angle: Math.random() * Math.PI * 2
  });
}
function updateGrass() {
  for (let i = 0; i < grassCount; i++) {
    const g = grassPositions[i];
    grassTransform.position.set(g.x, 0.13, g.z);
    grassTransform.rotation.set(0, g.angle, 0);
    grassTransform.scale.setScalar(g.size);
    grassTransform.updateMatrix();
    grass.setMatrixAt(i, grassTransform.matrix);
  }
  grass.instanceMatrix.needsUpdate = true;
}
updateGrass();
grass.frustumCulled = false;
scene.add(grass);
// Genera il paesaggio
for (let z = 15; z > -145; z -= 9) {
  createTree(
    -6 - Math.random() * 5,
    z,
    0.75 + Math.random() * 0.65
  );

  createTree(
    6 + Math.random() * 5,
    z - 2,
    0.75 + Math.random() * 0.65
  );

  if (Math.random() > 0.25) {
    createBush(
      -4.8 - Math.random() * 3,
      z - 1,
      0.6 + Math.random() * 0.6
    );

    createBush(
      4.8 + Math.random() * 3,
      z - 3,
      0.6 + Math.random() * 0.6
    );
  }

  if (Math.random() > 0.45) {
    createRock(
      -4.5 - Math.random() * 2,
      z - 2,
      0.4 + Math.random() * 0.7
    );

    createRock(
      4.5 + Math.random() * 2,
      z,
      0.4 + Math.random() * 0.7
    );
  }
}


 // Soldato 3D animato
const player = new THREE.Group();
scene.add(player);
player.position.set(0, 0, 3);

const soldierClock = new THREE.Clock();
let soldierMixer = null;
let soldierRun = null;
let soldierIdle = null;
let soldierJump = null;
let soldierActiveAction = null;

const loader = new GLTFLoader();

loader.load(
  './models/Soldier.glb',
  (gltf) => {
    const soldier = gltf.scene;

    soldier.rotation.y = Math.PI;

    soldier.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      // Mantieni i materiali PBR originali del GLB, senza appiattirli.
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material) continue;
        if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
          material.envMapIntensity = 0.8;
          material.needsUpdate = true;
        }
      }
      if (object.isSkinnedMesh) {
        object.frustumCulled = false;
      }
    });

    player.add(soldier);

    // Dimensioni e centratura: calcolo prima dello scaling, poi verifica.
    soldier.updateMatrixWorld(true);
    const originalBounds = new THREE.Box3().setFromObject(soldier);
    const originalHeight = originalBounds.max.y - originalBounds.min.y;
    if (originalHeight > 0.001) {
      soldier.scale.setScalar(1.9 / originalHeight);
      soldier.updateMatrixWorld(true);
      const scaledBounds = new THREE.Box3().setFromObject(soldier);
      soldier.position.y -= scaledBounds.min.y;
      soldier.position.x -= (scaledBounds.min.x + scaledBounds.max.x) / 2;
      soldier.position.z -= (scaledBounds.min.z + scaledBounds.max.z) / 2;
    }

    soldierMixer = new THREE.AnimationMixer(soldier);

    const clips = gltf.animations;
    const runClip = clips.find((clip) =>
      /run|walk/i.test(clip.name)
    );
    const idleClip = clips.find((clip) =>
      /idle|t-pose|tpose/i.test(clip.name)
    );
    const jumpClip = clips.find((clip) =>
      /jump|vault|hop/i.test(clip.name)
    );

    if (runClip) {
      soldierRun = soldierMixer.clipAction(runClip);
    }

    if (jumpClip) {
      soldierJump = soldierMixer.clipAction(jumpClip);
      soldierJump.setLoop(THREE.LoopOnce, 1);
      soldierJump.clampWhenFinished = true;
    }

    if (idleClip) {
      soldierIdle = soldierMixer.clipAction(idleClip);
    } else if (clips.length && !soldierRun) {
      soldierIdle = soldierMixer.clipAction(clips[0]);
    }

    console.log(
      'Soldato caricato. Animazioni:',
      clips.map((clip) => clip.name)
    );
  },
  undefined,
  (error) => {
    console.error('Errore caricamento Soldier.glb:', error);
    message.textContent = 'ERRORE NEL CARICAMENTO DEL SOLDATO';
  }
);


// Il modello Soldier.glb sostituisce il vecchio soldato costruito con cubi.

// Materiale tela dei sacchi con dettaglio superficiale procedurale.
// Un futuro set PBR locale potrà sostituirlo senza cambiare la geometria.
const sackCanvas = document.createElement('canvas');
sackCanvas.width = sackCanvas.height = 128;
const sackCtx = sackCanvas.getContext('2d');
sackCtx.fillStyle = '#a99a77';
sackCtx.fillRect(0, 0, 128, 128);
for (let i = 0; i < 128; i += 4) {
  sackCtx.strokeStyle = i % 8 === 0 ? '#877b60' : '#b9ab87';
  sackCtx.beginPath();
  sackCtx.moveTo(i, 0);
  sackCtx.lineTo(i, 128);
  sackCtx.moveTo(0, i);
  sackCtx.lineTo(128, i);
  sackCtx.stroke();
}
const sackTexture = new THREE.CanvasTexture(sackCanvas);
sackTexture.colorSpace = THREE.SRGBColorSpace;
const sackMat = new THREE.MeshStandardMaterial({map: sackTexture, roughness: 1});
const sackGeometry = new THREE.SphereGeometry(0.27, 12, 8);

// Ostacoli
const obstacles = [];
const lanes = [-2.5, 0, 2.5];

function createObstacle(z) {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const type = Math.random();
  const group = new THREE.Group();

  if (type < 0.38) {
    // Sacchi di sabbia
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const sack = new THREE.Mesh(sackGeometry, sackMat);
        sack.position.set((col - 1) * 0.39 + (row % 2) * 0.06, 0.23 + row * 0.28, 0);
        sack.scale.set(1.3, 0.75, 0.9);
        sack.rotation.z = (Math.random() - 0.5) * 0.15;
        sack.castShadow = true;
        sack.receiveShadow = true;
        group.add(sack);
      }
    }
  } else if (type < 0.7) {
    // Tronco caduto
    const log = addCylinder(
      group, 0.22, 0.25, 2.25,
      barkMat, [0, 0.32, 0], 10
    );

    log.rotation.z = Math.PI / 2;
  } else {
    // Barriera militare
    addBox(
      group, [1.15, 0.95, 0.32],
      uniformDarkMat, [0, 0.48, 0]
    );

    addBox(
      group, [1.35, 0.12, 0.38],
      metalMat, [0, 1.0, 0]
    );

    for (const x of [-0.38, 0.38]) {
      addBox(
        group, [0.16, 0.32, 0.4],
        stripeMat, [x, 0.72, 0.2], false
      );
    }
  }

  group.position.set(lane, 0, z);
  scene.add(group);

  obstacles.push({
    mesh: group,
    passed: false
  });
}

for (let z = -18; z > -130; z -= 12 + Math.random() * 7) {
  createObstacle(z);
      }

let running = false;
let ended = false;
let distance = 0;
let lane = 1;
let jumpVelocity = 0;
let jumping = false;
const speed = 0.25;
let score = 0;
let health = 3;
let lastTime = 0;

function start() {
  if (ended) {
    window.location.reload();
    return;
  }

  running = true;
  message.textContent = 'EVITA GLI OSTACOLI';
}

function move(direction) {
  if (!running) start();

  lane = Math.max(0, Math.min(2, lane + direction));
}

function jump() {
  if (!running) start();

  if (!jumping) {
    jumping = true;
    jumpVelocity = 0.19;
  }
}

leftButton.onclick = () => move(-1);
rightButton.onclick = () => move(1);
jumpButton.onclick = jump;

canvas.addEventListener('pointerdown', () => {
  if (!running && !ended) start();
});

window.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
    move(-1);
  }

  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
    move(1);
  }

  if (event.key === ' ' || event.key === 'ArrowUp') {
    jump();
  }
});

const targetCamera = new THREE.Vector3();

function animate(time) {
  requestAnimationFrame(animate);

  const dt = Math.min(((time - lastTime) / 16.67) || 1, 2);
  lastTime = time;

  if (running) {
    distance += speed * dt;
    stats.textContent = `❤️ ${'♥'.repeat(health)}  |  PUNTI: ${score}  |  TRAGUARDO: ${Math.max(0, 1000 - Math.floor(distance * 2))} m`;

    // Movimento laterale
    player.position.x = THREE.MathUtils.damp(
      player.position.x,
      lanes[lane],
      0.16,
      dt
    );

    player.rotation.z = THREE.MathUtils.damp(
      player.rotation.z,
      (player.position.x - lanes[lane]) * 0.08,
      0.15,
      dt
    );

    // Salto
    if (jumping) {
      player.position.y += jumpVelocity * dt;
      jumpVelocity -= 0.012 * dt;

      if (player.position.y <= 0) {
        player.position.y = 0;
        jumping = false;
        jumpVelocity = 0;
      }
    }

    // Animazione del soldato 3D
if (soldierMixer) {
  const desiredAction =
    jumping && soldierJump
      ? soldierJump
      : running
        ? soldierRun || soldierIdle
        : soldierIdle || soldierRun;

  if (desiredAction && desiredAction !== soldierActiveAction) {
    if (soldierActiveAction) {
      soldierActiveAction.fadeOut(0.18);
    }

    desiredAction.reset().fadeIn(0.18).play();
    soldierActiveAction = desiredAction;
  }

  soldierMixer.update(soldierClock.getDelta());
}

    // Strada in movimento
    for (const dash of dashes) {
      dash.position.z += speed * dt;

      if (dash.position.z > 12) {
        dash.position.z -= 168;
      }
    }

    // Riciclo degli elementi del paesaggio
    for (const tree of forest) {
      tree.position.z += speed * dt;

      if (tree.position.z > 15) {
        tree.position.z -= 160;
      }
    }

    for (const tuft of grassPositions) {
      tuft.z += speed * dt;
      if (tuft.z > 15) tuft.z -= 155;
    }
    // Aggiorna le matrici GPU a frame alterni per ridurre il carico CPU.
    if ((grassUpdateFrame++ & 1) === 0) updateGrass();

    for (const bush of bushes) {
      bush.position.z += speed * dt;

      if (bush.position.z > 15) {
        bush.position.z -= 160;
      }
    }

    for (const item of scenery) {
      item.position.z += speed * dt;
      if (item.position.z > 17) item.position.z -= 152;
    }

    for (const rock of rocks) {
      rock.position.z += speed * dt;

      if (rock.position.z > 15) {
        rock.position.z -= 160;
      }
    }

    // Collisioni con gli ostacoli
    for (const obstacle of obstacles) {
      obstacle.mesh.position.z += speed * dt;

      if (!obstacle.passed && obstacle.mesh.position.z > 3.1) {
        obstacle.passed = true;
        score += 10;

        if (
          Math.abs(obstacle.mesh.position.x - player.position.x) < 1.15 &&
          player.position.y < 0.65
        ) {
          running = false;
          ended = true;
          message.textContent =
            'SEI STATO FERMATO — TOCCA PER RIPROVARE';
        }
      }

      if (obstacle.mesh.position.z > 14) {
        obstacle.mesh.position.z = -125 - Math.random() * 15;
        obstacle.mesh.position.x =
          lanes[Math.floor(Math.random() * lanes.length)];
        obstacle.passed = false;
      }
    }

    if (distance > 500) {
      running = false;
      ended = true;
      message.textContent =
        'TRAGUARDO RAGGIUNTO — TOCCA PER RIGIOCARE';
    }
  }

  // Camera ravvicinata dietro al soldato
  targetCamera.set(
    player.position.x * 0.25,
    4.25 + player.position.y * 0.25,
    9.6
  );

  camera.position.lerp(targetCamera, 0.04);

  camera.lookAt(
    player.position.x * 0.18,
    1.5 + player.position.y * 0.35,
    -3
  );

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 1.15)
  );
});
