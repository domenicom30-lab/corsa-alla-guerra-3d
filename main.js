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
scene.background = new THREE.Color(0xa8b6b5);
scene.fog = new THREE.FogExp2(0xa8b6b5, 0.010);

const camera = new THREE.PerspectiveCamera(
  62, innerWidth / innerHeight, 0.1, 180
);

camera.position.set(0, 3.3, 7.0);
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

// Texture condivisa di legno stagionato per torrette, casse e barriere.
// Generata una sola volta: nessun download o geometria aggiuntiva.
function createWeatheredWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#80674c'; ctx.fillRect(0, 0, 256, 512);
  let seed = 98731;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 460; i++) {
    const x = rnd() * 256, y = rnd() * 512;
    ctx.strokeStyle = rnd() > 0.5 ? 'rgba(36,24,18,0.19)' : 'rgba(205,172,122,0.20)';
    ctx.lineWidth = 0.5 + rnd() * 2.6;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + rnd()*9-4, y+35, x+rnd()*13-6, y+90, x+rnd()*12-6, y+105+rnd()*160);
    ctx.stroke();
  }
  for (let i = 0; i < 22; i++) {
    const x = rnd()*256, y = rnd()*512;
    ctx.strokeStyle = 'rgba(43,30,23,0.30)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.ellipse(x,y,2+rnd()*5,8+rnd()*18,rnd()*0.25,0,Math.PI*2);ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return texture;
}
const woodTexture = createWeatheredWoodTexture();
function weatheredWood(color = 0xffffff) {
  return new THREE.MeshStandardMaterial({map: woodTexture, color, roughness: 0.98});
}

const dirtMat = mat(0x514634);
const roadMat = mat(0x53504a);
const vergeMat = mat(0x897b61);
const stripeMat = mat(0xc9c2aa);
const barkMat = weatheredWood(0x8e806c);
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

// Solchi irregolari da mezzi militari, non due linee perfette.
// Una sola texture procedurale condivisa dai due solchi, senza mesh extra.
function createWheelRutTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 512;
  const ctx = c.getContext('2d');
  let seed = 41;
  const rnd = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  for (let y = 0; y < 512; y += 3) {
    const drift = Math.sin(y * 0.031) * 9 + Math.sin(y * 0.087) * 4;
    const width = 18 + rnd() * 13;
    const opacity = 0.11 + rnd() * 0.17;
    ctx.fillStyle = 'rgba(45,32,23,' + opacity + ')';
    ctx.fillRect(64 + drift - width / 2, y, width, 2 + rnd() * 5);
    if (rnd() > 0.45) {
      ctx.fillStyle = 'rgba(23,20,16,0.14)';
      ctx.fillRect(64 + drift - width / 2, y, 3, 5 + rnd() * 9);
      ctx.fillRect(64 + drift + width / 2 - 3, y, 3, 5 + rnd() * 9);
    }
  }
  const texture = new THREE.CanvasTexture(c);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 16);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const rutMaterial = new THREE.MeshBasicMaterial({
  map: createWheelRutTexture(), transparent: true,
  opacity: 0.8, depthWrite: false, polygonOffset: true,
  polygonOffsetFactor: -1, side: THREE.DoubleSide
});
for (const x of [-1.45, 1.45]) {
  const rut = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 180), rutMaterial);
  rut.rotation.x = -Math.PI / 2;
  rut.position.set(x, -0.051, -55);
  scene.add(rut);
}

// Pozzanghere e fango umido lungo i margini della carreggiata.
// Geometria condivisa e materiale senza ombre: effetto leggero per Android.
const puddleGeometry = new THREE.CircleGeometry(1, 18);
const puddleMaterial = new THREE.MeshStandardMaterial({
  color: 0x48585b, roughness: 0.24, metalness: 0.12,
  transparent: true, opacity: 0.69, depthWrite: false,
  polygonOffset: true, polygonOffsetFactor: -2,
  side: THREE.DoubleSide
});
const mudRimMaterial = new THREE.MeshStandardMaterial({
  color: 0x342e25, roughness: 1, transparent: true,
  opacity: 0.55, depthWrite: false, side: THREE.DoubleSide
});
const puddles = [];
let puddleSeed = 7829;
const puddleRand = () => ((puddleSeed = (puddleSeed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < 28; i++) {
  const z = 10 - i * 5.9;
  const x = (puddleRand() > 0.5 ? 1 : -1) * (2.25 + puddleRand() * 1.05);
  const sx = 0.42 + puddleRand() * 0.65;
  const sz = 0.7 + puddleRand() * 1.25;
  const rim = new THREE.Mesh(puddleGeometry, mudRimMaterial);
  rim.rotation.x = -Math.PI / 2;
  rim.scale.set(sx * 1.2, sz * 1.16, 1);
  rim.position.set(x, -0.047, z);
  scene.add(rim);
  const water = new THREE.Mesh(puddleGeometry, puddleMaterial);
  water.rotation.x = -Math.PI / 2;
  water.scale.set(sx, sz, 1);
  water.position.set(x, -0.043, z);
  scene.add(water);
  puddles.push({rim, water});
}

// Strada forestale: niente strisce bianche da asfalto.
const dashes = [];

const forest = [];
const bushes = [];
const rocks = [];

// Alberi
// Chiome con silhouette organiche su piani incrociati: pochi draw call,
// molto meno geometriche delle precedenti decine di coni per albero.
function makePineFoliage() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  let seed = 173;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let level = 0; level < 28; level++) {
    const y = 72 + level * 13;
    const width = Math.sin((level / 29) * Math.PI * 0.82) * 111 + 7;
    for (let side of [-1, 1]) {
      for (let twig = 0; twig < 7; twig++) {
        const reach = width * (0.55 + rnd() * 0.5);
        const yy = y + (rnd() - 0.5) * 20;
        ctx.strokeStyle = ['#253c2d','#304d35','#3b593b','#4b6443'][Math.floor(rnd()*4)];
        ctx.lineWidth = 3 + rnd() * 7;
        ctx.beginPath();
        ctx.moveTo(128 + side * (rnd() * 12), yy - 8);
        ctx.lineTo(128 + side * reach, yy + 6 + rnd() * 17);
        ctx.stroke();
        for (let n = 0; n < 7; n++) {
          const t = n / 7;
          const xx = 128 + side * reach * t;
          const py = yy + t * 12;
          ctx.strokeStyle = ['#29422e','#355337','#456044'][Math.floor(rnd()*3)];
          ctx.lineWidth = 1.3 + rnd() * 2;
          ctx.beginPath();
          ctx.moveTo(xx, py - 10 - rnd()*8);
          ctx.lineTo(xx + side * (5 + rnd()*10), py + 6 + rnd()*10);
          ctx.stroke();
        }
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return new THREE.MeshStandardMaterial({map:texture, transparent:true, alphaTest:0.35,
    side:THREE.DoubleSide, depthWrite:true, roughness:1});
}
const pineFoliageMat = makePineFoliage();
const pineFoliageGeo = new THREE.PlaneGeometry(3.5, 5.2);
const pineTrunkGeo = new THREE.CylinderGeometry(0.10, 0.22, 4.8, 6);
function createTree(x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  const trunk = new THREE.Mesh(pineTrunkGeo, barkMat);
  trunk.position.y = 2.4;
  trunk.castShadow = true;
  group.add(trunk);
  for (let i = 0; i < 3; i++) {
    const foliage = new THREE.Mesh(pineFoliageGeo, pineFoliageMat);
    foliage.position.y = 2.9;
    foliage.rotation.y = i * Math.PI / 3 + 0.17;
    foliage.castShadow = i === 0;
    foliage.receiveShadow = false;
    group.add(foliage);
  }
  scene.add(group);
  forest.push(group);
}

// Cespugli
// Cespugli a foglie ritagliate: silhouette naturali con poche superfici.
function createShrubMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  let seed = 521;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 95; i++) {
    const x = 24 + rnd() * 208, y = 38 + rnd() * 192;
    const radius = 8 + rnd() * 23;
    ctx.fillStyle = ['#233e2c','#304c32','#41623a','#506d40','#62794a'][Math.floor(rnd()*5)];
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * (0.4 + rnd()*0.4), rnd()*6.28, 0, Math.PI*2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({map:texture, transparent:true, alphaTest:0.35,
    side:THREE.DoubleSide, roughness:1, depthWrite:true});
}
const shrubMaterial = createShrubMaterial();
const shrubGeometry = new THREE.PlaneGeometry(1.7, 1.35);
function createBush(x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  for (let i = 0; i < 3; i++) {
    const foliage = new THREE.Mesh(shrubGeometry, shrubMaterial);
    foliage.position.y = 0.64;
    foliage.rotation.y = i * Math.PI / 3;
    foliage.castShadow = false;
    group.add(foliage);
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

// Scenario militare ispirato a un percorso forestale storico
const scenery = [];
function sandbagWall(x, z, width = 2.4) {
  const group = new THREE.Group();
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(sackGeometry, sackMat);
      mesh.position.set((i - 2.5) * width / 6 + (row % 2) * 0.12, 0.2 + row * 0.27, 0);
      mesh.scale.set(1.3, 0.68, 0.85);
      mesh.castShadow = row === 3;
      mesh.receiveShadow = true;
      group.add(mesh);
      mesh.rotation.z = (i % 2 ? 1 : -1) * 0.05;
    }
  }
  group.position.set(x, 0, z);
  scene.add(group);
  scenery.push(group);
}
function watchTower(x, z) {
  const g = new THREE.Group();
  const timber = weatheredWood(0xb3a18a);
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
  const wood = weatheredWood(0xa7977e);
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
// Traguardo 3D: portale militare con striscione rosso e sacchi laterali.
// Compare negli ultimi 200 metri, senza entrare nel riciclo degli ostacoli.
const finishGate = new THREE.Group();
const finishTimber = weatheredWood(0x96816c);
const finishRed = mat(0x7e2928, 0.95, {side: THREE.DoubleSide});
for (const side of [-1, 1]) {
  const x = side * 4.25;
  addBox(finishGate, [0.35, 5.1, 0.35], finishTimber, [x, 2.55, 0]);
  addBox(finishGate, [0.55, 0.55, 0.55], finishTimber, [x, 0.28, 0]);
  // Rinforzi diagonali del portale.
  const brace = addBox(finishGate, [0.17, 2.0, 0.18], finishTimber, [x-side*0.5, 2.9, 0]);
  brace.rotation.z = side * 0.52;
  for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) {
    const finishSack = new THREE.Mesh(sackGeometry, sackMat);
    finishSack.position.set(side * (5.05 + (i % 2)*0.3), 0.23 + row*0.33, (i-1.5)*0.56);
    finishSack.scale.set(1.35, 0.65, 1);
    finishSack.receiveShadow = true;
    finishGate.add(finishSack);
  }
}
addBox(finishGate, [9.0, 0.26, 0.35], finishTimber, [0, 5.05, 0]);
const bannerCanvas = document.createElement('canvas');
bannerCanvas.width = 1024; bannerCanvas.height = 192;
const bannerCtx = bannerCanvas.getContext('2d');
bannerCtx.fillStyle = '#722927'; bannerCtx.fillRect(0, 0, 1024, 192);
// Tessuto consumato: pieghe, macchie e bordi scoloriti senza texture esterne.
let bannerSeed = 93;
const bannerRandom = () => ((bannerSeed = (bannerSeed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < 1800; i++) {
  const x = bannerRandom() * 1024, y = bannerRandom() * 192;
  bannerCtx.fillStyle = bannerRandom() > 0.5 ? 'rgba(235,171,135,0.07)' : 'rgba(23,13,12,0.10)';
  bannerCtx.fillRect(x, y, 1 + bannerRandom() * 21, 1 + bannerRandom() * 4);
}
for (let i = 0; i < 13; i++) {
  const x = 35 + bannerRandom() * 954;
  bannerCtx.fillStyle = 'rgba(20,12,12,0.10)';
  bannerCtx.fillRect(x, 0, 3 + bannerRandom() * 11, 192);
}
bannerCtx.strokeStyle = '#b87561'; bannerCtx.lineWidth = 12;
bannerCtx.strokeRect(8, 8, 1008, 176);
bannerCtx.fillStyle = '#f4e8d6'; bannerCtx.font = 'bold 112px Arial';
bannerCtx.textAlign = 'center'; bannerCtx.textBaseline = 'middle';
bannerCtx.fillText('TRAGUARDO', 512, 101);
const bannerTexture = new THREE.CanvasTexture(bannerCanvas);
bannerTexture.colorSpace = THREE.SRGBColorSpace;
const banner = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 1.45),
  new THREE.MeshBasicMaterial({map: bannerTexture, side: THREE.DoubleSide}));
banner.position.set(0, 4.2, 0.04);
finishGate.add(banner);
finishGate.visible = false;
finishGate.position.set(0, 0, -97);
scene.add(finishGate);

// Foschia naturale al posto delle montagne coniche artificiali.
// Dettagli del sottobosco
// Vegetazione istanziata: una draw call per 500 fili anziché 500 mesh.
const grassCount = 300;
const grassMaterial = new THREE.MeshStandardMaterial({
  color: 0x647552, side: THREE.DoubleSide, roughness: 1
});
// Lama d'erba incurvata invece di coni appuntiti.
const grassGeometry = new THREE.BufferGeometry();
grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
  -0.11,0,0, 0.11,0,0, -0.065,0.32,0.03,
   0.11,0,0, 0.065,0.32,0.03, -0.065,0.32,0.03,
  -0.065,0.32,0.03, 0.065,0.32,0.03, 0.02,0.76,0.13
], 3));
grassGeometry.computeVertexNormals();
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
    grassTransform.position.set(g.x, 0, g.z);
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

    // Il GLB guarda gia verso -Z: non ruotarlo verso la telecamera.
    soldier.rotation.y = 0;

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
          // Variante uniforme scura ispirata al riferimento: preserva
          // le texture e non altera scheletro, animazioni o numero di mesh.
          const partName = (object.name + ' ' + (material.name || '')).toLowerCase();
          const exposedSkin = /skin|face|head|hand|neck|eye|teeth|hair/.test(partName);
          if (!exposedSkin && material.color) {
            // Moltiplicatore cromatico, non sostituzione della texture PBR.
            material.color.multiply(new THREE.Color(0x53575b));
            material.roughness = Math.max(material.roughness ?? 0.8, 0.83);
          }
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

    // Rimuove la traslazione verticale del nodo radice dalla corsa:
    // il personaggio resta appoggiato al terreno, mentre le ossa si animano.
    const groundedRunClip = runClip ? runClip.clone() : null;
    if (groundedRunClip) {
      groundedRunClip.tracks = groundedRunClip.tracks.filter((track) => {
        if (!track.name.endsWith('.position')) return true;
        const node = track.name.slice(0, -'.position'.length).toLowerCase();
        return !/^(root|armature|hips|pelvis|mixamorig:hips)$/.test(node);
      });
      soldierRun = soldierMixer.clipAction(groundedRunClip);
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
// Ostacoli
const obstacles = [];
const lanes = [-2.5, 0, 2.5];

// Casse militari in legno con assi e rinforzi: materiali condivisi.
const crateWood = weatheredWood(0xc5a98a);
const crateTrim = weatheredWood(0x786450);
function createSupplyCrate(parent, x, y, z, size = 1) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(size);
  addBox(g, [1, 0.95, 1], crateWood, [0, 0.48, 0]);
  for (const side of [-1, 1]) {
    for (const offset of [-0.39, 0.39]) {
      addBox(g, [0.09, 0.98, 0.09], crateTrim, [offset, 0.48, side*0.52]);
      addBox(g, [0.09, 0.98, 0.09], crateTrim, [side*0.52, 0.48, offset]);
    }
    const brace = addBox(g, [0.08, 1.17, 0.08], crateTrim, [0, 0.48, side*0.53]);
    brace.rotation.z = 0.72;
  }
  addBox(g, [1.09, 0.1, 1.09], crateTrim, [0, 0.99, 0]);
  parent.add(g);
  return g;
}

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
  } else if (type < 0.62) {
    // Tronco caduto
    const log = addCylinder(
      group, 0.22, 0.25, 2.25,
      barkMat, [0, 0.32, 0], 10
    );

    log.rotation.z = Math.PI / 2;
  } else if (type < 0.82) {
    // Cassa di rifornimenti, ostacolo leggibile e coerente con la scena.
    createSupplyCrate(group, 0, 0, 0, 1.05);
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

// The end-of-run overlay tells players to tap to restart. Allow that tap
// to reach start(), which already handles the ended state by reloading.
canvas.addEventListener('pointerdown', () => {
  if (!running) start();
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

    // Il portale si avvicina solo nell'ultimo tratto del livello.
    if (distance >= 400) {
      finishGate.visible = true;
      // Ferma il portale prima che oltrepassi il personaggio o la camera.
      finishGate.position.z = -97 + Math.min(distance - 400, 100) * 0.90;
    }

    // Strada in movimento
    for (const dash of dashes) {
      dash.position.z += speed * dt;

      if (dash.position.z > 12) {
        dash.position.z -= 168;
      }
    }

    // Riciclo delle pozze insieme alla strada, senza creare nuove mesh.
    for (const p of puddles) {
      p.rim.position.z += speed * dt;
      p.water.position.z += speed * dt;
      if (p.water.position.z > 16) {
        p.rim.position.z -= 165;
        p.water.position.z -= 165;
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

    if (distance >= 500) {
      finishGate.position.z = -7;
      running = false;
      ended = true;
      message.textContent =
        'TRAGUARDO RAGGIUNTO — TOCCA PER RIGIOCARE';
    }
  }

  // Camera ravvicinata dietro al soldato
  targetCamera.set(
    player.position.x * 0.25,
    3.35 + player.position.y * 0.22,
    7.1
  );

  camera.position.lerp(targetCamera, 0.04);

  camera.lookAt(
    player.position.x * 0.18,
    1.55 + player.position.y * 0.25,
    -5
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
