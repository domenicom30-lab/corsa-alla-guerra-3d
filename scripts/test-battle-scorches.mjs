import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBattleScorches} from '../battle-scorches.js';
const H=480,ground=H*.78;
const s=createBattleScorches(5);
assert.equal(s.mark(1200,ground-H*.12,ground,H,1),true);
assert.equal(s.mark(1204,ground-H*.12,ground,H,1),false,'Nearby repeated explosions consolidate');
assert.equal(s.mark(1200,ground-H*.5,ground,H,1),false,'Air explosion does not burn the sky');
assert.equal(s.stats().marks,1);
s.step(.6);assert.equal(s.snapshot()[0].age,.6);
s.step(NaN);assert.equal(s.snapshot()[0].age,.6);
for(let i=0;i<20;i++)s.mark(i*310+2000,ground-H*.15,ground,H,1);
assert.equal(s.stats().marks,5,'Mobile GPU pool is always bounded');
assert.ok(s.snapshot().every(x=>x.ttl>=12));
let made=0,saved=0,restored=0,painted=0;
const old=globalThis.document;
const noop=()=>{};
globalThis.document={createElement(tag){
 assert.equal(tag,'canvas');made++;
 return {width:0,height:0,getContext(){return {fillRect:noop}}};
}};
try{
 const ctx={canvas:{width:1400},save(){saved++},restore(){restored++},
  drawImage(){painted++},fillRect(){painted++}};
 s.draw(ctx,6400,1400,H);
 s.draw(ctx,6400,1400,H);
 assert.equal(made,4,'Four original scorch sprites are rasterized once');
 assert.ok(painted>0,'Visible world-space scorch is drawn');
 assert.equal(saved,restored,'Canvas stack is balanced');
}finally{
 if(old===undefined)delete globalThis.document;else globalThis.document=old;
}
s.step(20);
assert.equal(s.stats().marks,0,'Scorches fade and expire');
s.mark(3000,ground,ground,H);
s.reset();
assert.equal(s.stats().marks,0,'Restart clears all damage decals');
const main=readFileSync('main.js','utf8');
for(const token of [
 "import {createBattleScorches} from './battle-scorches.js'",
 'const scorches=createBattleScorches()',
 'scorches.mark(scroll+x,y,ground(),H,1.1)',
 'scorches.step(dt)',
 'scorches.draw(ctx,scroll,W,H)',
 'scorches.reset()'
])assert.ok(main.includes(token),'Active visual integration missing: '+token);
console.log('PASS: bounded persistent battlefield scorch art, no aerial decals, world scroll, cache, expiring effects and reset');
