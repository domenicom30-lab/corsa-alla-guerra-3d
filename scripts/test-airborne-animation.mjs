import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {airborneFrame,airbornePose,AIRBORNE_FRAMES} from '../arcade-air-animation.js';
import {rasterAssetManifest as manifest} from '../sprite-loader.js';

const H=400;
assert.equal(AIRBORNE_FRAMES,8);
assert.equal(manifest.hero.jump,8);
assert.equal(manifest.hero.jumpFire,8);
assert.equal(airbornePose(.01,false,0),'jump');
assert.equal(airbornePose(1,true,0),'jumpFire');
assert.equal(airbornePose(1,false,.01),'jumpFire');
assert.equal(airbornePose(0,true,.05),null);
assert.equal(airborneFrame(0,200,H),0);
assert.equal(airborneFrame(NaN,120,H),0);
assert.equal(airborneFrame(1,NaN,H),0);
assert.equal(airborneFrame(50,300,-1),0);
const up=[.02,.07,.13,.20,.23].map(t=>airborneFrame(H*t,310,H));
assert.deepEqual(up,[0,1,2,3,3],'Ascent moves from launch to full upward stretch');
const down=[.23,.19,.13,.07,.01].map(t=>airborneFrame(H*t,-340,H));
assert.deepEqual(down,[4,4,5,6,7],'Descent has a separate landing anticipation');
assert.ok(new Set([...up,...down]).size===8,'All eight jump keys are reachable');
for(const v of [0.00001,45,90,900]){
 for(const speed of [-400,-1,0,1,400]) {
  const frame=airborneFrame(v,speed,H);
  assert.ok(Number.isInteger(frame)&&frame>=0&&frame<8);
 }
}
const runtime=readFileSync('main.js','utf8');
for(const needle of ["import {airborneFrame} from './arcade-air-animation.js'",
 "jumpY>0?(muzzleFlash>0||fireHeld?'jumpFire':'jump')",
 "pose==='jump'||pose==='jumpFire'?airborneFrame(jumpY,vy,H)",
 "drawRaster(ctx,'hero',pose,frame"]){
 assert.ok(runtime.includes(needle),'Game does not use authored physical animation: '+needle);
}
const generator=readFileSync('scripts/build_raster_art.py','utf8');
for(const needle of ["from airborne_art import draw_airborne_finishing",
 "draw_airborne_finishing(im,hero_pose,n)",
 '("fire","runFire","duckFire","jumpFire")']){
 assert.ok(generator.includes(needle),'Offline source does not build aerial firing atlas: '+needle);
}
console.log('PASS: eight distinct physical jump keys, real airborne shooting pose and runtime atlas wiring');
