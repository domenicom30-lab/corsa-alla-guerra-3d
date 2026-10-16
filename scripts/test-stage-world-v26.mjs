import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rasterAssetManifest as manifest} from '../sprite-loader.js';
import {stageAt} from '../stage-art.js';
const main=readFileSync('main.js','utf8');
const props=['forestPost','ruinHouse','factoryMachinery','fortressGate'];
assert.equal(Object.keys(manifest.props).length,6);
assert.deepEqual(Object.keys(manifest.props).slice(0,4),props);
assert.equal(manifest.hero.duckFire,4);
for(let i=0;i<4;i++){
  const name=props[i];
  assert.equal(stageAt(i===0?420:i===1?3300:i===2?6100:9100),i,
    'World map must reach each matching illustrated environment');
  assert.ok(main.includes("'"+name+"'"),'Stage prop must render: '+name);
}
assert.ok(main.includes("const zone=stageAt(world),name=props[zone]"),'Use stage-specific scenery by world position');
assert.ok(main.includes("drawRaster(ctx,'props',name,0"),'New structures use shipped PNG atlas');
assert.ok(main.includes("muzzleFlash>0||fireHeld?'duckFire':'duck'"),'Crouched shooting must animate');
assert.ok(main.includes("pose==='duckFire'?Math.floor(phase*.9)%4"),'Four crouched shooting frames');
assert.ok(main.includes("Math.min(W*.64,H*1.03)"),'Mission title is compact and does not obscure gameplay');
console.log('PASS: 4 distinct stage structures, 4 crouch-fire frames and compact mission UI on Android.');
