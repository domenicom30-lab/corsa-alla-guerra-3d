import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFieldEmplacements} from '../field-emplacements.js';
import {firstRectHit} from '../collision-order.js';
import {createArcadeSystems} from '../arcade-mechanics.js';

const H=400,ground=H*.78,world=createFieldEmplacements();
const [nest]=world.emplacements;
assert.equal(world.emplacements.length,6,'Six original static enemy emplacements');
assert.ok(world.emplacements.every(e=>e.hp===5&&!e.destroyed));
const target=world.targets(0,ground,H)[0];
assert.equal(target.kind,'emplacement');
assert.equal(target.ref,nest);
assert.notEqual(firstRectHit(300,target.y,2400,target.y,target),null,
 'Swept player bullets hit a narrow field gun');
assert.equal(firstRectHit(300,ground-H*.4,2400,ground-H*.4,target),null,
 'High shots fly safely over the gun');

const ammo=[];
let fired=0;
const encounter={scroll:nest.x-H,playerWorldX:nest.x-H*.6,ground,H,enemyShots:ammo,
 onFire:()=>fired++};
world.step(.08,encounter);
assert.equal(nest.warning,0,'First shots cannot spawn without an initial cooldown');
for(let k=0;k<12;k++)world.step(.08,encounter);
assert.ok(nest.warning>0,'Windup is visually telegraphed before bullets fly');
assert.equal(ammo.length,0);
for(let k=0;k<18;k++)world.step(.08,encounter);
assert.equal(ammo.length,3,'A full enemy salvo sends exactly three shots');
assert.equal(fired,3);
assert.ok(ammo.every(b=>b.kind==='tracer'&&b.vx<0&&b.life>0));
assert.ok(ammo.every(b=>b.y===ground-H*.155));

const coverFire=createArcadeSystems();
const sample=ammo[0];
const sx=sample.x,scroll=encounter.scroll,playerX=200;
let hits=0;
coverFire.enemyShots.push({...sample,x:sx});
coverFire.step(.7,scroll,playerX,ground,H,()=>hits++,()=>{},0,{jumpY:0,crouching:false});
assert.equal(hits,1,'Turret bullets use the real shared player collision pipeline');

const ducking=createArcadeSystems();
ducking.enemyShots.push({...sample,x:sx});
ducking.step(.7,scroll,playerX,ground,H,()=>hits++,()=>{},0,{jumpY:0,crouching:true});
assert.equal(hits,1,'Crouch avoids field gun chest-high tracer fire');

const damaged=world.hit(nest,2);
assert.equal(damaged.hit,true);assert.equal(damaged.killed,false);assert.equal(nest.hp,3);
assert.equal(nest.burstLeft,0,'Taking damage interrupts an active burst');
assert.equal(nest.warning,0,'Hurt state cancels charging');
const killed=world.hit(nest,3);
assert.equal(killed.killed,true);assert.equal(killed.points,450);
assert.equal(world.hit(nest,20).hit,false,'Destroyed emplacements cannot be farmed');
assert.equal(world.targets(0,ground,H).length,5,'Wreck never blocks incoming bullets');

const other=world.emplacements[1];
const blast=world.blast(other.x,H*.35);
assert.equal(blast.length,1,'Rocket or grenade kills emplacement in blast radius');
assert.equal(blast[0].id,other.id);
assert.equal(world.blast(other.x,H*.35).length,0,'No second score from the same explosion');

world.reset();
assert.ok(world.emplacements.every(e=>e.hp===5&&!e.destroyed));
assert.equal(world.ram(1760,1890,250,H).length,1,'Tank front crushes a field gun');
assert.equal(world.ram(1760,1890,250,H).length,0,'Repeated overlap does not create loot');
world.reset();
assert.equal(world.ram(1760,1890,35,H).length,0,'Weak movement does not destroy gun nests');
assert.equal(world.ram(NaN,1890,300,H).length,0);
assert.equal(world.ram(2100,1890,-250,H).length,1,'Reverse sweep works');

world.reset();
const distant=world.emplacements[5],q=[];
for(let i=0;i<70;i++)world.step(.07,{scroll:0,playerWorldX:0,ground,H,enemyShots:q});
assert.equal(q.length,0,'Offscreen emplacements never attack');
assert.ok(distant.cooldown>=.65);
world.reset();
const cap=new Array(22).fill(null).map(()=>({kind:'tracer'}));
for(let i=0;i<45;i++)world.step(.07,{...encounter,enemyShots:cap});
assert.equal(cap.length,22,'Shared projectile cap prevents FPS-killing bullet floods');
world.reset();

let drawn=0,created=0;
const prevDocument=globalThis.document;
const noop=()=>{};
globalThis.document={createElement(tag){
 assert.equal(tag,'canvas');created++;
 return {width:0,height:0,getContext(){
  return {fillRect:noop,fill:noop,beginPath:noop,moveTo:noop,lineTo:noop,closePath:noop};
 }};
}};
try{
 const context={canvas:{width:1100},save:noop,restore:noop,translate:noop,scale:noop,drawImage(){drawn++}};
 world.draw(context,nest.x-H,ground,H,0);
 world.draw(context,nest.x-H,ground,H,1);
 assert.equal(created,4,'Detailed original images are rasterized exactly once');
 assert.ok(drawn>=2);
 assert.equal(created,4,'Repeated frames reuse cached art');
}finally{if(prevDocument===undefined)delete globalThis.document;else globalThis.document=prevDocument}

const main=readFileSync('main.js','utf8');
for(const marker of [
 "import {createFieldEmplacements} from './field-emplacements.js'",
 "const emplacements=createFieldEmplacements();",
 "emplacements.blast(scroll+x,radius,5)",
 "emplacements.ram(previousScroll+playerX()",
 "emplacements.step(dt,{scroll,playerWorldX:",
 "emplacements.targets(scroll,ground(),H)",
 "emplacements.hit(target,b.damage)",
 "emplacements.draw(ctx,scroll,ground(),H,phase)",
 "emplacements.reset()"
])assert.ok(main.includes(marker),'Live integration missing: '+marker);
const apk=readFileSync('.github/workflows/build-apk.yml','utf8');
assert.ok(apk.includes('on:\n  workflow_dispatch:')&&!apk.includes('\n  push:'),'No automatic APK builds');
console.log('PASS: gun-nest AI with warning, salvos, ducking, real hits, damage interrupts, splash, tank, original cached sprites, bounds and restart');
