import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {firstRectHit} from '../collision-order.js';
import {aircraftHitbox,damageAircraft,drawAircraft} from '../aircraft-combat.js';
import {createArcadeSystems} from '../arcade-mechanics.js';
const height=400,game=createArcadeSystems(),plane=game.plane;
assert.equal(aircraftHitbox(plane,height),null,'Inactive plane is not targetable');
plane.active=true;plane.x=200;
const rect=aircraftHitbox(plane,height);
assert.ok(rect&&rect.w>0&&rect.h>0);
assert.ok(firstRectHit(rect.x,150,rect.x,-10,rect)!==null,'Upward stream intersects bomber');
assert.equal(firstRectHit(rect.x+height,150,rect.x+height,-10,rect),null,'Air miss');
assert.equal(game.hitPlane(2,height).killed,false);
assert.equal(plane.hp,4);
assert.equal(game.hitPlane(-2,height).hit,false);
assert.equal(game.hitPlane(NaN,height).hit,false);
const victory=game.hitPlane(4,height);
assert.equal(victory.killed,true);
assert.equal(victory.points,850);
assert.equal(plane.active,false);
assert.ok(plane.crashTime>0);
assert.equal(game.airDrops.length,1,'Downed aircraft yields one airborne pickup');
assert.equal(game.hitPlane(10,height).hit,false,'Cannot kill the aircraft twice');
assert.equal(game.airDrops.length,1,'No duplicated loot');
assert.equal(aircraftHitbox(plane,height),null);
const previous=globalThis.document;
let generated=0;
globalThis.document={createElement(name){
 assert.equal(name,'canvas');generated++;
 return {width:0,height:0,getContext(){
  const noop=()=>{};
  return {fillRect:noop,beginPath:noop,moveTo:noop,lineTo:noop,closePath:noop,fill:noop,stroke:noop};
 }};
}};
try{
 let drawn=0;
 const c={save(){},restore(){},translate(){},rotate(){},drawImage(){drawn++}};
 assert.equal(drawAircraft(c,plane,height,2),true);
 assert.equal(drawAircraft(c,plane,height,3),true);
 assert.equal(generated,4,'Four fighter frames generated once, not on every tick');
 assert.equal(drawn,2);
}finally{
 if(previous===undefined)delete globalThis.document;else globalThis.document=previous;
}
plane.active=false;plane.crashTime=0;plane.timer=0;plane.dropTimer=0;
game.step(.016,0,200,height*.78,height,()=>{},()=>{});
assert.equal(plane.active,true,'Next flight resets the aircraft');
assert.equal(plane.hp,plane.maxHp);
game.reset();assert.equal(plane.hp,plane.maxHp);assert.equal(plane.crashTime,0);
const main=readFileSync('main.js','utf8'),world=readFileSync('arcade-mechanics.js','utf8');
for(const marker of ["import {aircraftHitbox}", "kind:'aircraft'", "arcade.hitPlane(b.damage,H)", 'score+=arcade.kill()+outcome.points'])
 assert.ok(main.includes(marker),'Missing live aircraft gameplay: '+marker);
for(const marker of ['drawAircraft(ctx,plane,H,phase)',"onExplosion(b.x,ground,H*.14,true)",'plane.crashAngle+=dt*4.6',"if(t<.95)"])
 assert.ok(world.includes(marker),'Missing aircraft scene polish: '+marker);
const apk=readFileSync('.github/workflows/build-apk.yml','utf8');
assert.ok(apk.includes('on:\n  workflow_dispatch:')&&!apk.includes('\n  push:'),'APK must stay manual only');
console.log('PASS: targetable original fighter, upward shooting, aerial loot, crash, warnings, cache and no auto APK');
