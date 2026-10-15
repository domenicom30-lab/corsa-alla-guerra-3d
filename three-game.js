import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import './style.css';

// Separate 3D engine: the original 2D Metal Slug mode remains in main.js.
const canvas=document.getElementById('game');
const message=document.getElementById('message');
const stats=document.getElementById('stats');
const points=document.getElementById('points');
const hearts=document.getElementById('hearts');
const credit=document.getElementById('victory-credit');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9aaca9);
scene.fog=new THREE.Fog(0x9aaca9,26,116);
const camera=new THREE.PerspectiveCamera(65,Math.max(1,innerWidth/innerHeight),0.1,240);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.13;
scene.add(new THREE.HemisphereLight(0xc9e5ff,0x42543b,2.0));
const sun=new THREE.DirectionalLight(0xffeac7,2.5);
sun.position.set(-14,28,-30);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-27;sun.shadow.camera.right=27;
sun.shadow.camera.top=27;sun.shadow.camera.bottom=-27;
sun.shadow.normalBias=.03;
scene.add(sun);
const wood=new THREE.MeshStandardMaterial({color:0x574733,roughness:.93});
const bark=new THREE.MeshStandardMaterial({color:0x463c32,roughness:1});
const pine=new THREE.MeshStandardMaterial({color:0x284332,roughness:.96});
const pineLight=new THREE.MeshStandardMaterial({color:0x3b5341,roughness:.95});
const olive=new THREE.MeshStandardMaterial({color:0x4b5945,roughness:.8,metalness:.17});
const metal=new THREE.MeshStandardMaterial({color:0x353e38,metalness:.64,roughness:.48});
const rubber=new THREE.MeshStandardMaterial({color:0x1e2726,metalness:.06,roughness:.91});
const fireMat=new THREE.MeshStandardMaterial({color:0xffcc64,emissive:0xff7a17,emissiveIntensity:2});
const textureLoader=new THREE.TextureLoader();
function texture(path,repeatX,repeatY){
 const t=textureLoader.load(path,undefined,undefined,()=>{});
 t.wrapS=t.wrapT=THREE.RepeatWrapping;
 t.repeat.set(repeatX,repeatY);
 t.colorSpace=THREE.SRGBColorSpace;
 t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
 return t;
}
function groundPlane(width,length,x,z,material){
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,length),material);
 mesh.rotation.x=-Math.PI/2;mesh.position.set(x,-.09,z);mesh.receiveShadow=true;scene.add(mesh);
 return mesh;
}
const earth=new THREE.MeshStandardMaterial({map:texture('/assets/textures/forest_color.jpg',25,55),roughness:1,color:0xb0baa5});
const road=new THREE.MeshStandardMaterial({map:texture('/assets/textures/road_color.jpg',1.7,55),roughness:1,color:0xd9ceb8});
groundPlane(230,340,0,-110,earth);
const roadMesh=groundPlane(8.5,250,0,-111,road);roadMesh.position.y=-.06;
for(const x of [-4.5,4.5]){
 const verge=new THREE.Mesh(new THREE.BoxGeometry(.24,.08,255),new THREE.MeshStandardMaterial({color:0x706a53,roughness:1}));
 verge.position.set(x,-.05,-110);scene.add(verge);
}
const seed=()=>{let s=438921;return ()=>((s=Math.imul(1664525,s)+1013904223|0)>>>0)/4294967296};
const random=seed();
const treeLocations=[];
for(let z=24;z>-235;z-=4.6)for(const side of [-1,1])for(let j=0;j<3;j++){
 const x=side*(7.1+j*5.6+random()*4.4);
 treeLocations.push({x,z:z+(random()-.5)*3,h:7+random()*8,twist:random()*Math.PI});
}
const trunkGeo=new THREE.CylinderGeometry(.23,.33,1,6);
const crownGeo=new THREE.ConeGeometry(1,1,7);
const trunks=new THREE.InstancedMesh(trunkGeo,bark,treeLocations.length);
trunks.castShadow=false;
const crowns=Array.from({length:3},(_,layer)=>{
 const mesh=new THREE.InstancedMesh(crownGeo,layer===2?pineLight:pine,treeLocations.length);
 mesh.castShadow=false;return mesh;
});
const dummy=new THREE.Object3D();
treeLocations.forEach((t,i)=>{
 dummy.position.set(t.x,t.h*.15,t.z);dummy.scale.set(t.h*.05,t.h*.3,t.h*.05);dummy.rotation.set(0,t.twist,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
 for(let layer=0;layer<3;layer++){
  dummy.position.set(t.x,t.h*(.41+layer*.20),t.z);
  dummy.scale.set(t.h*(.15-layer*.026),t.h*(.40-layer*.075),t.h*(.15-layer*.026));
  dummy.rotation.set(0,t.twist,0);dummy.updateMatrix();crowns[layer].setMatrixAt(i,dummy.matrix);
 }
});
scene.add(trunks,...crowns);
for(const x of [-3.6,3.6])for(let z=10;z>-210;z-=16){
 const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,.65,6),wood);
 post.position.set(x,.3,z);post.castShadow=false;scene.add(post);
}
function box(parent,w,h,d,x,y,z,mat,bevel=0){
 const geo=new THREE.BoxGeometry(w,h,d);
 const m=new THREE.Mesh(geo,mat);
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function makeTank(enemy=false){
 const t=new THREE.Group();
 const scale=enemy?1.27:1;
 const chassis=box(t,2.4,.54,3.55,0,.56,0,metal);
 box(t,2.55,.45,3.4,0,.93,0,olive);
 box(t,2.0,.22,2.3,0,1.18,-.12,olive);
 for(const side of [-1,1]){
  box(t,.44,.65,3.75,side*1.28,.42,0,rubber);
  for(let i=0;i<5;i++){
   const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.13,16),metal);
   wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.53,.42,-1.35+i*.68);
   t.add(wheel);
  }
  box(t,.2,.14,3.8,side*1.42,.78,0,olive);
 }
 const turret=new THREE.Group();turret.position.set(0,1.29,-.33);
 box(turret,1.9,.56,1.7,0,.2,0,olive);
 box(turret,1.24,.19,1.12,0,.52,0,metal);
 const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.13,.17,2.9,12),metal);
 barrel.rotation.x=Math.PI/2;barrel.position.set(0,.27,-2.12);barrel.castShadow=true;turret.add(barrel);
 const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.29,12),rubber);
 muzzle.rotation.x=Math.PI/2;muzzle.position.set(0,.27,-3.45);turret.add(muzzle);
 t.add(turret);t.scale.setScalar(scale);t.userData.turret=turret;return t;
}
const ride=makeTank();ride.position.set(2.6,.02,-48);scene.add(ride);
const boss=makeTank(true);boss.position.set(0,.02,-188);boss.rotation.y=Math.PI;scene.add(boss);
const bossHealth=12;
const enemies=[];
function fallbackSoldier(){
 const g=new THREE.Group();
 const uniform=new THREE.MeshStandardMaterial({color:0x59634f,roughness:1});
 const skin=new THREE.MeshStandardMaterial({color:0xb68c73,roughness:1});
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.33,.66,5,10),uniform);torso.position.y=1.05;g.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),skin);head.position.y=1.66;g.add(head);
 const helm=new THREE.Mesh(new THREE.SphereGeometry(.24,12,9,0,Math.PI*2,0,Math.PI*.55),metal);helm.position.y=1.78;g.add(helm);
 for(const x of [-.19,.19]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.43,4,8),uniform);leg.position.set(x,.35,0);g.add(leg)}
 for(const x of [-.38,.38]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.38,4,8),uniform);arm.position.set(x,1.05,-.05);g.add(arm)}
 box(g,.12,.15,.9,.3,1.08,-.51,metal);return g;
}
const playerRoot=new THREE.Group();scene.add(playerRoot);
let playerVisual=fallbackSoldier();playerRoot.add(playerVisual);
let mixer=null, animations=[];
const soldierPaths=['/models/ww2_panzergrenadier_2k_cc0-optimized.glb','/models/Soldier.glb'];
function attachModel(gltf){
 const model=gltf.scene;
 model.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;if(n.material){const mats=Array.isArray(n.material)?n.material:[n.material];for(const m of mats)if(m.isMeshStandardMaterial)m.roughness=Math.max(.35,m.roughness)}}});
 const bounds=new THREE.Box3().setFromObject(model),height=bounds.max.y-bounds.min.y;
 if(!Number.isFinite(height)||height<=.01)throw new Error('Invalid GLB geometry');
 const scale=1.78/height;model.scale.setScalar(scale);
 const fitted=new THREE.Box3().setFromObject(model);
 model.position.y-=fitted.min.y;
 playerRoot.remove(playerVisual);playerVisual=model;playerRoot.add(playerVisual);
 if(gltf.animations?.length){
  mixer=new THREE.AnimationMixer(model);animations=gltf.animations;
  const run=animations.find(a=>/run|walk/i.test(a.name))||animations[0];
  mixer.clipAction(run).play();
 }
 for(const enemy of enemies){
  const old=enemy.group.children[0];if(old)enemy.group.remove(old);
  const soldier=cloneSkinned(model);
  soldier.rotation.y=Math.PI;enemy.group.add(soldier);
 }
 const flag=document.getElementById('asset-status');
 if(flag)flag.textContent='SOLDATO 3D GLB CARICATO';
}
function loadPlayerModel(index=0){
 if(index>=soldierPaths.length){const el=document.getElementById('asset-status');if(el)el.textContent='GLB NON CARICATO · SOLDATO DI RISERVA';return}
 new GLTFLoader().load(soldierPaths[index],gltf=>{try{attachModel(gltf)}catch(e){console.error(e);loadPlayerModel(index+1)}},undefined,()=>loadPlayerModel(index+1));
}
for(let i=0;i<7;i++){
 const group=new THREE.Group();group.position.set((i%3-1)*2.45,0,-25-i*22);
 const soldier=fallbackSoldier();soldier.rotation.y=Math.PI;group.add(soldier);scene.add(group);
 enemies.push({group,alive:true,z:group.position.z,cooldown:1.3+i*.3});
}
loadPlayerModel();
const obstacles=[];
for(let i=0;i<13;i++){
 const z=-13-i*13, x=((i*5)%3-1)*2.3;
 const o=new THREE.Group();
 for(let j=0;j<3;j++)box(o,.9,.3,.55,(j-1)*.7,.15+(j%2)*.22,0,wood);
 o.position.set(x,0,z);scene.add(o);obstacles.push({x,z,mesh:o});
}
const projectileGeo=new THREE.SphereGeometry(.09,7,5);
const playerBulletMaterial=fireMat;
const enemyBulletMaterial=new THREE.MeshStandardMaterial({color:0xff522a,emissive:0xff2f13,emissiveIntensity:1.4});
const projectiles=[];
function addProjectile(x,y,z,vx,vz,owner,damage){
 const b=new THREE.Mesh(projectileGeo,owner==='player'?playerBulletMaterial:enemyBulletMaterial);
 b.position.set(x,y,z);scene.add(b);
 projectiles.push({mesh:b,vx,vz,owner,damage,life:2.6});
 if(projectiles.length>85){const old=projectiles.shift();scene.remove(old.mesh)}
}
const controls={left:false,right:false,shoot:false,duck:false};
let started=false,paused=false,won=false,completedAt=0;
let health=3,score=0,distance=0,laneX=0,vy=0,jumpY=0,shootCooldown=0,grenades=8;
let bossHp=bossHealth,rideHp=100,inTank=false,damageCooldown=0,time=0,last=performance.now();
const assetStatus=document.createElement('div');assetStatus.id='asset-status';
Object.assign(assetStatus.style,{position:'fixed',left:'2%',top:'18%',font:'bold 11px system-ui',color:'#f3e3b5',zIndex:'3',pointerEvents:'none',textShadow:'0 2px 4px #000'});
assetStatus.textContent='CARICAMENTO MODELLO SOLDATO 3D…';document.body.appendChild(assetStatus);
const vehicle=document.createElement('button');vehicle.type='button';vehicle.textContent='ENTRA NEL CARRO';
Object.assign(vehicle.style,{position:'fixed',right:'2%',top:'43%',padding:'9px',color:'#fff',background:'#374e3b',border:'2px solid #a7bc90',borderRadius:'10px',fontWeight:'bold',zIndex:'4',touchAction:'manipulation'});
document.body.appendChild(vehicle);
const counter=document.createElement('div');
Object.assign(counter.style,{position:'fixed',top:'18%',right:'2%',color:'#fff',font:'bold 14px system-ui',zIndex:'3',textShadow:'0 2px 4px #000',pointerEvents:'none'});
document.body.appendChild(counter);
function hud(){
 points.textContent='PUNTI: '+score;
 hearts.innerHTML=Array.from({length:3},(_,i)=>'<span class="heart '+(i>=health?'heart-lost':'')+'">♥</span>').join('');
 stats.textContent='TRAGUARDO: '+Math.max(0,Math.ceil(200-distance))+' m · GRANATE '+grenades;
 counter.textContent=(bossHp>0?'BOSS '+Math.ceil(100*bossHp/bossHealth)+'%':'BOSS SCONFITTO')+(inTank?' · CARRO '+rideHp+'%':'');
 vehicle.textContent=inTank?'ESCI DAL CARRO':'ENTRA NEL CARRO';
 vehicle.style.opacity=inTank||Math.abs(distance-48)<5?'1':'.55';
}
function start(){
 if(completedAt&&performance.now()-completedAt<6000)return;
 scene.remove(...projectiles.map(b=>b.mesh));projectiles.length=0;
 started=true;paused=false;won=false;completedAt=0;
 health=3;score=0;distance=0;laneX=0;vy=0;jumpY=0;shootCooldown=0;grenades=8;bossHp=bossHealth;rideHp=100;inTank=false;damageCooldown=0;
 controls.left=controls.right=controls.shoot=controls.duck=false;
 boss.visible=true;boss.position.z=-188;boss.rotation.y=Math.PI;
 ride.position.set(2.6,.02,-48);ride.visible=true;
 for(const e of enemies){e.alive=true;e.group.visible=true;e.cooldown=1.7}
 message.style.display='none';message.classList.remove('victory-message');credit.style.display='none';hud();
}
function togglePause(){
 if(!started||won)return;
 paused=!paused;controls.left=controls.right=controls.shoot=false;
 message.textContent='IN PAUSA · TOCCA PER RIPRENDERE';message.style.display=paused?'block':'none';
}
function harm(){
 if(damageCooldown>0||won)return;
 damageCooldown=1.5;
 if(inTank&&rideHp>0){rideHp=Math.max(0,rideHp-23);if(!rideHp){inTank=false;ride.visible=false}hud();return}
 health--;hud();
 if(health<=0){started=false;message.textContent='GAME OVER · TOCCA PER RIPROVARE';message.style.display='block'}
}
function fire(){
 if(!started){start();return}
 if(paused||won||shootCooldown>0)return;
 shootCooldown=inTank?.27:.16;
 const base=-distance-.85;
 addProjectile(laneX,1.25+jumpY,base,0,-(inTank?52:39),'player',inTank?3:1);
}
function throwGrenade(){
 if(!started){start();return}if(paused||won||grenades<=0)return;
 grenades--;const x=laneX,z=-distance-6;
 for(const e of enemies)if(e.alive&&Math.abs(e.z-z)<5&&Math.abs(e.group.position.x-x)<3){e.alive=false;e.group.visible=false;score+=150}
 if(bossHp>0&&Math.abs(boss.position.z-z)<7){bossHp=Math.max(0,bossHp-4);if(!bossHp){boss.visible=false;score+=3000}}
 hud();
}
function enterTank(){
 if(!started){start();return}
 if(!inTank&&Math.abs(distance-48)>5)return;
 if(!inTank&&rideHp<=0)return;
 inTank=!inTank;ride.visible=true;hud();
}
vehicle.addEventListener('pointerdown',e=>{e.preventDefault();enterTank()});
function bindButton(id,key,action){
 const b=document.getElementById(id);if(!b)return;
 b.addEventListener('pointerdown',e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}if(key)controls[key]=true;if(action)action()});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{if(key)controls[key]=false});
}
bindButton('left','left');
bindButton('right','right');
bindButton('shoot','shoot',fire);
bindButton('jump',null,()=>{if(!started)start();if(!paused&&!inTank&&jumpY===0)vy=6.8});
bindButton('duck','duck');
bindButton('grenade',null,throwGrenade);
bindButton('pause',null,togglePause);
message.addEventListener('pointerdown',()=>{if(paused)togglePause();else start()});
canvas.addEventListener('pointerdown',()=>{if(!started)start()});
addEventListener('keydown',e=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.repeat&&['Space','KeyG','KeyE'].includes(e.code))return;
 if(e.code==='ArrowLeft'||e.code==='KeyA')controls.left=true;
 if(e.code==='ArrowRight'||e.code==='KeyD')controls.right=true;
 if(e.code==='ArrowDown'||e.code==='KeyS')controls.duck=true;
 if(e.code==='Space'||e.code==='ArrowUp'){if(!started)start();if(jumpY===0&&!inTank&&!paused)vy=6.8}
 if(e.code==='KeyF'||e.code==='KeyJ'||e.code==='ControlLeft'){controls.shoot=true;fire()}
 if(e.code==='KeyG')throwGrenade();
 if(e.code==='KeyE')enterTank();
 if(e.code==='Escape'||e.code==='KeyP')togglePause();
 if(e.code==='Enter'){if(!started)start();else if(paused)togglePause()}
});
addEventListener('keyup',e=>{
 if(e.code==='ArrowLeft'||e.code==='KeyA')controls.left=false;
 if(e.code==='ArrowRight'||e.code==='KeyD')controls.right=false;
 if(e.code==='ArrowDown'||e.code==='KeyS')controls.duck=false;
 if(e.code==='KeyF'||e.code==='KeyJ'||e.code==='ControlLeft')controls.shoot=false;
});
addEventListener('blur',()=>{controls.left=controls.right=controls.shoot=controls.duck=false;if(started&&!paused&&!won)togglePause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!paused&&!won)togglePause();last=performance.now()});
addEventListener('resize',()=>{
 camera.aspect=Math.max(.4,innerWidth/Math.max(1,innerHeight));camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});
function update(dt){
 if(!started||paused||won)return;
 time+=dt;damageCooldown=Math.max(0,damageCooldown-dt);shootCooldown=Math.max(0,shootCooldown-dt);
 const speed=inTank?9.5:11;
 distance=Math.min(207,distance+dt*speed);
 laneX=THREE.MathUtils.clamp(laneX+(Number(controls.right)-Number(controls.left))*dt*(inTank?4:6.3),-3.2,3.2);
 if(jumpY>0||vy>0){jumpY+=vy*dt;vy-=19*dt;if(jumpY<=0){jumpY=0;vy=0}}
 const targetY=controls.duck&&!inTank?-.48:0;
 playerRoot.position.set(laneX,jumpY+targetY,-distance);
 playerRoot.visible=!inTank;
 if(mixer)mixer.update(dt);
 else playerVisual.rotation.z=.04*Math.sin(time*13);
 if(inTank)ride.position.set(laneX,.02,-distance);
 sun.position.z=-distance-30;sun.target.position.set(0,0,-distance);sun.target.updateMatrixWorld();
 if(controls.shoot&&shootCooldown<=0)fire();
 for(const e of enemies){
  if(!e.alive)continue;
  if(Math.abs(distance+e.z)<22&&Math.abs(e.group.position.x-laneX)<2.6){
   e.cooldown-=dt;
   if(e.cooldown<=0&&e.z<-distance-.8){e.cooldown=2.5;addProjectile(e.group.position.x,1.1,e.z,0,18,'enemy',1)}
  }
  if(Math.abs(-distance-e.z)<.9&&Math.abs(laneX-e.group.position.x)<.75&&jumpY<1)harm();
 }
 for(const o of obstacles)if(Math.abs(-distance-o.z)<.55&&Math.abs(laneX-o.x)<.8&&jumpY<.65&&!inTank)harm();
 for(let i=projectiles.length-1;i>=0;i--){
  const b=projectiles[i];b.mesh.position.x+=b.vx*dt;b.mesh.position.z+=b.vz*dt;b.life-=dt;
  let hit=false;
  if(b.owner==='enemy'){
   if(Math.abs(b.mesh.position.z+distance)<.65&&Math.abs(b.mesh.position.x-laneX)<.85&&jumpY<1.35){harm();hit=true}
  }else{
   for(const e of enemies)if(e.alive&&Math.abs(b.mesh.position.z-e.z)<.9&&Math.abs(b.mesh.position.x-e.group.position.x)<.8){e.alive=false;e.group.visible=false;score+=120;hit=true;break}
   if(!hit&&bossHp>0&&Math.abs(b.mesh.position.z-boss.position.z)<2.1&&Math.abs(b.mesh.position.x-boss.position.x)<2.1){
    bossHp=Math.max(0,bossHp-b.damage);hit=true;
    if(bossHp===0){score+=3000;boss.visible=false;message.textContent='CARRO NEMICO DISTRUTTO · RAGGIUNGI IL TRAGUARDO';message.style.display='block';setTimeout(()=>{if(started&&!paused&&!won)message.style.display='none'},1800)}
   }
  }
  if(hit||b.life<=0){scene.remove(b.mesh);projectiles.splice(i,1)}
 }
 if(bossHp>0&&distance>168){
  boss.userData.turret.rotation.y=Math.sin(time*.7)*.3;
  if(Math.floor(time*1.4)!==Math.floor((time-dt)*1.4))addProjectile(boss.position.x,1.85,boss.position.z+2.7,0,24,'enemy',1);
 }
 if(distance>=200&&bossHp===0){
  won=true;started=false;completedAt=performance.now();
  controls.shoot=controls.left=controls.right=false;
  message.classList.add('victory-message');
  message.textContent='MISSIONE COMPLETATA!\nTOCCA PER RIPROVARE';
  message.style.display='block';credit.style.display='block';
 }
 hud();
}
hud();message.textContent='CORSA ALLA GUERRA 3D · TOCCA PER INIZIARE';
document.querySelector('.game-title').innerHTML='CORSA ALLA GUERRA <strong>3D</strong>';
credit.textContent='Missione completata';
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
 update(dt);
 const z=-distance;
 camera.position.lerp(new THREE.Vector3(laneX*.45,3.25+jumpY*.26,z+7.9),Math.min(1,dt*6));
 camera.lookAt(laneX*.48,1.05+jumpY*.2,z-9.5);
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
