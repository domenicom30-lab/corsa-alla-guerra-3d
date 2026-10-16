import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rasterAssetCount,rasterAssetManifest} from '../sprite-loader.js';
const m=rasterAssetManifest;
assert.equal(Object.keys(m.enemies).length,20);
assert.equal(rasterAssetCount,62,'Must include original 39 + twelve enemy action atlases + airborne fire');
for(const kind of ['rifleman','assault','grenadier','heavy']){
 const name=kind+(kind==='grenadier'?'Throw':'Fire');
 assert.equal(m.enemies[name],4,name);
 assert.equal(m.enemies[kind+'Crouch'],4);
 assert.equal(m.enemies[kind+'Hurt'],4);
}
const main=readFileSync('main.js','utf8');
for(const marker of [
"e.fireFlash>0||e.windup>0",
"e.type==='grenadier'?'Throw':'Fire'",
"enemyPose==='Fire'||enemyPose==='Throw'",
"e.fireFlash>0||e.meleeFlash>0?3",
"drawRaster(ctx,'enemies',e.type+enemyPose,enemyFrame"
])assert.ok(main.includes(marker),marker);
const source=readFileSync('scripts/build_raster_art.py','utf8');
for(const marker of [
"def finish_enemy_attack(im,pose,n):",
"finish_enemy_attack(im,'Fire',n)",
"finish_enemy_attack(im,'Throw',n)",
"k[:-5] if k.endswith('Throw')"
])assert.ok(source.includes(marker),marker);
const apk=readFileSync('.github/workflows/build-apk.yml','utf8');
assert.ok(apk.includes("on:\n  workflow_dispatch:"));
assert.ok(!apk.includes("\n  push:"));
console.log('PASS: 16 attack frames and runtime windup/release integration; no automatic APK');
