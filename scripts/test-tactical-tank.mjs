import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTroopWaves,advanceTroopWaves,resetTroopWaves,damageTroop,suppressTroop} from '../enemy-director.js';
import {rasterAssetManifest as manifest} from '../sprite-loader.js';

assert.deepEqual(manifest.vehicles,{slug:6},'Six original vehicle frames in the manifest');
assert.deepEqual(manifest.frameSizes.vehicles,[400,250]);
const troops=createTroopWaves();
const rifle=troops.find(t=>t.type==='rifleman');
const assault=troops.find(t=>t.type==='assault');
const heavy=troops.find(t=>t.type==='heavy');
const H=400,ground=H*.78;
assert.equal(suppressTroop(heavy,ground-H*.17,ground,H),false,'Armored heavy stays aggressive');
assert.equal(suppressTroop(rifle,ground-H*.43,ground,H),false,'Bullet that goes over a helmet does not suppress');
assert.equal(suppressTroop(rifle,ground-H*.12,ground,H,1),true,'Close shot suppresses rifleman');
assert.equal(rifle.stance,'crouch');assert.ok(rifle.suppressed>0);
assert.equal(suppressTroop(rifle,ground-H*.12,ground,H,1),false,'Cooldown prevents repeated near-miss stunlock');
rifle.cooldown=0;
const originalX=rifle.x;
let shots=[],events=advanceTroopWaves([rifle],.2,0,rifle.x-H,200,H,shots);
assert.equal(shots.length,0,'Suppressed rifleman must not fire');
assert.equal(rifle.x,originalX,'Rifleman stays in cover while suppressed');
assert.equal(rifle.windup,0,'Suppression interrupts shot charge');
assert.equal(suppressTroop(assault,ground-H*.12,ground,H,1),true);
assert.ok(assault.dodgeTime>0,'Assault evasive reposition triggered by near-miss');
const before=assault.x;
advanceTroopWaves([assault],.15,0,assault.x-H,200,H,[]);
assert.ok(assault.x<before,'Assault ducks and retreats away from incoming fire');
assert.equal(assault.stance,'crouch');
assert.ok(suppressTroop(assault,ground-H*.16,ground,H)===false);
advanceTroopWaves([rifle],.6,0,rifle.x-H,200,H,[]);
assert.ok(rifle.suppressionCooldown>0,'Rifle suppression eventually clears but cooldown remains');
resetTroopWaves(troops);
assert.ok(troops.every(e=>e.suppressed===0&&e.suppressionCooldown===0),'Reset clears suppression');
damageTroop(heavy,1);assert.equal(suppressTroop(heavy,ground-H*.15,ground,H),false);
const main=readFileSync('main.js','utf8');
for(const token of [
 "drawRaster(ctx,'vehicles','slug'",
 "if(spritePacksReady()){",
 "const h=H*.29,w=h*400/250",
 "import {createTroopWaves,resetTroopWaves,advanceTroopWaves,damageTroop,suppressTroop}",
 "if(!hit&&!rocket)",
 "suppressTroop(e,(oldY+b.y)*.5,ground(),H,Math.sign(b.vx)||1)"
]) assert.ok(main.includes(token),'Runtime render/AI integration: '+token);
assert.ok(!main.includes("if(!hit&&!rocket){\n   for(const e of sentries){if(!e.alive)"),'No accidental duplicate loop');
console.log('PASS: drivable original tank atlas + suppression near misses, movement, cooldown, reset and enemy response');
