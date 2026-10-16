import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createExplosiveProps} from '../explosive-props.js';
import {firstRectHit} from '../collision-order.js';

const H=400,ground=H*.78;
const world=createExplosiveProps();
assert.equal(world.props.length,12,'Fixed number of authored interactable props');
assert.ok(world.props.every(p=>p.hp===3&&!p.detonated&&!p.primed));
const [first,second]=world.props;
const targets=world.targets(0,ground,H);
assert.equal(targets.length,12);
assert.equal(targets[0].kind,'barrel');
assert.equal(targets[0].ref,first);
const hitbox=targets[0];
assert.notEqual(firstRectHit(100,hitbox.y,2000,hitbox.y,hitbox),null,
 'Player projectile sweep must hit barrel instead of tunnelling');
assert.equal(firstRectHit(100,ground-H*.3,2000,ground-H*.3,hitbox),null,
 'Shots above the barrel do not collide');
assert.equal(world.hit(first,1).hit,true);
assert.equal(first.hp,2);
assert.equal(world.hit(first,1).primed,false);
assert.equal(first.hp,1);
assert.equal(world.hit(first,1).primed,true);
assert.equal(first.hp,0);
assert.equal(first.primed,true);
assert.equal(world.hit(first,1).hit,false,'Primed drum cannot be shot again for extra points');
assert.equal(world.targets(0,ground,H).length,11,
 'Primed drum is not an infinite projectile blocker');

let detonations=[];
world.step(.04,e=>detonations.push(e));
assert.equal(detonations.length,0,'Hit gives time for ignition animation');
world.step(.07,e=>{detonations.push(e);world.igniteNear(e.x,H*.36)});
assert.equal(detonations.length,1);
assert.equal(detonations[0].points,180);
assert.equal(first.detonated,true);
assert.equal(second.primed,true,'Blast radius ignites adjacent drum');
assert.equal(world.hit(first,6).hit,false,'Explosion cannot award points twice');
assert.equal(world.igniteNear(first.x,H*.36),0,'Ignition cannot duplicate primed drums');
world.step(.14,e=>detonations.push(e));
assert.equal(detonations.length,2,'Chain fires on next tick, not recursively in the same tick');
world.step(3,e=>detonations.push(e));
assert.equal(detonations.length,2);
assert.equal(world.targets(0,ground,H).length,10);

world.reset();
assert.equal(world.targets(0,ground,H).length,12);
assert.equal(world.igniteNear(NaN,H*.4),0);
assert.equal(world.igniteNear(first.x,-1),0);
assert.equal(world.igniteNear(first.x,H*.025),1);
assert.equal(world.igniteNear(first.x,H*.025),0);

world.reset();
const rammed=world.ram(1100,1260,220,H);
assert.ok(rammed.some(p=>p.id===0),'Tank nose must ram a drum in world space');
assert.equal(first.primed,true);
assert.equal(world.ram(1100,1260,220,H).length,0,
 'Already primed drum does not take another ram');
world.reset();
assert.equal(world.ram(1200,1260,20,H).length,0,'Very slow movement cannot ignite a drum');
assert.equal(world.ram(Infinity,1260,300,H).length,0);
world.reset();
const reverse=world.ram(1550,1230,-300,H);
assert.ok(reverse.length>=1,'Reverse tank motion also breaks explosive scenery');

world.reset();
let created=0,drawn=0;
const previous=globalThis.document;
const noop=()=>{};
globalThis.document={createElement(name){
 assert.equal(name,'canvas');created++;
 return {width:0,height:0,getContext(){return {
  imageSmoothingEnabled:false,fillRect:noop,beginPath:noop,moveTo:noop,
  lineTo:noop,closePath:noop,fill:noop,stroke:noop
 }}};
}};
try{
 const screen={canvas:{width:1600},save:noop,restore:noop,drawImage(){drawn++}};
 world.draw(screen,0,ground,H,0);
 world.draw(screen,0,ground,H,1);
 assert.equal(created,4,'Pre-render exactly four original artwork frames once');
 assert.ok(drawn>0);
 assert.equal(created,4,'Repeated frames do not repaint drum art');
}finally{
 if(previous===undefined)delete globalThis.document;else globalThis.document=previous;
}

const main=readFileSync('main.js','utf8');
for(const snippet of [
 "import {createExplosiveProps} from './explosive-props.js'",
 "const explosiveProps=createExplosiveProps()",
 "explosiveProps.igniteNear(scroll+x,radius)",
 "explosiveProps.targets(scroll,ground(),H)",
 "explosiveProps.hit(target,b.damage)",
 "explosiveProps.ram(previousScroll+playerX()",
 "explosiveProps.step(dt,event=>",
 "explosiveProps.draw(ctx,scroll,ground(),H,phase)",
 "explosiveProps.reset()"
])assert.ok(main.includes(snippet),'Missing active game integration: '+snippet);
const workflow=readFileSync('.github/workflows/build-apk.yml','utf8');
assert.ok(workflow.includes('on:\n  workflow_dispatch:')&&!workflow.includes('\n  push:'),
 'Never produce Android APK for every source change');
console.log('PASS: authored explosive barrels, swept shooting and tank contact, safe chain reactions, danger art cache and restart');
