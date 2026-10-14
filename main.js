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

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87958e);
scene.fog = new THREE.FogExp2(0x87958e, 0.0115);

const camera = new THREE.PerspectiveCamera(
  62, innerWidth / innerHeight, 0.1, 180
);

camera.position.set(0, 4.25, 9.6);
camera.lookAt(0, 1.5, -3);

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
const roadMat = mat(0x393a34);
const vergeMat = mat(0x716954);
const stripeMat = mat(0xbdb49a);
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

const dirtTexture = createDirtTexture();
dirtMat.map = dirtTexture;
roadMat.map = dirtTexture;

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
    new THREE.BoxGeometry(0.22, 0.12, 180),
    vergeMat
  );

  verge.position.set(x, -0.02, -55);
  verge.receiveShadow = true;
  scene.add(verge);
}

// Tracce di pneumatici
for (const x of [-1.15, 1.15]) {
  const track = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 180),
    mat(0x302e26)
  );

  track.rotation.x = -Math.PI / 2;
  track.position.set(x, -0.052, -55);
  scene.add(track);
}

// Strisce centrali della strada
const dashes = [];

for (let z = 10; z > -155; z -= 7) {
  const dash = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.018, 2.1),
    stripeMat
  );

  dash.position.set(0, -0.035, z);
  scene.add(dash);
  dashes.push(dash);
}

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

  for (let i = 0; i < 4; i++) {
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(1.2 - i * 0.17, 2.5, 7),
      leafMats[(Math.random() * leafMats.length) | 0]
    );

    crown.position.set(
      (Math.random() - 0.5) * 0.25,
      2.2 + i * 0.72,
      (Math.random() - 0.5) * 0.2
    );

    crown.rotation.y = Math.random() * 2;
    crown.castShadow = true;
    group.add(crown);
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

// Genera il paesaggio
for (let z = 15; z > -145; z -= 5.5) {
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
let soldierActiveAction = null;

const loader = new GLTFLoader();

loader.load(
  './models/Soldier.glb',
  (gltf) => {
    const soldier = gltf.scene;

    soldier.rotation.y = Math.PI;

    soldier.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    player.add(soldier);

    // Adatta il modello a un'altezza di circa 1,9 metri
    soldier.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(soldier);
    const height = bounds.max.y - bounds.min.y;

    if (height > 0) {
      const scale = 1.9 / height;
      soldier.scale.setScalar(scale);
      soldier.position.y = -bounds.min.y * scale;
    }

    soldierMixer = new THREE.AnimationMixer(soldier);

    const clips = gltf.animations;
    const runClip = clips.find((clip) =>
      /run|walk/i.test(clip.name)
    );
    const idleClip = clips.find((clip) =>
      /idle|t-pose|tpose/i.test(clip.name)
    );

    if (runClip) {
      soldierRun = soldierMixer.clipAction(runClip);
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


// Corpo e giubbotto
addBox(torso, [0.68, 0.9, 0.36], uniformMat, [0, 0.1, 0]);
addBox(torso, [0.72, 0.13, 0.4], beltMat, [0, -0.17, 0]);


// Tasche e cinturone
for (const side of [-1, 1]) {
  addBox(
    torso, [0.17, 0.22, 0.12],
    packMat, [side * 0.25, -0.02, 0.22]
  );

  addBox(
    torso, [0.16, 0.18, 0.13],
    beltMat, [side * 0.22, -0.2, 0.23]
  );
}

addBox(torso, [0.3, 0.36, 0.2], packMat, [0, 0.22, -0.25]);
addBox(torso, [0.22, 0.12, 0.08], metalMat, [0, -0.17, 0.25]);

// Testa ed elmetto
addSphere(
  torso, 0.235, skinMat,
  [0, 0.77, 0], [0.9, 1.1, 0.9]
);

addSphere(
  torso, 0.255, uniformDarkMat,
  [0, 0.91, -0.015], [1.08, 0.58, 1.05]
);

addBox(
  torso, [0.55, 0.07, 0.5],
  uniformDarkMat, [0, 0.79, 0.06]
);

// Braccia, guanti, pantaloni e stivali
const legs = [];
const arms = [];

for (const side of [-1, 1]) {
  const arm = new THREE.Group();
  arm.position.set(side * 0.43, 0.42, 0);
  torso.add(arm);

  addBox(arm, [0.22, 0.49, 0.25], uniformMat, [0, -0.12, 0]);
  addBox(arm, [0.2, 0.22, 0.23], uniformDarkMat, [0, -0.39, 0.015]);
  addBox(arm, [0.2, 0.14, 0.22], darkMat, [0, -0.52, 0.02]);

  arms.push({ group: arm, side });

  const leg = new THREE.Group();
  leg.position.set(side * 0.19, 0.83, 0);
  player.add(leg);

  addBox(leg, [0.25, 0.57, 0.29], uniformDarkMat, [0, -0.27, 0]);
  addBox(leg, [0.28, 0.17, 0.38], bootMat, [0, -0.59, 0.055]);
  addBox(leg, [0.3, 0.07, 0.39], darkMat, [0, -0.65, 0.055]);

  legs.push({ group: leg, side });
}

// Ostacoli
const obstacles = [];
const lanes = [-2.5, 0, 2.5];

function createObstacle(z) {
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const type = Math.random();
  const group = new THREE.Group();

  if (type < 0.38) {
    // Sacchi di sabbia
    const sackMat = mat(0x81745a);

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const sack = addSphere(
          group, 0.27, sackMat,
          [(col - 1) * 0.38, 0.23 + row * 0.28, 0],
          [1.3, 0.75, 0.9]
        );

        sack.rotation.z = (Math.random() - 0.5) * 0.15;
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
    stats.textContent = `Distanza: ${Math.floor(distance * 2)} m`;

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
    jumping && soldierRun
      ? soldierRun
      : running
        ? soldierRun
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

    for (const bush of bushes) {
      bush.position.z += speed * dt;

      if (bush.position.z > 15) {
        bush.position.z -= 160;
      }
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
    Math.min(window.devicePixelRatio || 1, 1.5)
  );
});
