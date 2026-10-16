import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rasterAssetManifest as m,rasterAssetCount} from '../sprite-loader.js';
const source=readFileSync('main.js','utf8');
const painter=readFileSync('scripts/build_raster_art.py','utf8');
const workflow=readFileSync('.github/workflows/build-apk.yml','utf8');
assert.equal(m.hero.slide,6);
assert.equal(m.hero.melee,5);
assert.equal(m.hero.land,4);
assert.equal(rasterAssetCount,51,'Mandatory animated hero, troop, vehicles and gameplay scenery atlases');
for(const part of [
"combatMoves.slashActive?'melee'",
"combatMoves.sliding?'slide'",
"landTime>0?'land'",
"pose==='slide'?actionFrame(combatMoves.slideFraction,6)",
"pose==='melee'?actionFrame(combatMoves.slashFraction,5)",
"pose==='land'?Math.min(3",
"drawRaster(ctx,'hero',pose,frame",
"landTime=.22",
"landTime=0;gameMenu.playMode()",
])assert.ok(source.includes(part),part);
for(const token of ['def draw_slide_pose(im,n):','def draw_melee_bayonet(im,n):','def draw_land_pose(im,n):','Image.Resampling.NEAREST'])
  assert.ok(painter.includes(token),token);
assert.ok(workflow.includes("on:\n  workflow_dispatch:"));
assert.ok(!workflow.includes("\n  push:"),'APK remains manual release-only');
assert.ok(!workflow.includes("\n  pull_request:"),'APK remains manual release-only');
console.log('PASS: 15 new authored action frames wired to physics; Android APK build still manual only.');
