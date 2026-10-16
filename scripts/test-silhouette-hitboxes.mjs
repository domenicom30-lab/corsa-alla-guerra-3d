import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {heroDimensions,troopDimensions,activeBodyRatio} from '../arcade-proportions.js';
import {firstRectHit} from '../collision-order.js';
const H=440,ground=H*.78,visibleFraction=activeBodyRatio();
const visible=(dims)=>dims.h*visibleFraction/H;
const standing=heroDimensions(H),duck=heroDimensions(H,true);
const rifle=troopDimensions(H,'rifleman'),heavy=troopDimensions(H,'heavy');
assert.ok(visible(standing)>.15&&visible(standing)<.175,'Compact protagonist, not oversized');
assert.ok(visible(rifle)>.15&&visible(rifle)<.17,'Infantry proportions track player');
assert.ok(visible(heavy)>.18&&visible(heavy)<.20,'Heavy infantry remains noticeably larger');
assert.ok(visible(duck)<visible(standing)*.80,'Crouched stance is genuinely low');
const body=(center,radius)=>({x:150,y:ground-H*center,w:H*.07,h:H*radius});
const tall=body(.092,.082),low=body(.060,.055);
assert.ok(Math.abs((.092+.082)-visible(standing))<.015,'Standing hurt area follows visible helmet');
assert.ok(Math.abs((.060+.055)-visible(duck))<.015,'Crouched hurt area follows visible helmet');
const fireAt=(y,box)=>firstRectHit(20,y,300,y,box);
assert.notEqual(fireAt(ground-H*.145,tall),null,'Chest-high bullet damages standing player');
assert.equal(fireAt(ground-H*.145,low),null,'Chest-high bullet clears ducking player');
assert.equal(fireAt(ground-H*.21,tall),null,'Shots above helmet do not cause phantom damage');
const rifleBox=body(.082,.082);
const heavyBox=body(.094,.093);
assert.ok(Math.abs((.082+.082)-visible(rifle))<.015);
assert.ok(Math.abs((.094+.093)-visible(heavy))<.015);
assert.notEqual(fireAt(ground-H*.145,rifleBox),null);
assert.notEqual(fireAt(ground-H*.18,heavyBox),null);
const runtime=readFileSync('main.js','utf8'),mechanics=readFileSync('arcade-mechanics.js','utf8');
for(const token of ["e.type==='heavy'?.094:.082","e.type==='heavy'?.093:.082",
 "const playerCenterY=ground-H*(crouching?.060:.092)-jumping;",
 "const verticalRadius=H*(crouching?.055:.082);"]){
 assert.ok((runtime+'\n'+mechanics).includes(token),'Collision bounds not deployed: '+token);
}
console.log('PASS: soldier silhouette heights, kneeling dodge, body-aligned projectile collision and heavy troop size');
