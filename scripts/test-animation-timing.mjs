import assert from 'node:assert/strict';
import {actionFrame,createArcadeCombatMoves} from '../arcade-combat-moves.js';
import {readFileSync} from 'node:fs';
for(const [remaining,frames,want] of [
 [1,6,0],[.99,6,0],[.75,6,1],[.5,6,3],[.25,6,4],[0,6,5],
 [1,5,0],[.5,5,2],[.2,5,4],[0,5,4],
 [2,6,0],[-2,6,5],[NaN,6,0],[1,0,0]
])assert.equal(actionFrame(remaining,frames),want,String([remaining,frames]));
const m=createArcadeCombatMoves();
assert.equal(m.startSlide(1),true);
assert.equal(actionFrame(m.slideFraction,6),0,'First slide image must always be the entry pose');
m.step(.10);
assert.equal(actionFrame(m.slideFraction,6),1);
m.step(.20);
assert.equal(actionFrame(m.slideFraction,6),4);
m.step(.10);
assert.equal(m.sliding,false);
assert.equal(m.slash(),true);
assert.equal(actionFrame(m.slashFraction,5),0,'Every melee strike starts on the first authored frame');
m.step(.08);
assert.equal(actionFrame(m.slashFraction,5),1);
m.step(.1);
assert.equal(actionFrame(m.slashFraction,5),3);
m.reset();assert.equal(m.slashActive,false);
assert.equal(m.startSlide(-1),true);
assert.equal(actionFrame(m.slideFraction,6),0,'Restarted slide must not depend on global phase');
const main=readFileSync('main.js','utf8');
assert.ok(main.includes("pose==='slide'?actionFrame(combatMoves.slideFraction,6)"));
assert.ok(main.includes("pose==='melee'?actionFrame(combatMoves.slashFraction,5)"));
assert.ok(!main.includes("pose==='slide'?Math.floor(phase*.9)%6"),'Old phase-driven slide starts at arbitrary frames');
console.log('PASS: slide and knife frames follow action progress independently from world animation time');
