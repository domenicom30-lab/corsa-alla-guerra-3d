// Deterministic, restartable 2D enemy director: authored waves, no server assets.
// All coordinates are world-space except bullets spawned in screen-space.
export const ENEMY_TYPES=Object.freeze({
 rifleman:{hp:1,range:1.5,rate:2.4,speed:0,points:120},
 assault:{hp:2,range:1.25,rate:1.45,speed:.32,points:170},
 grenadier:{hp:2,range:1.45,rate:3.5,speed:0,points:240},
 heavy:{hp:4,range:1.55,rate:2.8,speed:.11,points:350}
});
const pattern=['rifleman','assault','rifleman','grenadier','assault','heavy','rifleman','assault','grenadier','heavy'];
export function createTroopWaves(){
 const enemies=[];
 for(let wave=0;wave<9;wave++){
  const start=1030+wave*930;
  const count=wave<2?3:wave<5?4:5;
  for(let j=0;j<count;j++){
   const type=pattern[(wave*3+j)%pattern.length],info=ENEMY_TYPES[type],x=start+j*(145+(wave%2)*35);
   enemies.push({x,home:x,type,hp:info.hp,maxHp:info.hp,alive:true,cooldown:.7+j*.35+wave*.06,
    phase:wave*.7+j*.45,stance:'stand',flinch:0,fireFlash:0,walk:0,vx:0,aim:0,score:info.points});
  }
 }
 return enemies;
}
export function resetTroopWaves(enemies){
 for(const e of enemies){
  const info=ENEMY_TYPES[e.type];e.x=e.home;e.hp=info.hp;e.maxHp=info.hp;e.alive=true;
  e.cooldown=.8+(e.phase%1)*.8;e.stance='stand';e.flinch=0;e.fireFlash=0;e.walk=0;e.vx=0;e.aim=0;
 }
}
export function damageTroop(e,damage=1){
 if(!e?.alive||damage<=0)return {hit:false,killed:false,points:0};
 e.hp=Math.max(0,e.hp-damage);e.flinch=.2;
 if(e.hp===0){e.alive=false;return {hit:true,killed:true,points:e.score}}
 return {hit:true,killed:false,points:0};
}
export function advanceTroopWaves(enemies,dt,scroll,playerWorldX,playerScreenX,H,enemyShots){
 const events=[];if(dt<=0)return events;
 for(const e of enemies){
  if(!e.alive)continue;
  e.flinch=Math.max(0,e.flinch-dt);e.fireFlash=Math.max(0,e.fireFlash-dt);
  const dx=playerWorldX-e.x,range=Math.abs(dx);
  if(range>H*2.8)continue;
  const type=ENEMY_TYPES[e.type],dir=dx>=0?1:-1;
  if(range<H*.82&&type.speed>0){
   const stop=e.type==='heavy'?H*.5:H*.24;
   e.vx=range>stop?dir*type.speed*H:0;
   e.x+=e.vx*dt;e.walk+=Math.abs(e.vx)*dt/H*10;
  }else{e.vx=0}
  e.stance=e.type==='rifleman'&&range<H*.63&&Math.sin(e.phase+e.walk+playerWorldX*.001)>0?'crouch':'stand';
  e.cooldown-=dt;
  if(range<H*type.range&&range>H*.22&&e.cooldown<=0&&enemyShots.length<24){
   e.cooldown=type.rate+(e.phase%1)*.55;
   e.fireFlash=.12;e.aim=dir;
   const x=e.x-scroll+dir*H*.075,y=e.stance==='crouch'?H*.78-H*.095:H*.78-H*.145;
   if(e.type==='grenadier'){
    enemyShots.push({x,y:y-H*.035,vx:dir*H*.5,vy:-H*.78,gravity:H*1.55,kind:'grenade',life:2.8});
    events.push({type:'lob',x,y});
   }else if(e.type==='heavy'){
    for(const spread of [-.09,0,.09])enemyShots.push({x,y,vx:dir*H*1.1,vy:spread*H*1.1,kind:'tracer',life:2});
    events.push({type:'heavyFire',x,y});
   }else{
    enemyShots.push({x,y,vx:dir*H*(e.type==='assault'?1.2:.92),vy:0,kind:'tracer',life:2.1});
    events.push({type:'fire',x,y});
   }
  }
  if(range<H*.1&&e.type==='assault')events.push({type:'contact',x:e.x-scroll,y:H*.7});
 }
 return events;
}
