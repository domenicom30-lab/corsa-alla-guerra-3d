import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTroopWaves,advanceTroopWaves,damageTroop,resetTroopWaves} from '../enemy-director.js';
const H=400,shots=[];
const make=()=>createTroopWaves().find(e=>e.type==='assault');
const e=make(),near=e.x+H*.09;
let events=advanceTroopWaves([e],.05,0,near,200,H,shots);
assert.ok(events.some(x=>x.type==='meleeWarning'),'Close assault must announce a strike');
assert.ok(!events.some(x=>x.type==='contact'),'No untelegraphed instant damage');
assert.ok(e.meleeWindup>0,'Windup timer is active');
events=advanceTroopWaves([e],.16,0,near,200,H,shots);
assert.ok(!events.some(x=>x.type==='contact'),'Cannot attack until windup finishes');
events=advanceTroopWaves([e],.09,0,near,200,H,shots);
assert.equal(events.filter(x=>x.type==='contact').length,1,'One strike occurs after telegraph');
assert.ok(e.meleeFlash>0&&e.meleeCooldown>1,'Attack animation and recovery start together');
let contacts=0;
for(let k=0;k<9;k++){
 const hits=advanceTroopWaves([e],.07,0,near,200,H,shots);
 contacts+=hits.filter(x=>x.type==='contact').length;
}
assert.equal(contacts,0,'Contact cannot inflict damage every animation frame');

const escape=make(),escapeNear=escape.x+H*.09;
advanceTroopWaves([escape],.06,0,escapeNear,200,H,[]);
events=advanceTroopWaves([escape],.3,0,escapeNear+H*1.2,200,H,[]);
assert.ok(!events.some(x=>x.type==='contact'),'Retreating outside melee range avoids attack');
assert.ok(escape.meleeCooldown>0,'Missed attack still has recovery cost');

const wounded=make(),within=wounded.x+H*.09;
advanceTroopWaves([wounded],.05,0,within,200,H,[]);
assert.ok(wounded.meleeWindup>0);
damageTroop(wounded,1);
assert.equal(wounded.meleeWindup,0,'Hitting attacker cancels windup');
assert.ok(wounded.meleeCooldown>=.48);
resetTroopWaves([wounded]);
assert.equal(wounded.meleeWindup,0);
assert.equal(wounded.meleeCooldown,0);
assert.equal(wounded.meleeFlash,0);

const main=readFileSync('main.js','utf8');
for(const code of ["if(e.meleeWindup>0)","readiness=1-e.meleeWindup/.28",
 "e.meleeFlash>0","!combatMoves.sliding)damage()"])
 assert.ok(main.includes(code),code);
const apk=readFileSync('.github/workflows/build-apk.yml','utf8');
assert.ok(apk.includes('on:\n  workflow_dispatch:'));
assert.ok(!apk.includes('\n  push:'));
console.log('PASS: telegraphed single-hit assault melee, dodge/escape, hit interrupt, cooldown/reset, manual-only APK');
