import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rasterAssetManifest as manifest,rasterAssetCount} from '../sprite-loader.js';
const kinds=['rifleman','assault','grenadier','heavy'];
assert.equal(rasterAssetCount,52,'39 original atlases plus 12 enemy action variants and one airborne-firing atlas');
for(const kind of kinds){
  assert.equal(manifest.enemies[kind],8);
  assert.equal(manifest.enemies[kind+'Crouch'],4);
  assert.equal(manifest.enemies[kind+'Hurt'],4);
  assert.equal(manifest.enemies[kind+(kind==='grenadier'?'Throw':'Fire')],4);
}
const main=readFileSync('main.js','utf8');
const generator=readFileSync('scripts/build_raster_art.py','utf8');
for(const token of [
"const enemyPose=e.flinch>0?'Hurt'",
"e.stance==='crouch'||e.suppressed>0||e.dodgeTime>0",
"enemyPose==='Hurt'",
"enemyPose==='Crouch'",
"drawRaster(ctx,'enemies',e.type+enemyPose,enemyFrame",
"enemyPose==='Fire'||enemyPose==='Throw'",
])assert.ok(main.includes(token),'Renderer state is missing: '+token);
for(const token of [
'def finish_enemy_pose(im,pose,n):',
"finish_enemy_pose(im,'Crouch',n)",
"finish_enemy_pose(im,'Hurt',n)",
"k[:-6] if k.endswith('Crouch')"
])assert.ok(generator.includes(token),'Art pipeline missing: '+token);
const workflow=readFileSync('.github/workflows/build-apk.yml','utf8');
assert.ok(workflow.includes('on:\n  workflow_dispatch:'),'APK remains manual only');
assert.ok(!workflow.includes('\n  push:'));
console.log('PASS: 8 dedicated enemy PNG sheets, damage reactions, crouching, suppression and manual APK policy.');
