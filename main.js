import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinnedModel } from 'three/addons/utils/SkeletonUtils.js';
import { EffectComposer, RenderPass, EffectPass, VignetteEffect, BloomEffect, SMAAEffect } from 'postprocessing';
import { EffectComposer as ThreeComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass as ThreeRenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import './style.css';
import { createFinishOfficer } from './period-officer.js';

// CORSA ALLA GUERRA 3D - Enhanced Edition
// Three.js / Android

const canvas = document.querySelector('#game');
const message = document.querySelector('#message');
const stats = document.querySelector('#stats');

const leftButton = document.querySelector('#left');
const rightButton = document.querySelector('#right');
const jumpButton = document.querySelector('#jump');
const duckButton = document.querySelector('#duck');
const qualitySelect = document.querySelector('#quality-select');

if (!canvas || !message || !stats ||
    !leftButton || !rightButton || !jumpButton || !duckButton) {
  throw new Error('Elementi del gioco mancanti in index.html');
}

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});

// Limita i pixel elaborati sui display Android ad alta densità.
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.autoUpdate = true;

const scene = new THREE.Scene();
// Procedural daylight sky with a blue upper atmosphere, warm horizon and
// wispy clouds. Generated once; no network assets or per-frame shader cost.
function createDaylightSky() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#567a9c');
  gradient.addColorStop(0.45, '#9bbbd0');
  gradient.addColorStop(0.78, '#d0d3c4');
  gradient.addColorStop(1, '#a9b7a9');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  let seed = 28411;
  const rnd = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 65; i++) {
    const x = rnd() * 1024;
    const y = 80 + rnd() * 245;
    const rx = 35 + rnd() * 115;
    const ry = 5 + rnd() * 20;
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, rx);
    cloud.addColorStop(0, 'rgba(255,252,243,0.18)');
    cloud.addColorStop(1, 'rgba(255,252,243,0)');
    ctx.fillStyle = cloud;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.translate(-x, -y);
    ctx.fillRect(x-rx, y-rx, rx*2, rx*2);
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
scene.background = createDaylightSky();
scene.fog = new THREE.FogExp2(0x9baaa0, 0.0045);

const camera = new THREE.PerspectiveCamera(
  62, innerWidth / innerHeight, 0.1, 180
);

camera.position.set(0, 3.3, 7.0);
camera.lookAt(0, 1.35, -5);

// Lightweight cinematic postprocessing; mobile fallback uses direct rendering.
let cinematicComposer = null;
try {
  cinematicComposer = new EffectComposer(renderer, { multisampling: 0 });
  cinematicComposer.addPass(new RenderPass(scene, camera));
  cinematicComposer.addPass(new EffectPass(camera,
    new BloomEffect({ intensity: 0.16, luminanceThreshold: 0.91, mipmapBlur: true }),
    new SMAAEffect(),
    new VignetteEffect({ eskil: false, offset: 0.36, darkness: 0.35 })
  ));
} catch (error) {
  console.warn('Postprocessing non disponibile: renderer standard attivo', error);
  cinematicComposer = null;
}

// GTAO: screen-space ambient occlusion for contact shadows in Ultra mode.
// Separate Three.js pipeline so unsupported GPUs can use the existing renderer.
let ultraComposer = null;
try {
  ultraComposer = new ThreeComposer(renderer);
  ultraComposer.addPass(new ThreeRenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = 0.7;
  ultraComposer.addPass(gtao);
  ultraComposer.addPass(new OutputPass());
  console.info('[Corsa Renderer] GTAO pipeline initialized');
} catch (error) {
  console.warn('[Corsa Renderer] GTAO unavailable, using cinematic pipeline', error);
  ultraComposer = null;
}

// Illuminazione
scene.add(
  new THREE.HemisphereLight(0xd2d9ce, 0x414538, 1.7)
);

const sun = new THREE.DirectionalLight(0xffe4bd, 2.35);
sun.position.set(-11, 18, -9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -11;
sun.shadow.camera.right = 11;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -10;
sun.shadow.normalBias = 0.035;
sun.shadow.bias = -0.00015;
sun.shadow.radius = 2.2;
scene.add(sun);
// Three actual runtime graphics profiles; no app restart needed.
const qualityPresets = {
  balanced: {dpr: 1.0, shadow: 1024, post: false, fog: 0.007, far: 115},
  high: {dpr: 1.5, shadow: 2048, post: true, fog: 0.0045, far: 180},
  ultra: {dpr: 2.0, shadow: 4096, post: true, fog: 0.0035, far: 230}
};
let currentQuality = 'high';
function applyQuality(value) {
  currentQuality = Object.prototype.hasOwnProperty.call(qualityPresets, value) ? value : 'high';
  const preset = qualityPresets[currentQuality];
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, preset.dpr));
  // Stronger filmic grading in Ultra; prevent overexposed foliage highlights.
  renderer.toneMappingExposure = currentQuality === 'ultra' ? 1.02 : 1.12;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(innerWidth, innerHeight);
  if (cinematicComposer) cinematicComposer.setSize(innerWidth, innerHeight);
  if (ultraComposer) ultraComposer.setSize(innerWidth, innerHeight);
  scene.fog.density = preset.fog;
  camera.far = preset.far;
  camera.updateProjectionMatrix();
  sun.shadow.mapSize.set(preset.shadow, preset.shadow);
  if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  sun.shadow.needsUpdate = true;
  if (qualitySelect) qualitySelect.value = currentQuality;
  try { localStorage.setItem('corsa-quality', currentQuality); } catch (_) {}
}
if (qualitySelect) qualitySelect.addEventListener('change', () => applyQuality(qualitySelect.value));
try { applyQuality(localStorage.getItem('corsa-quality') || 'high'); }
catch (_) { applyQuality('high'); }


const fillLight = new THREE.DirectionalLight(0xc8d8e2, 0.92);
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

const dirtMat = mat(0x78846b);
const roadMat = mat(0x74685a);
const vergeMat = mat(0x4d5945);
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
  ctx.fillStyle = '#373d2e';
  ctx.fillRect(0, 0, 256, 256);
  // Broad, soft patches of damp soil and moss break up the sandy background.
  let soilSeed = 3491;
  const soilRand = () => ((soilSeed = (1664525 * soilSeed + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 170; i++) {
    const x = soilRand() * 256, y = soilRand() * 256;
    const radius = 7 + soilRand() * 28;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const shade = soilRand() > 0.46 ? '53,69,44' : '40,35,28';
    gradient.addColorStop(0, 'rgba(' + shade + ',0.28)');
    gradient.addColorStop(1, 'rgba(' + shade + ',0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

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
  ctx.fillStyle = road ? '#5d5346' : '#363d2f';
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
// Keep the roadway darker than the surrounding soil, including when PBR maps load.
roadMat.color.set(0x777873);
roadMat.roughness = 0.94;
// Preferisce mappe PBR locali quando presenti; mantiene le texture generate come fallback.
const pbrLoader = new THREE.TextureLoader();
// Asset diagnostics: reports actual texture/model success on the device.
const assetDiagnostics = {textures: new Set(), models: new Set(), errors: new Set()};
window.corsaAssetDiagnostics = assetDiagnostics;
function assetLoaded(kind, name) {
  assetDiagnostics[kind].add(name);
  console.info('[Corsa Assets] loaded', kind, name);
}
function assetFailed(name, error) {
  assetDiagnostics.errors.add(name);
  console.warn('[Corsa Assets] unavailable:', name, error || 'load error');
}

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
    assetLoaded('textures', basePath + '_color');
    material.color.set(material === roadMat ? 0x777873 : 0x77876d);
    material.needsUpdate = true;
  }, undefined, () => {});
  pbrLoader.load(basePath + '_normal.jpg', tex => {
    material.normalMap = configure(tex);
    assetLoaded('textures', basePath + '_normal');
    material.normalScale = new THREE.Vector2(0.6, 0.6);
    material.needsUpdate = true;
  }, undefined, () => {});
  pbrLoader.load(basePath + '_roughness.jpg', tex => {
    material.roughnessMap = configure(tex);
    assetLoaded('textures', basePath + '_roughness');
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
// Forest soil uses a dark green-brown tint even when external maps are loaded.
dirtMat.color.set(0x78846b);

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

// Weathered road markings: two edge lines and broken centre dashes.
// Single shared mesh/material; recycled with the moving track.
const roadMarkMaterial = new THREE.MeshBasicMaterial({
  color: 0xc8c4af, transparent: true, opacity: 0.62,
  depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2
});
const roadMarkGeometry = new THREE.PlaneGeometry(0.10, 3.8);
const roadMarkPositions = [];
for (let z = 10; z > -158; z -= 6) {
  roadMarkPositions.push({x: -3.67, z, stretch: 1.55});
  roadMarkPositions.push({x: 3.67, z, stretch: 1.55});
  if (Math.round(z / 6) % 2 === 0) roadMarkPositions.push({x: 0, z, stretch: 1});
}
const roadMarks = new THREE.InstancedMesh(roadMarkGeometry, roadMarkMaterial, roadMarkPositions.length);
const roadMarkTransform = new THREE.Object3D();
function updateRoadMarks() {
  for (let i = 0; i < roadMarkPositions.length; i++) {
    const mark = roadMarkPositions[i];
    roadMarkTransform.position.set(mark.x, -0.058, mark.z);
    roadMarkTransform.rotation.set(-Math.PI / 2, 0, 0);
    roadMarkTransform.scale.set(1, mark.stretch, 1);
    roadMarkTransform.updateMatrix();
    roadMarks.setMatrixAt(i, roadMarkTransform.matrix);
  }
  roadMarks.instanceMatrix.needsUpdate = true;
}
updateRoadMarks();
roadMarks.frustumCulled = false;
scene.add(roadMarks);

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

// Sparse leaf litter / small stones on the forest floor: one instanced draw
// call rather than dozens of individual meshes. Avoid the playable road.
const forestDebrisCount = 460;
const forestDebrisGeometry = new THREE.DodecahedronGeometry(0.12, 0);
const forestDebrisMaterial = new THREE.MeshStandardMaterial({
  color: 0x554c3b, roughness: 1, flatShading: true
});
const forestDebris = new THREE.InstancedMesh(
  forestDebrisGeometry, forestDebrisMaterial, forestDebrisCount
);
const forestDebrisTransform = new THREE.Object3D();
const forestDebrisPositions = [];
let debrisSeed = 6201;
const debrisRandom = () => ((debrisSeed = (1664525 * debrisSeed + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < forestDebrisCount; i++) {
  const side = debrisRandom() > 0.5 ? 1 : -1;
  forestDebrisPositions.push({
    x: side * (4.6 + debrisRandom() * 15),
    z: 12 - debrisRandom() * 158,
    scale: 0.45 + debrisRandom() * 1.4,
    angle: debrisRandom() * Math.PI * 2
  });
}
let debrisUpdateFrame = 0;
function updateForestDebris() {
  for (let i = 0; i < forestDebrisCount; i++) {
    const item = forestDebrisPositions[i];
    forestDebrisTransform.position.set(item.x, -0.13, item.z);
    forestDebrisTransform.rotation.set(0, item.angle, 0);
    forestDebrisTransform.scale.set(item.scale * 1.2, item.scale * 0.22, item.scale * 0.8);
    forestDebrisTransform.updateMatrix();
    forestDebris.setMatrixAt(i, forestDebrisTransform.matrix);
  }
  forestDebris.instanceMatrix.needsUpdate = true;
}
updateForestDebris();
forestDebris.frustumCulled = false;
scene.add(forestDebris);

// Forest-floor moss and fallen-needle islands: hundreds of patches in one draw call.
// Positioned outside the road, slightly above the base terrain.
const mossCount = 1400;
const mossGeometry = new THREE.IcosahedronGeometry(1, 0);
const mossMaterial = new THREE.MeshStandardMaterial({
  color: 0x647454, roughness: 1, flatShading: true
});
const moss = new THREE.InstancedMesh(mossGeometry, mossMaterial, mossCount);
const mossTransform = new THREE.Object3D();
const mossPositions = [];
const mossColor = new THREE.Color();
let mossSeed = 19472;
const mossRand = () => ((mossSeed = (1664525 * mossSeed + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < mossCount; i++) {
  const side = mossRand() > 0.5 ? 1 : -1;
  const x = side * (4.8 + mossRand() * 17);
  mossPositions.push({x, z: 12 - mossRand() * 158,
    width: 0.35 + mossRand() * 0.9, angle: mossRand() * Math.PI * 2});
  mossColor.setHex([0x526348, 0x454f36, 0x656a45, 0x3d4c36][i % 4]);
  moss.setColorAt(i, mossColor);
}
function updateMoss() {
  for (let i = 0; i < mossCount; i++) {
    const patch = mossPositions[i];
    mossTransform.position.set(patch.x, -0.18, patch.z);
    mossTransform.rotation.set(0, patch.angle, 0);
    mossTransform.scale.set(patch.width * 1.9, 0.045, patch.width * 1.1);
    mossTransform.updateMatrix();
    moss.setMatrixAt(i, mossTransform.matrix);
  }
  moss.instanceMatrix.needsUpdate = true;
}
updateMoss();
moss.frustumCulled = false;
scene.add(moss);

// Irregular granite boulders along the forest verge. GPU instancing keeps
// the added rocky landscape at one draw call on Android.
const boulderCount = 95;
const boulderGeometry = new THREE.IcosahedronGeometry(1, 1);
const boulderMaterial = new THREE.MeshStandardMaterial({
  color: 0x77786e, roughness: 0.98, flatShading: true
});
const boulders = new THREE.InstancedMesh(boulderGeometry, boulderMaterial, boulderCount);
const boulderTransform = new THREE.Object3D();
const boulderPositions = [];
const boulderColor = new THREE.Color();
let boulderSeed = 61823;
const boulderRand = () => ((boulderSeed = (1664525 * boulderSeed + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < boulderCount; i++) {
  const side = boulderRand() > 0.5 ? 1 : -1;
  const width = 0.35 + boulderRand() * 1.05;
  boulderPositions.push({
    x: side * (5.3 + boulderRand() * 17),
    z: 10 - boulderRand() * 157,
    width,
    height: width * (0.38 + boulderRand() * 0.35),
    angle: boulderRand() * Math.PI * 2
  });
  boulderColor.setHex([0x77776d, 0x676a60, 0x898679, 0x5b6058][i % 4]);
  boulders.setColorAt(i, boulderColor);
}
function updateBoulders() {
  for (let i = 0; i < boulderCount; i++) {
    const rock = boulderPositions[i];
    boulderTransform.position.set(rock.x, -0.19 + rock.height * 0.38, rock.z);
    boulderTransform.rotation.set(0.12, rock.angle, -0.09);
    boulderTransform.scale.set(rock.width * 1.4, rock.height, rock.width);
    boulderTransform.updateMatrix();
    boulders.setMatrixAt(i, boulderTransform.matrix);
  }
  boulders.instanceMatrix.needsUpdate = true;
}
updateBoulders();
boulders.frustumCulled = false;
boulders.receiveShadow = true;
scene.add(boulders);

// Pozzanghere e fango umido lungo i margini della carreggiata.
// Geometria condivisa e materiale senza ombre: effetto leggero per Android.
// Slightly jagged, asymmetric puddle outline rather than perfect circles.
// Shared between all puddles, so the geometry cost remains constant.
function createPuddleGeometry() {
  const segments = 24;
  const vertices = [0, 0, 0];
  const indices = [];
  for (let i = 0; i <= segments; i++) {
    const angle = i / segments * Math.PI * 2;
    const ripple = 1 + 0.12 * Math.sin(angle * 5 + 0.8)
      + 0.08 * Math.sin(angle * 9 - 0.6)
      + 0.04 * Math.cos(angle * 13);
    vertices.push(Math.cos(angle) * ripple, Math.sin(angle) * ripple, 0);
    if (i > 0) indices.push(0, i, i + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
const puddleGeometry = createPuddleGeometry();
const puddleMaterial = new THREE.MeshStandardMaterial({
  color: 0x293b37, roughness: 0.18, metalness: 0.08,
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
  rim.rotation.y = puddleRand() * Math.PI * 2;
  rim.scale.set(sx * 1.2, sz * 1.16, 1);
  rim.position.set(x, -0.047, z);
  scene.add(rim);
  const water = new THREE.Mesh(puddleGeometry, puddleMaterial);
  water.rotation.x = -Math.PI / 2;
  water.rotation.y = rim.rotation.y;
  water.scale.set(sx, sz, 1);
  water.position.set(x, -0.043, z);
  scene.add(water);
  puddles.push({rim, water});
}

// Mud is not perfectly flat: add a few shared-geometry, irregular wet-soil
// patches around the ruts. Cheap unlit decals avoid costly reflection passes.
const mudPatchGeometry = new THREE.CircleGeometry(1, 11);
const mudPatchMaterial = new THREE.MeshBasicMaterial({
  color: 0x302e25, transparent: true, opacity: 0.23,
  depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
  side: THREE.DoubleSide
});
const mudPatches = [];
let mudSeed = 9381;
const mudRandom = () => ((mudSeed = (1664525 * mudSeed + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < 46; i++) {
  const patch = new THREE.Mesh(mudPatchGeometry, mudPatchMaterial);
  patch.rotation.x = -Math.PI / 2;
  patch.rotation.y = mudRandom() * Math.PI;
  const side = mudRandom() > 0.5 ? 1 : -1;
  patch.position.set(side * (1.25 + mudRandom() * 2.1), -0.057, 11 - i * 3.45);
  patch.scale.set(0.3 + mudRandom() * 0.95, 0.5 + mudRandom() * 1.45, 1);
  scene.add(patch);
  mudPatches.push(patch);
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
// Real 3D pine crowns: three staggered low-poly branch whorls, not
// camera-facing crossed billboards. Geometry and materials are shared.
function createPineCrownGeometry() {
  // Layered radial spruce boughs instead of the previous continuous cone.
  // All needle sprays are part of ONE shared geometry for every pine.
  const positions = [], uvs = [], indices = [];
  function triangle(a, b, c) {
    const base = positions.length / 3;
    positions.push(...a, ...b, ...c);
    uvs.push(0, 0, 1, 0, 0.5, 1);
    indices.push(base, base + 1, base + 2);
  }
  const whorls = 10;
  const branches = 11;
  for (let ring = 0; ring < whorls; ring++) {
    const t = ring / whorls;
    const y = 0.24 + t * 2.12;
    const reach = Math.pow(1 - t, 0.92) * 1.14;
    for (let j = 0; j < branches; j++) {
      const angle = j * Math.PI * 2 / branches + ring * 1.73;
      const ux = Math.cos(angle), uz = Math.sin(angle);
      const sideX = -uz, sideZ = ux;
      const r = reach * (0.82 + 0.18 * Math.sin(j * 9.1 + ring * 3.7));
      const droop = 0.15 + 0.10 * (1 - t);
      const inner = [ux * 0.09, y + 0.17, uz * 0.09];
      const tip = [ux * r, y - droop, uz * r];
      const halfWidth = 0.14 + (1 - t) * 0.18;
      triangle(inner,
        [ux * r * 0.60 + sideX * halfWidth, y + 0.07, uz * r * 0.60 + sideZ * halfWidth], tip);
      triangle(inner, tip,
        [ux * r * 0.60 - sideX * halfWidth, y + 0.07, uz * r * 0.60 - sideZ * halfWidth]);
      // Secondary sprays give branches depth when viewed from above.
      triangle([ux * r * 0.26, y + 0.14, uz * r * 0.26],
        [ux * r * 0.69 + sideX * halfWidth * 0.67, y + 0.26, uz * r * 0.69 + sideZ * halfWidth * 0.67],
        [ux * r * 0.88, y - droop * 0.55, uz * r * 0.88]);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
const pineCrownGeo = createPineCrownGeometry();
// Shared procedural needle color variation helps break up large flat green faces.
function makePineNeedleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#455c3e';
  ctx.fillRect(0, 0, 128, 128);
  let seed = 837;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 1700; i++) {
    const x = rnd() * 128, y = rnd() * 128;
    ctx.strokeStyle = rnd() > 0.5 ? 'rgba(14,30,17,0.28)' : 'rgba(149,167,112,0.17)';
    ctx.lineWidth = 0.5 + rnd() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rnd() - 0.5) * 5, y + 2 + rnd() * 8);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 3);
  return texture;
}
const pineCrownMat = new THREE.MeshStandardMaterial({
  map: makePineNeedleTexture(), color: 0xb7c8b0,
  roughness: 1, flatShading: false, side: THREE.DoubleSide
});
// Small palette variations share geometry and textures, but break up the
// single identical dark-green forest color across the whole landscape.
const pineCrownVariants = [pineCrownMat,
  pineCrownMat.clone(), pineCrownMat.clone()];
pineCrownVariants[1].color.set(0x94aa8b);
pineCrownVariants[2].color.set(0xc3bda0);

// A single shared low-resolution bark texture adds vertical grain without
// adding geometry, draw calls or per-tree materials on Android.
function makePineBarkMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#554737';
  ctx.fillRect(0, 0, 128, 256);
  let seed = 2147;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 440; i++) {
    const x = random() * 128;
    const y = random() * 256;
    ctx.strokeStyle = ['#302b25', '#75624b', '#857258', '#40382d'][Math.floor(random() * 4)];
    ctx.lineWidth = 0.5 + random() * 2.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (random() - 0.5) * 4, y + 5 + random() * 31);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return new THREE.MeshStandardMaterial({map: texture, roughness: 1});
}
const pineBarkMat = makePineBarkMaterial();
function createTree(x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  // Rotate each tree differently so repeated billboard silhouettes do not
  // form visible identical rows along the runner's path.
  const variation = Math.abs(Math.sin(x * 12.9898 + z * 78.233));
  group.rotation.y = variation * Math.PI * 2;
  const trunk = new THREE.Mesh(pineTrunkGeo, pineBarkMat);
  trunk.position.y = 2.4;
  trunk.castShadow = true;
  group.add(trunk);
  // Layer cutout needle silhouettes over the 3D branches to break up
  // the solid polygonal outlines visible in the Android screenshots.
  for (let spray = 0; spray < 3; spray++) {
    const needles = new THREE.Mesh(pineFoliageGeo, pineFoliageMat);
    needles.position.y = 3.45 + (variation - 0.5) * 0.2;
    needles.rotation.y = spray * Math.PI / 3;
    needles.scale.set(1.05 + variation * 0.18, 1.0 + variation * 0.12, 1);
    needles.castShadow = false;
    group.add(needles);
  }
  // Overlapping whorls retain actual 3D volume and shadows.
  for (let i = 0; i < 3; i++) {
    const crown = new THREE.Mesh(pineCrownGeo,
      pineCrownVariants[Math.floor(variation * pineCrownVariants.length) % pineCrownVariants.length]);
    crown.position.y = 1.5 + i * 1.1 + (variation - 0.5) * 0.2;
    crown.scale.set((1.65 - i * 0.34) * (0.91 + variation * 0.18),
      1.03 + variation * 0.13, (1.65 - i * 0.34) * (0.91 + variation * 0.18));
    crown.rotation.y = variation * 2.1 + i * 0.43;
    crown.castShadow = i === 0;
    group.add(crown);

  }
  scene.add(group);
  forest.push(group);
}

// Real CC0 Kenney glTF pine assets are bundled by the Android build.
// Replace nearby procedural pines with imported meshes; retain fallback
// crowns if the assets are unavailable in a development preview.
const natureLoader = new GLTFLoader();
const naturePineFiles = [
  'tree-pinetalla-detailed.glb', 'tree-pinetallb-detailed.glb',
  'tree-pinetallc-detailed.glb', 'tree-pinetalld-detailed.glb',
  'tree-pinerounda.glb', 'tree-pineroundc.glb',
  'tree-pinesmalla.glb', 'tree-pinesmallc.glb'
];
const naturePines = new Map();
function installImportedPines() {
  if (!naturePines.size) return;
  forest.forEach((tree, index) => {
    if (index % 6 === 5 || tree.userData.importedPine || tree.userData.realisticPine) return;
    const preferred = naturePineFiles[index % naturePineFiles.length];
    const source = naturePines.get(preferred);
    if (!source) return; // Retry this tree when its exact GLB finishes loading.
    const instance = source.clone(true);
    // Original asset heights vary: normalize to existing forest scale.
    const bounds = new THREE.Box3().setFromObject(instance);
    const size = new THREE.Vector3(); bounds.getSize(size);
    if (size.y < 0.01) return;
    // Keep the original mesh proportions, but vary the height to prevent
    // identical forest silhouettes from repeating along the road.
    const variation = 0.86 + (index * 37 % 17) / 17 * 0.35;
    const factor = 6.7 * variation / size.y;
    instance.scale.setScalar(factor);
    instance.position.y = -bounds.min.y * factor - 0.2;
    instance.traverse((part) => {
      if (part.isMesh) {
        part.castShadow = index % 4 === 0;
        part.receiveShadow = true;
      }
    });
    tree.clear();
    tree.add(instance);
    tree.userData.importedPine = true;
    tree.userData.assetName = preferred;
  });
}
// Photographic-style textured CC0 conifers replace the Kenney trees nearest
// the road. Load asynchronously and keep existing trees as safe fallback.
const realisticTreeFiles = ['norway-spruce.glb', 'scots-pine.glb', 'silver-birch.glb', 'columnar-cypress.glb'];
const realisticTrees = new Map();
function installRealisticTrees() {
  if (!realisticTrees.size) return;
  forest.forEach((tree, index) => {
    // Use the detailed models on both sides of the road, while limiting
    // draw calls and texture duplication on mobile.
    // Most trees remain conifers; occasional broadleaf birch breaks repetition.
    const filename = realisticTreeFiles[index % 11 === 0 ? 2 : index % 13 === 0 ? 3 : index % 2];
    // Prefer the intended species when available, but never leave a
    // procedural tree behind just because its GLB finishes loading later.
    const chosenName = realisticTrees.has(filename) ? filename : realisticTrees.keys().next().value;
    if (!chosenName || tree.userData.assetName === chosenName) return;
    const source = realisticTrees.get(chosenName);
    if (!source) return;
    const instance = source.clone(true);
    const bounds = new THREE.Box3().setFromObject(instance);
    const height = bounds.max.y - bounds.min.y;
    if (!Number.isFinite(height) || height < 0.01) {
      assetFailed(filename + ': invalid scene bounds', new Error('GLB has no usable tree geometry'));
      return;
    }
    const targetHeight = 8.5 + ((index * 13) % 9) * 0.65;
    const scale = targetHeight / height;
    instance.scale.setScalar(scale);
    instance.position.y = -bounds.min.y * scale - 0.12;
    instance.traverse((part) => {
      if (!part.isMesh) return;
      part.castShadow = index % 6 === 0;
      part.receiveShadow = true;
      if (part.material) {
        const materials = Array.isArray(part.material) ? part.material : [part.material];
        for (const mat of materials) {
          if (mat.map) mat.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          mat.side = THREE.DoubleSide;
        }
      }
    });
    tree.clear();
    tree.add(instance);
    tree.userData.realisticPine = true;
    tree.userData.assetName = chosenName;
  });
  const active = forest.filter(tree => tree.userData.realisticPine).length;
  console.info('[Corsa Forest] realistic conifers active:', active, '/', forest.length);
  window.corsaRealisticTreeCount = active;
}
for (const filename of realisticTreeFiles) {
  natureLoader.load('./models/realistic/' + filename, (gltf) => {
    realisticTrees.set(filename, gltf.scene);
    assetLoaded('models', filename);
    installRealisticTrees();
  }, undefined, (error) => assetFailed(filename, error));
}

for (const filename of naturePineFiles) {
  natureLoader.load('./models/nature/' + filename, (gltf) => {
    naturePines.set(filename, gltf.scene);
    assetLoaded('models', filename);
    installImportedPines();
  }, undefined, (error) => {
    assetFailed(filename, error);
    // Procedural pines remain available as a reliable offline fallback.
  });
}

// Dense natural forest-floor leaf litter, batched into a single GPU draw call.
// Alpha-cutout silhouettes and varied warm/cool colors avoid polygonal boulders.
const litterCanvas = document.createElement('canvas');
litterCanvas.width = 128; litterCanvas.height = 128;
const litterCtx = litterCanvas.getContext('2d');
litterCtx.clearRect(0, 0, 128, 128);
litterCtx.translate(64, 64);
litterCtx.beginPath();
litterCtx.moveTo(0, -54);
litterCtx.bezierCurveTo(39, -39, 39, 11, 0, 53);
litterCtx.bezierCurveTo(-39, 11, -39, -39, 0, -54);
litterCtx.fillStyle = '#ddd3a7'; litterCtx.fill();
litterCtx.strokeStyle = '#8d7755'; litterCtx.lineWidth = 3;
litterCtx.beginPath(); litterCtx.moveTo(0, -49); litterCtx.lineTo(0, 47); litterCtx.stroke();
for (const side of [-1, 1]) for (let j = 0; j < 6; j++) {
  const y = -33 + j * 13;
  litterCtx.beginPath(); litterCtx.moveTo(0, y + 10);
  litterCtx.lineTo(side * (16 + (5 - j) * 2), y - 6); litterCtx.stroke();
}
const litterTexture = new THREE.CanvasTexture(litterCanvas);
litterTexture.colorSpace = THREE.SRGBColorSpace;
const litterMaterial = new THREE.MeshStandardMaterial({
  map: litterTexture, transparent: false, alphaTest: 0.35,
  side: THREE.DoubleSide, roughness: 1, depthWrite: true
});
const litterCount = 1900;
const litter = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.32, 0.66), litterMaterial, litterCount);
const litterTransform = new THREE.Object3D();
const litterItems = [];
let litterSeed = 4093;
const litterRand = () => ((litterSeed = (1664525 * litterSeed + 1013904223) >>> 0) / 4294967296);
const litterColors = [0x756b49, 0x85734d, 0x6e7650, 0x554f37, 0x9b8456];
for (let i = 0; i < litterCount; i++) {
  const side = litterRand() < 0.5 ? -1 : 1;
  const item = {
    x: side * (4.3 + litterRand() * 19),
    z: 12 - litterRand() * 161,
    rotation: litterRand() * Math.PI * 2,
    scale: 0.3 + litterRand() * 1.5
  };
  litterItems.push(item);
  litter.setColorAt(i, new THREE.Color(litterColors[Math.floor(litterRand() * litterColors.length)]));
}
function updateLitter() {
  for (let i = 0; i < litterCount; i++) {
    const leaf = litterItems[i];
    litterTransform.position.set(leaf.x, -0.208 + i % 4 * 0.002, leaf.z);
    litterTransform.rotation.set(-Math.PI / 2, 0, leaf.rotation);
    litterTransform.scale.setScalar(leaf.scale);
    litterTransform.updateMatrix();
    litter.setMatrixAt(i, litterTransform.matrix);
  }
  litter.instanceMatrix.needsUpdate = true;
}
updateLitter();
litter.frustumCulled = false;
scene.add(litter);

// Imported CC0 granite and detailed bush models complement the procedural
// instanced ground clutter. Only a few near-camera props are used.
const natureProps = [];
for (const [filename, count, height] of [
  ['rock-largea.glb', 7, 1.0],
  ['rock-largeb.glb', 7, 1.25],
  ['rock-largec.glb', 6, 1.0],
  ['rock-largee.glb', 6, 1.15],
  ['rock-talla.glb', 5, 1.8],
  ['rock-tallc.glb', 5, 1.5],
  ['plant-bushdetailed.glb', 12, 1.3],
  ['plant-bushlarge.glb', 14, 1.7],
  ['plant-bushsmall.glb', 18, 0.8],
  ['grass-large.glb', 24, 0.65]
]) {
  natureLoader.load('./models/nature/' + filename, (gltf) => {
    assetLoaded('models', filename);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const dimensions = new THREE.Vector3(); box.getSize(dimensions);
    if (dimensions.y < 0.001) return;
    for (let i = 0; i < count; i++) {
      const prop = gltf.scene.clone(true);
      const factor = height / dimensions.y * (0.72 + (i % 4) * 0.16);
      prop.scale.setScalar(factor);
      prop.position.set((i % 2 ? 1 : -1) * (5.7 + (i * 7 % 12)),
        -0.22 - box.min.y * factor,
        8 - i * 13 - (filename.length % 7));
      prop.rotation.y = i * 2.39996;
      prop.traverse((part) => { if (part.isMesh) part.receiveShadow = true; });
      prop.userData.natureBaseY = prop.position.y;
      scene.add(prop);
      natureProps.push(prop);
    }
  }, undefined, () => {});
}

// Near-road undergrowth: hundreds of crossed, curved leaf blades in a single
// GPU instanced draw call. Naturalistic silhouettes without billboard sprites.
const fernBladeGeometry = new THREE.BufferGeometry();
const fernPositions = [], fernUvs = [];
for (let frond = 0; frond < 7; frond++) {
  const angle = frond * Math.PI * 2 / 7;
  const ux = Math.cos(angle), uz = Math.sin(angle);
  const vx = -uz, vz = ux;
  for (let segment = 0; segment < 7; segment++) {
    const t0 = segment / 7, t1 = (segment + 1) / 7;
    const width0 = Math.sin(Math.PI * (0.08 + t0 * 0.92)) * 0.14;
    const width1 = Math.sin(Math.PI * (0.08 + t1 * 0.92)) * 0.14;
    const point = (t, width, side) => [ux * t * 0.82 + vx * width * side,
      0.05 + t * 0.88 - t * t * 0.28,
      uz * t * 0.82 + vz * width * side];
    const p0 = point(t0, width0, -1), p1 = point(t0, width0, 1);
    const p2 = point(t1, width1, -1), p3 = point(t1, width1, 1);
    fernPositions.push(...p0,...p1,...p2,...p2,...p1,...p3);
    fernUvs.push(0,t0,1,t0,0,t1,0,t1,1,t0,1,t1);
  }
}
fernBladeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(fernPositions, 3));
fernBladeGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(fernUvs, 2));
fernBladeGeometry.computeVertexNormals();
const fernMaterial = new THREE.MeshStandardMaterial({color:0x354c2e,
  side:THREE.DoubleSide,roughness:0.97,metalness:0});
const fernCount = 1250;
const ferns = new THREE.InstancedMesh(fernBladeGeometry, fernMaterial, fernCount);
const fernDummy = new THREE.Object3D();
const fernLocations = [];
let fernSeed = 314159;
const fernRand = () => ((fernSeed = (1664525 * fernSeed + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < fernCount; i++) {
  const side = i % 2 ? 1 : -1;
  fernLocations.push({x:side*(4.65+fernRand()*21),z:10-fernRand()*160,
    scale:0.55+fernRand()*1.1,rotation:fernRand()*Math.PI*2});
}
function updateFerns() {
  fernLocations.forEach((fern,i)=>{
    fernDummy.position.set(fern.x,-0.18,fern.z);
    fernDummy.rotation.set(0,fern.rotation,0);
    fernDummy.scale.setScalar(fern.scale);
    fernDummy.updateMatrix(); ferns.setMatrixAt(i,fernDummy.matrix);
  });
  ferns.instanceMatrix.needsUpdate=true;
}
updateFerns();
ferns.frustumCulled=false;
scene.add(ferns);
// Randomized fern color per instance, avoiding a flat monochrome carpet.
const fernTint = new THREE.Color();
for (let i=0; i<fernCount; i++) {
  const variation = (i*37%113)/113;
  fernTint.setHSL(0.26+variation*0.035,0.19+variation*0.16,0.26+variation*0.18);
  ferns.setColorAt(i,fernTint);
}
if (ferns.instanceColor) ferns.instanceColor.needsUpdate=true;

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
  const variation = Math.abs(Math.sin(x * 7.31 + z * 3.97));
  group.rotation.y = variation * Math.PI * 2;
  for (let i = 0; i < 3; i++) {
    const foliage = new THREE.Mesh(shrubGeometry, shrubMaterial);
    foliage.position.y = 0.60 + variation * 0.13;
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
// A softened, slightly flattened sack shape avoids perfect ball-like sandbags.
// Shared geometry keeps the fortification detail inexpensive on mobile.
const sackGeometry = new THREE.SphereGeometry(0.27, 12, 8);
const sackPosition = sackGeometry.getAttribute('position');
for (let i = 0; i < sackPosition.count; i++) {
  const x = sackPosition.getX(i);
  const y = sackPosition.getY(i);
  const z = sackPosition.getZ(i);
  const wrinkle = 1 + 0.035 * Math.sin(x * 37 + z * 19) * Math.cos(y * 28);
  sackPosition.setXYZ(i, x * wrinkle, y * 0.82, z * wrinkle);
}
sackPosition.needsUpdate = true;
sackGeometry.computeVertexNormals();

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
  // Cross-braced supports prevent the tower from reading as four floating posts.
  for (const side of [-1, 1]) {
    for (const height of [1.65, 3.75]) {
      const frontBrace = addBox(g, [0.11, 2.1, 0.13], timber,
        [0, height, side * 0.7]);
      frontBrace.rotation.z = side * 0.59;
      const sideBrace = addBox(g, [0.13, 2.1, 0.11], timber,
        [side * 0.7, height, 0]);
      sideBrace.rotation.x = side * 0.59;
    }
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
// Period-style environmental graphics matching the supplied WWII game reference.
// Painted onto canvases to avoid image downloads and additional dependencies.
function paintedSign(lines, background, ink, width = 512, height = 768) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
  let seed = 7203;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 2700; i++) {
    ctx.fillStyle = random() > 0.5 ? 'rgba(0,0,0,0.09)' : 'rgba(255,240,205,0.055)';
    ctx.fillRect(random()*width, random()*height, 2+random()*18, 1+random()*8);
  }
  ctx.strokeStyle = '#ab9a76'; ctx.lineWidth = 14;
  ctx.strokeRect(18, 18, width-36, height-36);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  const fontSize = Math.floor(Math.min(width / 6.5, height / (lines.length * 2.3)));
  ctx.font = 'bold ' + fontSize + 'px Georgia,serif';
  lines.forEach((line, index) => ctx.fillText(line, width/2,
    height * (0.32 + index * 0.15), width - 70));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function addFinishSign(lines, background, ink, x, y, z, w, h) {
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({map: paintedSign(lines, background, ink),
      roughness: 0.95, side: THREE.DoubleSide}));
  sign.position.set(x, y, z);
  finishGate.add(sign);
  return sign;
}
// Green propaganda placard on the left and tall DUX standard on the right.
addFinishSign(['VINCERE', 'PER', "L'ITALIA"], '#34443b', '#e1d6b4',
  -6.8, 2.9, 5.8, 3.5, 3.0);
addFinishSign(['DUX', '★', 'SPQR'], '#34362c', '#b7a277',
  6.7, 4.1, 5.8, 2.7, 5.4);
// Two vertical red banners with white roundels and black hooked-cross
// historical symbols, only as scenery in the fictional period setting.
function makeHistoricalBanner() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 640;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#9c302e'; ctx.fillRect(0,0,256,640);
  const grad = ctx.createLinearGradient(0,0,256,0);
  grad.addColorStop(0,'rgba(0,0,0,0.28)');
  grad.addColorStop(0.48,'rgba(255,255,255,0.08)');
  grad.addColorStop(1,'rgba(0,0,0,0.23)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,256,640);
  ctx.fillStyle='#ece5d8'; ctx.beginPath();ctx.arc(128,138,96,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(128,138);ctx.rotate(Math.PI/4);
  ctx.fillStyle='#191919';
  ctx.fillRect(-14,-72,28,144);ctx.fillRect(-72,-14,144,28);
  ctx.fillRect(0,-72,70,25);ctx.fillRect(47,-72,23,58);
  ctx.fillRect(0,47,70,25);ctx.fillRect(47,14,23,58);
  ctx.fillRect(-70,47,70,25);ctx.fillRect(-70,14,23,58);
  ctx.fillRect(-70,-72,70,25);ctx.fillRect(-70,-72,23,58);
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const periodFlagMat = new THREE.MeshStandardMaterial({
  map: makeHistoricalBanner(), side: THREE.DoubleSide, roughness: 0.97
});
for (const x of [-4.25,4.25]) {
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 3.55), periodFlagMat);
  flag.position.set(x, 3.18, 0.25);
  finishGate.add(flag);
}
finishGate.visible = true;
finishGate.position.set(0, 0, -27);
scene.add(finishGate);

// Foschia naturale al posto delle montagne coniche artificiali.
// Dettagli del sottobosco
// Vegetazione istanziata: una draw call per 500 fili anziché 500 mesh.
const grassCount = 2600;
const grassMaterial = new THREE.MeshStandardMaterial({
  color: 0x526747, side: THREE.DoubleSide, roughness: 1
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

  // Staggered background trunks add forest depth without narrowing the
  // playable road. Sparse enough to preserve Android draw-call budget.
  if (Math.random() > 0.46) {
    createTree(-11.5 - Math.random() * 5, z - 4, 0.6 + Math.random() * 0.5);
  }
  if (Math.random() > 0.46) {
    createTree(11.5 + Math.random() * 5, z - 6, 0.6 + Math.random() * 0.5);
  }

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

// A second, independent rig waits beneath the finish banner.
// Uses the existing GLB and shares its geometry/textures to keep APK size low.
let finishGuardMixer = null;
const finishGuard = new THREE.Group();
finishGuard.position.set(0, 0, -0.7);
finishGate.add(finishGuard);
const finishPlatform = new THREE.Mesh(
  new THREE.CylinderGeometry(1.15, 1.15, 0.10, 24),
  new THREE.MeshStandardMaterial({color: 0x8c2c29, roughness: 0.88})
);
finishPlatform.position.set(0, 0.05, -0.7);
finishPlatform.receiveShadow = true;
finishGate.add(finishPlatform);
// Small front-facing marker makes the waiting character readable at distance.
const podiumRim = new THREE.Mesh(
  new THREE.CylinderGeometry(1.20, 1.20, 0.045, 24),
  new THREE.MeshStandardMaterial({color: 0xb44b3b, roughness: 0.74})
);
podiumRim.position.set(0, 0.115, -0.7);
finishGate.add(podiumRim);

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
    // Neutral charcoal uniform treatment inspired by the reference runner.
    // Retain original GLB textures and skinning instead of replacing them.
    soldier.traverse((part) => {
      if (!part.isMesh || !part.material) return;
      const mats = Array.isArray(part.material) ? part.material : [part.material];
      const adjusted = mats.map((original) => {
        const mat = original.clone();
        const name = ((part.name || '') + ' ' + (original.name || '')).toLowerCase();
        if (mat.color && /uniform|jacket|coat|pants|trouser|shirt|fabric|cloth|vest/.test(name)) {
          mat.color.multiply(new THREE.Color(0x666b67));
          mat.roughness = Math.max(mat.roughness ?? 0.8, 0.88);
        }
        return mat;
      });
      part.material = Array.isArray(part.material) ? adjusted : adjusted[0];
    });
    // Historical silhouette pass: hide modern tactical backpack and helmet
    // when those pieces are separate named meshes. Keep the animated rig.
    let hiddenModernParts = 0;
    soldier.traverse((part) => {
      if (!part.isMesh) return;
      const label = part.name.toLowerCase();
      if (/(backpack|rucksack|tactical_pack|helmet|kneepad|knee_pad)/.test(label)) {
        part.visible = false;
        hiddenModernParts++;
      }
    });
    // The cap follows the animated head bone, rather than floating at a
    // fixed world coordinate. This is an interim silhouette improvement.
    let headBone = null;
    soldier.traverse((part) => {
      if (!headBone && part.isBone && /(^|[_:.])head($|[_:.])/i.test(part.name)) headBone = part;
    });
    if (headBone) {
      const cap = new THREE.Group();
      const darkCloth = new THREE.MeshStandardMaterial({color: 0x222624, roughness: 0.94});
      const capBand = new THREE.MeshStandardMaterial({color: 0x101414, roughness: 0.72});
      const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.122, 0.055, 24), darkCloth);
      capTop.position.y = 0.155;
      cap.add(capTop);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.108, 0.115, 24), darkCloth);
      crown.position.y = 0.083;
      cap.add(crown);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.109, 0.109, 0.037, 24), capBand);
      band.position.y = 0.023;
      cap.add(band);
      const visor = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), capBand);
      visor.scale.set(1.12, 0.12, 0.72);
      visor.position.set(0, 0.005, -0.092);
      cap.add(visor);
      cap.position.set(0, 0.13, 0);
      cap.scale.setScalar(0.92);
      cap.traverse((part) => { if (part.isMesh) part.castShadow = true; });
      headBone.add(cap);
    }
    console.info('[Corsa Soldier] hidden modern parts:', hiddenModernParts, 'animated head:', !!headBone);
    // Preserve a stable base transform even if animation clips include root motion.
    soldier.userData.groundAnchorY = 0;

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
            // Preserve the original GLB fabric detail: a strong dark tint
            // previously crushed most of the soldier's midtone information.
            material.color.multiply(new THREE.Color(0xb0b5a7));
            material.roughness = Math.max(material.roughness ?? 0.8, 0.78);
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
      soldier.userData.groundAnchorY = soldier.position.y;
      soldier.position.x -= (scaledBounds.min.x + scaledBounds.max.x) / 2;
      soldier.position.z -= (scaledBounds.min.z + scaledBounds.max.z) / 2;
    }

    // Keep the visible skinned mesh grounded after the initial pose is applied.
    // Imported rigs may use an offset on an animated bone rather than the scene root.
    const groundProbe = new THREE.Box3();
    let groundCheckFrame = 0;
    const keepSoldierGrounded = () => {
      // The expensive skinned bounding-box check is periodic, not per-frame.
      if (++groundCheckFrame > 10 && groundCheckFrame % 30 !== 0) return;
      soldier.updateMatrixWorld(true);
      groundProbe.setFromObject(soldier);
      if (groundProbe.isEmpty() || !Number.isFinite(groundProbe.min.y)) return;
      // Compute in world coordinates: the player is at y=0 while running.
      const worldFloor = player.position.y;
      const penetration = worldFloor - groundProbe.min.y;
      if (penetration > 0.035 && penetration < 2.5) {
        soldier.position.y += penetration;
        soldier.userData.groundAnchorY = soldier.position.y;
      }
    };
    soldier.userData.keepGrounded = keepSoldierGrounded;
    keepSoldierGrounded();

    // Dedicated officer mesh with a peaked cap and gray tunic. It is a
    // separate 3D character, not another copy of the runner.
    const guard = createFinishOfficer();
    guard.rotation.y = Math.PI;
    finishGuard.add(guard);
    finishGuardMixer = null;

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

    // Root/hip translation from imported clips may shift the entire skinned
    // character below ground at startup. Strip translation only from the
    // armature/root/hips; preserve limb rotation and all other animation.
    const groundedClip = (clip) => {
      if (!clip) return null;
      const grounded = clip.clone();
      grounded.tracks = grounded.tracks.filter((track) => {
        if (!track.name.endsWith('.position')) return true;
        const node = track.name.slice(0, -'.position'.length).toLowerCase();
        return !/(^|[|/:])(root|armature|hips|pelvis|mixamorig:hips)$/.test(node);
      });
      return grounded;
    };
    if (runClip) soldierRun = soldierMixer.clipAction(groundedClip(runClip));

    if (jumpClip) {
      soldierJump = soldierMixer.clipAction(groundedClip(jumpClip));
      soldierJump.setLoop(THREE.LoopOnce, 1);
      soldierJump.clampWhenFinished = true;
    }

    if (idleClip) {
      const guardIdle = finishGuardMixer.clipAction(groundedClip(idleClip));
      guardIdle.play();
    }
    if (idleClip) {
      soldierIdle = soldierMixer.clipAction(groundedClip(idleClip));
    } else if (clips.length && !soldierRun) {
      soldierIdle = soldierMixer.clipAction(groundedClip(clips[0]));
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
let duckFrames = 0;
const speed = 0.25;
let score = 0;
let health = 3;
let lastTime = 0;
let falling = false;
let fallProgress = 0;
const fallDuration = 42; // approximately 0.7 seconds at 60 FPS

function start() {
  if (falling) return;
  if (ended) {
    window.location.reload();
    return;
  }

  running = true;
  message.textContent = 'EVITA GLI OSTACOLI';
}

function move(direction) {
  if (falling) return;
  if (!running) start();

  lane = Math.max(0, Math.min(2, lane + direction));
}

function jump() {
  if (falling) return;
  if (!running) start();

  if (!jumping) {
    jumping = true;
    jumpVelocity = 0.19;
  }
}

leftButton.onclick = () => move(-1);
rightButton.onclick = () => move(1);
jumpButton.onclick = jump;
duckButton.onclick = () => {
  if (falling) return;
  if (!running) start();
  if (!jumping) duckFrames = 42;
};

// The end-of-run overlay tells players to tap to restart. Allow that tap
// to reach start(), which already handles the ended state by reloading.
canvas.addEventListener('pointerdown', () => {
  if (!running && !falling) start();
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

  if (falling) {
    // A brief forward tumble plays before the restart prompt appears.
    fallProgress = Math.min(1, fallProgress + dt / fallDuration);
    const eased = 1 - Math.pow(1 - fallProgress, 3);
    player.rotation.x = -1.30 * eased;
    player.rotation.z = Math.sin(fallProgress * Math.PI) * 0.13;
    player.position.y = Math.sin(eased * Math.PI * 0.5) * 0.13;
    if (fallProgress >= 1) {
      falling = false;
      ended = true;
      message.textContent = 'SEI CADUTO — TOCCA PER RIPROVARE';
    }
  }

  if (running) {
    if (duckFrames > 0) duckFrames = Math.max(0, duckFrames - dt);
    player.scale.y = THREE.MathUtils.damp(player.scale.y, duckFrames > 0 ? 0.72 : 1, 12, dt / 60);
    distance += speed * dt;
    stats.textContent = `❤️ ${'♥'.repeat(health)}  |  PUNTI: ${score}  |  TRAGUARDO: ${Math.max(0, 200 - Math.floor(distance * 0.46))} m`;

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

    // Recover from invalid/out-of-bounds vertical positions before updating jump.
    if (!Number.isFinite(player.position.y) || player.position.y < 0) {
      player.position.y = 0;
      jumpVelocity = 0;
      jumping = false;
    }

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

  // GLTF clips can animate the scene root (especially on repeated starts).
  // Keep the model's ground anchor fixed; jumping belongs to player.position.y.
  soldierMixer.update(Math.min(soldierClock.getDelta(), 0.05));
  const soldierRoot = player.children[0];
  if (soldierRoot && Number.isFinite(soldierRoot.userData.groundAnchorY)) {
    soldierRoot.position.y = soldierRoot.userData.groundAnchorY;
    // Check the skinned mesh, not just the group origin: some GLBs move
    // the feet through bone transforms on their first animation frame.
    if (soldierRoot.userData.keepGrounded) soldierRoot.userData.keepGrounded();
  }
}

    if (finishGuardMixer && finishGate.visible) finishGuardMixer.update(Math.min(dt / 60, 0.05));

    // The historical finish set is visible from the first frame, as in
    // the reference image. Bring it forward gradually but never past player.
    finishGate.position.z = -27 + Math.min(distance * 0.055, 22);

    for (const rock of boulderPositions) {
      rock.z += speed * dt;
      if (rock.z > 15) rock.z -= 165;
    }
    if ((debrisUpdateFrame & 1) === 0) updateBoulders();

    for (const fern of fernLocations) {
      fern.z += speed * dt;
      if (fern.z > 14) fern.z -= 160;
    }
    updateFerns();
    for (const prop of natureProps) {
      prop.position.z += speed * dt;
      if (prop.position.z > 15) prop.position.z -= 165;
    }

    // Recycle weathered road lines with the scrolling ground.
    for (const mark of roadMarkPositions) {
      mark.z += speed * dt;
      if (mark.z > 15) mark.z -= 168;
    }
    if ((debrisUpdateFrame & 1) === 0) updateRoadMarks();

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

    // Recycle small forest-floor details in the same scrolling world.
    for (const item of forestDebrisPositions) {
      item.z += speed * dt;
      if (item.z > 15) item.z -= 160;
    }
    for (const patch of mossPositions) {
      patch.z += speed * dt;
      if (patch.z > 15) patch.z -= 160;
    }
    if ((debrisUpdateFrame++ & 1) === 0) {
      updateForestDebris();
      updateMoss();
    }

    // Keep wet-soil patches travelling with the terrain.
    for (const patch of mudPatches) {
      patch.position.z += speed * dt;
      if (patch.position.z > 15) patch.position.z -= 160;
    }

    // Riciclo degli elementi del paesaggio
    for (const tree of forest) {
      tree.position.z += speed * dt;

      if (tree.position.z > 15) {
        tree.position.z -= 160;
      }
    }

    for (const leaf of litterItems) {
      leaf.z += speed * dt;
      if (leaf.z > 15) leaf.z -= 161;
    }
    if ((grassUpdateFrame & 1) === 0) updateLitter();

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
          falling = true;
          fallProgress = 0;
          jumping = false;
          jumpVelocity = 0;
          if (soldierActiveAction) soldierActiveAction.paused = true;
          message.textContent = 'COLPITO!';
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
  const landscape = innerWidth > innerHeight;
  targetCamera.set(
    player.position.x * 0.25,
    (landscape ? 3.05 : 3.35) + player.position.y * 0.22,
    landscape ? 7.8 : 7.1
  );

  camera.position.lerp(targetCamera, 0.04);

  camera.lookAt(
    player.position.x * 0.18,
    (landscape ? 1.35 : 1.55) + player.position.y * 0.25,
    landscape ? -7 : -5
  );

  if (currentQuality === 'ultra' && ultraComposer) {
    try { ultraComposer.render(); }
    catch (error) {
      console.warn('[Corsa Renderer] GTAO failed, switching to safe fallback', error);
      ultraComposer = null;
      if (cinematicComposer) cinematicComposer.render();
      else renderer.render(scene, camera);
    }
  } else if (cinematicComposer && qualityPresets[currentQuality].post) cinematicComposer.render();
  else renderer.render(scene, camera);
}

requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, qualityPresets[currentQuality].dpr)
  );
  if (cinematicComposer) cinematicComposer.setSize(innerWidth, innerHeight);
  if (ultraComposer) ultraComposer.setSize(innerWidth, innerHeight);
});
