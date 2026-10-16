import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rasterAssetManifest as m,rasterAssetCount} from '../sprite-loader.js';
const source=readFileSync('main.js','utf8');
const painter=readFileSync('scripts/build_raster_art.py','utf8');
const workflow=readFileSync('.github/workflows/build-apk.yml','utf8');
assert.equal(m.hero.slide,6);
assert.equal(m.hero.melee,5);
assert.equal(m.hero.land,4);
assert.equal(rasterAssetCount,36,'Three new hero atlases must be mandatory');
for(const part of [
"combatMoves.sliding?'slide':combatMoves.slashActive?'melee':landingTime>0?'land'",
"pose==='slide'?Math.min(5",
"pose==='melee'?Math.min(4",
"pose==='land'?Math.min(3",
"drawRaster(ctx,'hero',pose,frame",
"landingTime=.18",
"landingTime=0;fireHeld=false",
"if(dustPuffs.length>35)",
])assert.ok(source.includes(part),part);
for(const token of ['def finish_special_hero(im,pose,n):','Image.Resampling.NEAREST','if pose=="melee":','if pose=="land":'])
  assert.ok(painter.includes(token),token);
assert.ok(workflow.includes("on:\n  workflow_dispatch:"));
assert.ok(!workflow.includes("\n  push:"),'APK remains manual release-only');
assert.ok(!workflow.includes("\n  pull_request:"),'APK remains manual release-only');
console.log('PASS: 15 new authored action frames wired to physics; Android APK build still manual only.');
