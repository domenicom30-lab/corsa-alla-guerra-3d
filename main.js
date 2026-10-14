import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9aa9a2);
scene.fog = new THREE.FogExp2(0x9aa9a2, 0.018);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 180);
camera.position.set(0, 5.3, 10.5);
camera.lookAt(0, 1.2, -3);

scene.add(new THREE.HemisphereLight(0xdde8e4, 0x303b2d, 2.0));
const sun = new THREE.DirectionalLight(0xffe1b2, 3.0);
sun.position.set(-5, 12, 5); sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024);
scene.add(sun);

const mat = (color, roughness=0.85) => new THREE.MeshStandardMaterial({color, roughness});
const asphalt = mat(0x343a38), edgeMat = mat(0xb9b8a8), stripeMat = mat(0xd9d7c5);
const trunkMat = mat(0x4a3828), leafMats = [mat(0x263b2a),mat(0x344c32),mat(0x42583a)];
const road = new THREE.Mesh(new THREE.PlaneGeometry(8, 180), asphalt);
road.rotation.x = -Math.PI/2; road.position.set(0, -0.08, -55); road.receiveShadow=true; scene.add(road);
for (const x of [-4.15,4.15]) { const edge=new THREE.Mesh(new THREE.BoxGeometry(.18,.08,180),edgeMat); edge.position.set(x,-.02,-55); scene.add(edge); }
const dashes=[];
for(let z=10;z>-150;z-=7){const d=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,3),stripeMat);d.position.set(0,-.025,z);scene.add(d);dashes.push(d);}
const forest=[];
function tree(x,z,s=1){
  const group=new THREE.Group(); group.position.set(x,0,z); group.scale.setScalar(s);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16,.26,2.7,7),trunkMat); trunk.position.y=1.3; trunk.castShadow=true;group.add(trunk);
  for(let i=0;i<3;i++){const crown=new THREE.Mesh(new THREE.ConeGeometry(1.05-i*.15,2.4,7),leafMats[(Math.random()*leafMats.length)|0]);crown.position.y=2.5+i*.85;crown.castShadow=true;group.add(crown);}
  scene.add(group);forest.push(group);
}
for(let z=14;z>-145;z-=5.5){tree(-5.8-Math.random()*5,z,.75+Math.random()*.65);tree(5.8+Math.random()*5,z-2,.75+Math.random()*.65);}
const ground = new THREE.Mesh(new THREE.PlaneGeometry(100,180),mat(0x384332));
ground.rotation.x=-Math.PI/2;ground.position.set(0,-.19,-55);scene.add(ground);

// Stylized fictional military runner, not a photorealistic likeness.
const player = new THREE.Group(); scene.add(player); player.position.set(0,0,3);
const uniform=mat(0x5d6240), skin=mat(0xc99a78), dark=mat(0x292c29), boot=mat(0x242522), belt=mat(0x39372b);
function box(parent, size, material, pos){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
box(player,[.68,.9,.35],uniform,[0,1.45,0]);
box(player,[.72,.12,.39],belt,[0,1.22,0]);
const head=new THREE.Mesh(new THREE.SphereGeometry(.25,16,12),skin);head.position.set(0,2.12,0);head.castShadow=true;player.add(head);
box(player,[.52,.15,.48],dark,[0,2.34,0]);
const brim=box(player,[.64,.07,.55],dark,[0,2.27,.04]);
for(const side of [-1,1]){
 box(player,[.22,.68,.25],uniform,[side*.47,1.48,0]);
 box(player,[.24,.16,.28],skin,[side*.47,1.12,0]);
 box(player,[.25,.55,.28],uniform,[side*.2,.65,0]);
 box(player,[.28,.18,.38],boot,[side*.2,.26,.05]);
}
const obstacles=[];
function obstacle(z){
 const lane=[-2.5,0,2.5][Math.floor(Math.random()*3)];
 const type=Math.random();
 let o;
 if(type<.38){
  o=new THREE.Group();
  box(o,[1.25,.8,.55],mat(0x665c49),[0,.4,0]);
  for(let i=0;i<3;i++) box(o,[.25,.85,.6],mat(0x7c705b),[-.4+i*.4,.42,0]);
 } else if(type<.7){
  o=new THREE.Group();
  const log=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,2.3,10),trunkMat);log.rotation.z=Math.PI/2;log.position.y=.3;log.castShadow=true;o.add(log);
 } else {
  o=new THREE.Group();
  box(o,[1.1,1.2,.3],mat(0x5a624b),[0,.6,0]);
  box(o,[1.3,.12,.38],mat(0x30372e),[0,1.25,0]);
 }
 o.position.set(lane,0,z); scene.add(o); obstacles.push({mesh:o,passed:false});
}
for(let z=-18;z>-130;z-=12+Math.random()*7) obstacle(z);

let running=false, ended=false, distance=0, lane=1, jumpV=0, jumping=false, speed=0.25;
const message=document.querySelector('#message'), stats=document.querySelector('#stats');
function start(){if(ended){location.reload();return;}running=true;message.textContent='EVITA GLI OSTACOLI';}
function move(dir){if(!running)start();lane=Math.max(0,Math.min(2,lane+dir));}
function jump(){if(!running)start();if(!jumping){jumping=true;jumpV=.19;}}
document.querySelector('#left').onclick=()=>move(-1);
document.querySelector('#right').onclick=()=>move(1);
document.querySelector('#jump').onclick=jump;
canvas.addEventListener('pointerdown',()=>{if(!running)start();});
addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a')move(-1);if(e.key==='ArrowRight'||e.key==='d')move(1);if(e.key===' '||e.key==='ArrowUp')jump();});
let last=0;
function animate(t){
 requestAnimationFrame(animate);
 const dt=Math.min((t-last)/16.67||1,2);last=t;
 if(running){
  distance+=speed*dt;stats.textContent=`Distanza: ${Math.floor(distance*2)} m`;
  player.position.x=THREE.MathUtils.damp(player.position.x,[-2.5,0,2.5][lane],.16,dt);
  player.rotation.z=THREE.MathUtils.damp(player.rotation.z,(player.position.x-[-2.5,0,2.5][lane])*.08,.15,dt);
  if(jumping){player.position.y+=jumpV*dt;jumpV-=.012*dt;if(player.position.y<=0){player.position.y=0;jumping=false;jumpV=0;}}
  for(const d of dashes){d.position.z+=speed*dt;if(d.position.z>12)d.position.z-=168;}
  for(const tr of forest){tr.position.z+=speed*dt;if(tr.position.z>15)tr.position.z-=160;}
  for(const ob of obstacles){
   ob.mesh.position.z+=speed*dt;
   if(!ob.passed && ob.mesh.position.z>3.1){
    ob.passed=true;
    if(Math.abs(ob.mesh.position.x-player.position.x)<1.15 && player.position.y<.65){
      running=false;ended=true;message.textContent='SEI STATO FERMATO — TOCCA PER RIPROVARE';
    }
   }
   if(ob.mesh.position.z>14){ob.mesh.position.z=-125-Math.random()*15;ob.mesh.position.x=[-2.5,0,2.5][Math.floor(Math.random()*3)];ob.passed=false;}
  }
  if(distance>500){running=false;ended=true;message.textContent='TRAGUARDO RAGGIUNTO — TOCCA PER RIGIOCARE';}
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
