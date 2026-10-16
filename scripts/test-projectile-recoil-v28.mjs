import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createArcadeSystems} from '../arcade-mechanics.js';
const H=400,ground=H*.78,playerX=200;
let shots=createArcadeSystems(),hits=0;
shots.enemyShots.push({x:90,y:ground-H*.18,vx:2300,vy:0,kind:'tracer',life:1});
shots.step(.10,0,playerX,ground,H,()=>hits++,()=>{},0,{jumpY:0,crouching:false});
assert.equal(hits,1,'Fast enemy shot must hit player despite skipping over player coordinates');
assert.equal(shots.enemyShots.length,0,'A projectile must disappear after hitting its target');

shots=createArcadeSystems();hits=0;
shots.enemyShots.push({x:90,y:ground-H*.18,vx:2300,vy:0,kind:'tracer',life:1});
shots.step(.10,0,playerX,ground,H,()=>hits++,()=>{},0,{jumpY:0,crouching:true});
assert.equal(hits,0,'Sliding / crouched player should duck below the same swept bullet');

shots=createArcadeSystems();hits=0;
shots.enemyShots.push({x:90,y:ground-H*.18,vx:2300,vy:0,kind:'tracer',life:1});
shots.step(.10,0,playerX,ground,H,()=>hits++,()=>{},0,{jumpY:H*.30,crouching:false});
assert.equal(hits,0,'Jumping player must avoid chest-height shot even at slow FPS');

shots=createArcadeSystems();hits=0;
const scroll=shots.covers[0].x-200;
shots.enemyShots.push({x:130,y:ground-H*.10,vx:2400,vy:0,kind:'tracer',life:1});
shots.step(.10,scroll,300,ground,H,()=>hits++,()=>{},0,{jumpY:0,crouching:false});
assert.equal(hits,0,'Cover should intercept enemy fire before it reaches player');
assert.ok(shots.covers[0].hp<100,'Cover must actually absorb damage');
assert.equal(shots.enemyShots.length,0,'Bullet cannot pass through cover');

// Incoming fire must reach whichever collision rectangle lies closer, not the first one in the cover list.
const ordered=createArcadeSystems(),orderedScroll=ordered.covers[0].x-200;
let orderedHurt=0;
ordered.enemyShots.push({x:125,y:ground-H*.10,vx:2500,vy:0,kind:'tracer',life:1});
ordered.step(.1,orderedScroll,170,ground,H,()=>orderedHurt++,()=>{},0,{jumpY:0,crouching:false});
assert.equal(orderedHurt,1,'Unprotected player before barricade must be hit');
assert.equal(ordered.covers[0].hp,100,'Bullet cannot damage cover after hitting player');

const camera=createArcadeSystems(),cameraScroll=camera.covers[0].x-200;
let cameraHurt=0;
camera.enemyShots.push({x:140,y:ground-H*.10,vx:1800,vy:0,kind:'tracer',life:1});
camera.step(.10,cameraScroll,340,ground,H,()=>cameraHurt++,()=>{},20,{jumpY:0,crouching:false});
assert.equal(cameraHurt,0,'Camera scrolling should not move a bullet past intact cover');
assert.ok(camera.covers[0].hp<100,'Scrolling contact damages the nearest cover');

const main=readFileSync('main.js','utf8');
for(const part of [
'ride.fireAnimation=.24',
'ride.fireAnimation=Math.max(0,ride.fireAnimation-dt)',
'ride.fireAnimation>.10?5:4',
'fireAnimation:0',
"drawRaster(ctx,'vehicles','slug'",
])assert.ok(main.includes(part),part);
const mech=readFileSync('arcade-mechanics.js','utf8');
assert.ok(mech.includes('nearestRectHit(previousX-cameraDelta,previousY,b.x,b.y,objects)'));
assert.ok(mech.includes("objects.push({kind:'player'"));
console.log('PASS: slow-frame swept enemy bullets, duck/jump evasion, blocking cover, cannon recoil animation and reset');
