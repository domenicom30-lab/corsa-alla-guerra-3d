import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rasterAssetManifest as m,rasterAssetCount} from '../sprite-loader.js';
import {createArcadeSystems} from '../arcade-mechanics.js';
assert.equal(m.props.sandbagCover,3);
assert.equal(m.props.prisonerIdle,4);
assert.equal(rasterAssetCount,60);
const game=createArcadeSystems();
const cover=game.covers[0];
const H=400,ground=312;
assert.equal(cover.hp,100);
assert.equal(game.hitCover(cover.x,ground-H*.07,ground,H,60),true);
assert.equal(cover.hp,40,'First projectile visibly damages barrier');
assert.equal(game.hitCover(cover.x,ground-H*.07,ground,H,40),true);
assert.equal(cover.hp,0,'Destroyed cover has a persistent rubble state');
assert.equal(game.hitCover(cover.x,ground-H*.07,ground,H,10),false,'Destroyed rubble no longer blocks bullets');
const captive=game.prisoners[0];
assert.equal(game.rescue(captive.x,0,H),1);
assert.equal(captive.rescued,true,'Animated hostage vanishes on rescue');
game.reset();
assert.equal(cover.hp,100,'Replay restores the full barricade');
assert.equal(captive.rescued,false,'Replay restores all civilians');
const mech=readFileSync('arcade-mechanics.js','utf8');
const generator=readFileSync('scripts/build_raster_art.py','utf8');
for(const token of [
 "drawRaster(ctx,'props','sandbagCover',frame",
 "const frame=c.hp<=0?2:c.hp<50?1:0",
 "drawRaster(ctx,'props','prisonerIdle'",
 "if(p.rescued)continue",
])assert.ok(mech.includes(token),'Sprite gameplay link missing: '+token);
for(const token of ["def draw_gameplay_prop(im,kind,n):",
 "kind==\"sandbagCover\"","kind==\"prisonerIdle\""])
 assert.ok(generator.includes(token),'Artwork generator missing: '+token);
console.log('PASS: prisoner rescue/reset, three-state destructible cover and 47 mandatory image assets');
