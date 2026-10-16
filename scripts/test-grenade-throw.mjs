import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rasterAssetManifest as m,rasterAssetCount} from '../sprite-loader.js';
assert.equal(m.hero.throw,6);
assert.equal(rasterAssetCount,63);
const main=readFileSync('main.js','utf8');
for(const token of [
 "grenadeTime>0&&!ride.occupied?'throw'",
 "pose==='throw'?Math.min(5",
 "grenadeTime=Math.max(0,grenadeTime-dt)",
 "grenadeTime=.36;shotCooldown=Math.max(shotCooldown,.09)",
 "landTime=0;grenadeTime=0;gameMenu.playMode()",
 "drawRaster(ctx,'hero',pose,frame"
])assert.ok(main.includes(token),'Grenade pose is not integrated into the live mission: '+token);
const build=readFileSync('scripts/build_raster_art.py','utf8');
assert.ok(build.includes("from grenade_throw_art import draw_grenade_throw"));
assert.ok(build.includes("if hero_pose=='throw':draw_grenade_throw(im,n)"));
assert.ok(!readFileSync('.github/workflows/build-apk.yml','utf8').includes('\n  push:'));
console.log('PASS: six authored grenade-throw frames, movement-linked arm release, HUD-safe mode and main animation reset');
