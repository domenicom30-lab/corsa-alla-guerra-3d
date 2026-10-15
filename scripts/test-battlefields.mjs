import assert from 'node:assert/strict';
import {createTroopWaves,resetTroopWaves,advanceTroopWaves,damageTroop,ENEMY_TYPES} from '../enemy-director.js';
import {prepareTroopSprites,drawTroop,troopKinds} from '../troop-art.js';
import {stageAt,STAGES,drawStageBackdrop,drawStageMarker} from '../stage-art.js';
import {createArcadeSystems} from '../arcade-mechanics.js';

const troops=createTroopWaves(),types=new Set(troops.map(e=>e.type));
assert.ok(troops.length>=32,'Many authored troop waves required');
assert.equal(types.size,4);
assert.ok(troops.every(e=>e.hp>0&&e.alive));
assert.ok(troops[0].x<troops[troops.length-1].x);
const heavy=troops.find(e=>e.type==='heavy');
assert.equal(damageTroop(heavy,1).killed,false);
assert.equal(heavy.hp,ENEMY_TYPES.heavy.hp-1);
assert.equal(damageTroop(heavy,10).killed,true);
assert.equal(damageTroop(heavy,1).hit,false);
resetTroopWaves(troops);
assert.ok(troops.every(e=>e.hp===ENEMY_TYPES[e.type].hp&&e.alive&&e.x===e.home));

for(const type of troopKinds){
 const enemy=troops.find(e=>e.type===type);
 enemy.cooldown=0;enemy.aim=0;
 const shots=[],warning=advanceTroopWaves([enemy],.03,enemy.x-200,enemy.x+200,200,380,shots);
 assert.ok(warning.some(e=>e.type==='warning'),type+' must telegraph an attack');
 assert.equal(shots.length,0,'No projectile before the telegraph finishes');
 const events=advanceTroopWaves([enemy],.7,enemy.x-200,enemy.x+200,200,380,shots);
 assert.ok(shots.length>0,type+' must attack after winding up');
 assert.ok(events.some(e=>e.type==='fire'||e.type==='heavyFire'||e.type==='lob'));
 assert.equal(shots.length,type==='heavy'?3:1);
 if(type==='grenadier'){assert.equal(shots[0].kind,'grenade');assert.ok(shots[0].gravity>0)}
}
const stagger=createTroopWaves().find(e=>e.type==='heavy');
stagger.cooldown=0;
advanceTroopWaves([stagger],.02,stagger.x-200,stagger.x+200,200,380,[]);
assert.ok(stagger.windup>0);
const wounded=damageTroop(stagger,1);
assert.ok(wounded.hit&&!wounded.killed);
assert.equal(stagger.windup,0,'Damage interrupts a queued enemy shot');
assert.ok(stagger.cooldown>=.28,'Wounded enemy has a stagger delay');
const original=globalThis.document;
let created=0,drawn=0;
const noop=()=>{};
const brush=new Proxy({imageSmoothingEnabled:false},{
 get(o,k){return k in o?o[k]:noop},
 set(o,k,v){o[k]=v;return true}
});
globalThis.document={createElement(tag){
 assert.equal(tag,'canvas');created++;
 return {width:0,height:0,getContext(){return brush}};
}};
try{
 prepareTroopSprites();assert.equal(created,32);
 prepareTroopSprites();assert.equal(created,32,'Sprite frames must stay cached');
 const ctx=new Proxy({imageSmoothingEnabled:false,save:noop,restore:noop,drawImage(){drawn++}},{
  get(o,k){return k in o?o[k]:noop},set(o,k,v){o[k]=v;return true}
 });
 for(const type of troopKinds){
  const e=troops.find(e=>e.type===type);e.aim=1;
  assert.equal(drawTroop(ctx,e,e.x-100,380,296,1),true);
  e.aim=-1;assert.equal(drawTroop(ctx,e,e.x-100,380,296,1),true);
 }
 assert.equal(drawn,8);
}finally{if(original===undefined)delete globalThis.document;else globalThis.document=original}

assert.deepEqual(STAGES.map(s=>s.name),['FORESTA DI CONFINE','VILLAGGIO IN ROVINA','DISTRETTO INDUSTRIALE','FORTEZZA DI FERRO']);
for(const [offset,want] of [[0,0],[2349,0],[2350,1],[5449,1],[5450,2],[8249,2],[8250,3],[10000,3]])assert.equal(stageAt(offset),want);
const gradient={addColorStop:noop};
const ctx=new Proxy({globalAlpha:1,save:noop,restore:noop,createLinearGradient(){return gradient}},{
 get(o,k){return k in o?o[k]:noop},set(o,k,v){o[k]=v;return true}
});
for(const x of [0,2400,5500,8400]){
 drawStageBackdrop(ctx,840,390,x,304,3);
 drawStageMarker(ctx,840,390,x,304);
}
const game=createArcadeSystems();const h=390,ground=h*.78;
game.enemyShots.push({x:200,y:ground-5,vx:0,vy:200,gravity:400,kind:'grenade',life:1});
let hurt=0,explosions=[];
game.step(.05,0,200,ground,h,()=>hurt++,(...args)=>explosions.push(args));
assert.equal(hurt,1,'Grenade splash damages player within radius');
assert.equal(game.enemyShots.length,0,'Grenade expires upon ground impact');
assert.ok(explosions.some(args=>args[3]===true),'Enemy grenade cannot damage friendly enemies / boss');
// Duck and jump use small, separate hitboxes: a high straight shot must miss.
const playerShotTest=createArcadeSystems(),baseY=ground-h*.18;
playerShotTest.enemyShots.push({x:200,y:baseY,vx:0,vy:0,kind:'tracer',life:1});
let struck=0;
playerShotTest.step(.03,0,200,ground,h,()=>struck++,()=>{},0,{crouching:true,jumpY:0});
assert.equal(struck,0,'Crouching should evade chest-high fire');
playerShotTest.step(.03,0,200,ground,h,()=>struck++,()=>{},0,{crouching:false,jumpY:0});
assert.equal(struck,1,'Standing at the same position should be hit');
playerShotTest.enemyShots.push({x:200,y:baseY,vx:0,vy:0,kind:'tracer',life:1});
playerShotTest.step(.03,0,200,ground,h,()=>struck++,()=>{},0,{crouching:false,jumpY:h*.3});
assert.equal(struck,1,'Jumping should evade chest-high fire');
console.log('PASS: 4 troop types, diverse attacks, 32 sprite frames, 4 stages, grenade trajectory and splash');
