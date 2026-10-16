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
    phase:wave*.7+j*.45,stance:'stand',flinch:0,fireFlash:0,walk:0,vx:0,aim:0,windup:0,dodgeTime:0,dodgeDir:0,suppressed:0,suppressionCooldown:0,score:info.points});
  }
 }
 return enemies;
}
export function resetTroopWaves(enemies){
 for(const e of enemies){
  const info=ENEMY_TYPES[e.type];e.x=e.home;e.hp=info.hp;e.maxHp=info.hp;e.alive=true;
  e.cooldown=.8+(e.phase%1)*.8;e.stance='stand';e.flinch=0;e.fireFlash=0;e.walk=0;e.vx=0;e.aim=0;e.windup=0;e.dodgeTime=0;e.dodgeDir=0;e.suppressed=0;e.suppressionCooldown=0;
 }
}
export function damageTroop(e,damage=1){
 if(!e?.alive||damage<=0)return {hit:false,killed:false,points:0};
 e.hp=Math.max(0,e.hp-damage);e.flinch=.2;e.windup=0;e.cooldown=Math.max(e.cooldown,.28);
 if(e.hp>0&&e.type==='assault'){e.dodgeTime=.34;e.dodgeDir=(Math.sin(e.phase*6.37)>0?1:-1);e.stance='crouch';e.cooldown=Math.max(e.cooldown,.65)}
 if(e.hp===0){e.alive=false;return {hit:true,killed:true,points:e.score}}
 return {hit:true,killed:false,points:0};
}
// Triggered only by an actual near-miss projectile crossing the enemy's danger band.
export function suppressTroop(e,bulletY,ground,H,incoming=1){
 if(!e?.alive||e.type==='heavy'||e.suppressionCooldown>0||!Number.isFinite(bulletY)||H<=0)return false;
 if(bulletY<ground-H*.31||bulletY>ground-H*.045)return false;
 e.windup=0;
 e.suppressed=.54;
 e.suppressionCooldown=1.55;
 e.cooldown=Math.max(e.cooldown,.65);
 e.stance='crouch';
 e.aim=incoming>=0?1:-1;
 if(e.type==='assault'&&e.dodgeTime<=0){e.dodgeTime=.24;e.dodgeDir=-Math.sign(incoming||1)}
 return true;
}
export function advanceTroopWaves(enemies,dt,scroll,playerWorldX,playerScreenX,H,enemyShots){
 const events=[];if(dt<=0)return events;
 for(const e of enemies){
  if(!e.alive)continue;
  e.flinch=Math.max(0,e.flinch-dt);e.fireFlash=Math.max(0,e.fireFlash-dt);
  e.suppressionCooldown=Math.max(0,(e.suppressionCooldown||0)-dt);
  e.suppressed=Math.max(0,(e.suppressed||0)-dt);
  if(e.dodgeTime>0){const step=Math.min(dt,e.dodgeTime);e.x+=e.dodgeDir*H*.7*step;e.walk+=step*15;e.vx=e.dodgeDir*H*.7;e.stance='crouch';e.dodgeTime-=step;e.cooldown=Math.max(e.cooldown,.15);if(e.dodgeTime<=0)e.flinch=.10;continue;}
  if(e.suppressed>0){e.stance='crouch';e.windup=0;e.vx=0;continue;}
  const dx=playerWorldX-e.x,range=Math.abs(dx);
  if(range>H*2.8)continue;
  const type=ENEMY_TYPES[e.type],dir=dx>=0?1:-1;
  if(e.type==='grenadier'&&range<H*.67&&Math.abs(e.x-e.home)<H*.73){
   // Grenadiers try to regain throwing distance instead of standing still.
   e.vx=-dir*H*.24;
   const next=e.x+e.vx*dt;
   e.x=Math.max(e.home-H*.75,Math.min(e.home+H*.75,next));
   e.walk+=Math.abs(e.vx)*dt/H*11;
  }else if(range<H*.82&&type.speed>0){
   // Assault troops can close to contact range; heavies stop to aim their gun.
   const stop=e.type==='heavy'?H*.5:H*.075;
   e.vx=range>stop?dir*type.speed*H:0;
   e.x+=e.vx*dt;e.walk+=Math.abs(e.vx)*dt/H*10;
  }else{e.vx=0}
  e.stance=e.type==='rifleman'&&range<H*.63&&Math.sin(e.phase+e.walk+playerWorldX*.001)>0?'crouch':'stand';
  e.cooldown-=dt;
  const canFire=range<H*type.range&&range>H*.22;
  if(!canFire&&e.windup>0)e.windup=0;
  if(canFire&&e.cooldown<=0&&e.windup<=0){
   e.windup=e.type==='heavy'?.46:e.type==='grenadier'?.58:.29;
   e.aim=dir;events.push({type:'warning',x:e.x-scroll,y:H*.78-H*.29});
  }
  if(e.windup>0){
   e.windup=Math.max(0,e.windup-dt);
   if(e.windup===0){
    e.cooldown=type.rate+(e.phase%1)*.55;
    if(enemyShots.length<=21){
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
   }
  }
  if(range<H*.1&&e.type==='assault')events.push({type:'contact',x:e.x-scroll,y:H*.7});
 }
 return events;
}
