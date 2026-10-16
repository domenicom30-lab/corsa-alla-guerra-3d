import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {heroDimensions,troopDimensions,vehicleDimensions,activeBodyRatio} from '../arcade-proportions.js';
const H=900;
const hero=heroDimensions(H),duck=heroDimensions(H,true);
const rifle=troopDimensions(H,'rifleman'),grenadier=troopDimensions(H,'grenadier'),
 heavy=troopDimensions(H,'heavy'),tank=vehicleDimensions(H),boss=vehicleDimensions(H,true);
const visibleFraction=activeBodyRatio(210,35,194);
assert.ok(visibleFraction>.72&&visibleFraction<.8,'Drawn humanoids fill the atlas; prevent extra blank padding');
assert.ok(hero.h*visibleFraction/H>.185&&hero.h*visibleFraction/H<.205,'Hero must fill about 19 percent of the viewport');
assert.ok(rifle.h*visibleFraction/H>.17&&rifle.h*visibleFraction/H<.19,'Standard troop occupies 17-19 percent of view');
assert.ok(Math.abs(hero.h-rifle.h)/hero.h<.13,'Consistent soldier/enemy silhouettes');
assert.ok(heavy.h>hero.h&&heavy.h<hero.h*1.18,'Heavy troop is slightly taller, not oversized');
assert.ok(grenadier.h>rifle.h);
assert.ok(duck.h<hero.h*.79&&duck.h>hero.h*.70,'Compact crouch is still legible');
assert.ok(tank.h*34/19/H>.24&&tank.h*34/19/H<.28,'Drivable tank actual silhouette fills about a quarter of view');
assert.ok(boss.h>hero.h&&boss.h<hero.h*1.65,'Boss tank notably larger, without dominating entire screen');
for(const item of [hero,duck,rifle,grenadier,heavy,tank,boss]){
 assert.ok(Number.isFinite(item.w)&&Number.isFinite(item.h)&&item.w>0&&item.h>0);
}
const main=readFileSync('main.js','utf8'),mechanics=readFileSync('arcade-mechanics.js','utf8'),
 art=readFileSync('scripts/build_raster_art.py','utf8');
for(const token of [
 'heroDimensions(H,isCrouching())',
 "troopDimensions(H,e.type,e.stance==='crouch')",
 "const facingPlayer=e.x>scroll+playerX()?-1:1",
 'if(facingPlayer<0)ctx.scale(-1,1)',
 'if(e.windup>0)',
 'if(e.fireFlash>0)',
 'drawRaster(ctx,\'fx\',\'muzzle\'',
 "const u=vehicleDimensions(H).h/19"
])assert.ok(main.includes(token),'Scaled arcade presentation missing: '+token);
assert.ok(mechanics.includes('vehicleDimensions(H,true)'), 'Boss tank needs coordinated scaling');
assert.ok(art.includes('finish_enemy_art(im,'),'Detailed enemy equipment and silhouette');
assert.ok(art.includes('finish_boss_art(im,'),'Detailed tank surface shading');
console.log('PASS: true compact Metal Slug-inspired 2D hero/enemy/tank proportions, enemy facing, warning telegraphs, damage flashes, original detailed sprites.');
