import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {firstRectHit,nearestRectHit} from '../collision-order.js';
const at=(kind,x,y=0,w=4,h=4)=>({kind,x,y,w,h});
assert.equal(firstRectHit(0,0,100,0,at('a',60)),.56);
assert.equal(firstRectHit(100,0,0,0,at('a',60)),.36);
assert.equal(firstRectHit(0,0,100,0,at('a',60,20)),null);
assert.equal(firstRectHit(0,0,100,0,at('a',60,0,-1)),null);
assert.equal(firstRectHit(0,0,100,0,at('a',60,0,4,Infinity)),null);
assert.equal(firstRectHit(0,0,0,0,at('a',0)),0);
assert.equal(firstRectHit(0,0,0,0,at('a',40)),null);
assert.equal(firstRectHit(0,0,100,100,at('a',50,50,2,5)),.48);
const enemy=at('enemy',40),cover=at('cover',85);
const order=nearestRectHit(0,0,100,0,[cover,enemy]);
assert.equal(order.item.kind,'enemy','Closer enemy must win over a farther cover');
assert.equal(order.x,36,'Exact collision point must be the first edge of the target');
const reverse=nearestRectHit(100,0,0,0,[enemy,cover]);
assert.equal(reverse.item.kind,'cover','Reverse direction must reverse collision order');
assert.equal(reverse.x,89);
assert.equal(nearestRectHit(0,0,100,0,[at('sky',50,100)]),null);
const oldScreen=90,deltaCamera=22,worldTargets=[at('hero',100-deltaCamera)];
const shifted=nearestRectHit(oldScreen-deltaCamera,0,oldScreen+30-deltaCamera,0,worldTargets);
assert.equal(shifted.x,74,'Moving camera must not shift the recorded collision edge');
const tie=nearestRectHit(0,0,100,0,[at('cover',50),at('enemy',50)]);
assert.equal(tie.item.kind,'cover','Equal distance: opaque cover before the character');
const source=readFileSync('main.js','utf8');
for(const expected of [
"nearestRectHit(oldX-cameraDelta,oldY,b.x,b.y,targets)",
"b.x=contact.x;b.y=contact.y",
"if(hit&&rocket){",
"explosion(b.x,b.y,H*.36)",
"arcade.step(dt,scroll,playerX(),ground(),H,()=>damage(),explosion",
"if(!hit&&!rocket)",
])assert.ok(source.includes(expected),'Required integration missing: '+expected);
assert.ok(!source.includes('ride.hp=Math.max(0,ride.hp-15)'),
 'Vehicle shots must not bypass the common invulnerability gate');
assert.ok(!source.includes('const impactX=oldX+(b.x-oldX)*.5'),
 'Do not detonate halfway along the path');
const workflow=readFileSync('.github/workflows/build-apk.yml','utf8');
assert.ok(workflow.includes('on:\n  workflow_dispatch:'),'No automatic APK before an actual release');
console.log('PASS: geometric first-hit ordering, exact rocket blast points, camera motion and shared vehicle damage protection');
