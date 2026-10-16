import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rasterAssetManifest as m,rasterAssetCount} from '../sprite-loader.js';
import {enemyFallFrame} from '../enemy-fall-frames.js';
const kinds=['rifleman','assault','grenadier','heavy'];
assert.equal(rasterAssetCount,63);
for(const type of kinds){
 assert.equal(m.enemies[type+'Fall'],6,type+' needs a distinct six-frame fall atlas');
}
const falling=[0,.11,.22,.33,.44].map(age=>enemyFallFrame({age,impact:false}));
assert.deepEqual(falling,[0,1,2,3,4]);
assert.equal(enemyFallFrame({age:0,impact:true}),5,'Ground impact shows flattened pose');
assert.equal(enemyFallFrame({age:25,impact:false}),4,'Late aerial pose clamps safely');
assert.equal(enemyFallFrame({age:-.2,impact:false}),0);
assert.equal(enemyFallFrame({age:NaN,impact:false}),0);
assert.equal(enemyFallFrame(null),0);
const troop=readFileSync('troop-art.js','utf8');
assert.ok(troop.includes("drawRaster(ctx,'enemies',fall.type+'Fall',enemyFallFrame(fall)"),
 'Active gameplay uses the dedicated PNG death atlas');
assert.ok(!troop.includes("drawRaster(ctx,'enemies',fall.type,0,-w*.5"),
 'Unchanged standing sprites must not serve as the default defeat sequence');
const generator=readFileSync('scripts/build_raster_art.py','utf8');
assert.ok(generator.includes("from enemy_falling_art import draw_falling_pose"));
assert.ok(generator.includes("if kind.endswith('Fall')"));
assert.ok(generator.includes("draw_falling_pose(im,n)"));
console.log('PASS: four authored six-key enemy death atlases wired into actual fall physics');
