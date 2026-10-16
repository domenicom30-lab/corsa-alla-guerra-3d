import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createArcadeCombatMoves,enemyCombatPose} from '../arcade-combat-moves.js';
import {createTroopWaves,damageTroop,advanceTroopWaves,resetTroopWaves} from '../enemy-director.js';
const m=createArcadeCombatMoves();
assert.equal(m.startSlide(0),false,'Slide needs a horizontal direction');
assert.equal(m.startSlide(1,false),false,'No mid-air slide');
assert.equal(m.startSlide(1,true,true),false,'Vehicle cannot slide');
assert.equal(m.startSlide(-1),true);
assert.equal(m.startSlide(-1),false,'Cannot spam slide');
assert.ok(m.sliding&&m.slideSpeedFactor>1&&m.slidingDir===-1);
m.step(.2);assert.ok(m.sliding);
m.step(.2);assert.equal(m.sliding,false);
assert.equal(m.slideSpeedFactor,1);
assert.equal(m.startSlide(1),false,'Slide cooldown prevents rapid spam');
m.step(.6);
assert.equal(m.readyToSlide,true);assert.equal(m.startSlide(1),true);
assert.equal(m.slash(true),false,'No hand-to-hand attack inside tank');
assert.equal(m.slash(false),true);
assert.ok(m.slashActive&&m.slashFraction>0);
assert.equal(m.slash(false),false,'Melee attack has a short cooldown');
m.step(.3);assert.equal(m.slashActive,false);
m.reset();assert.equal(m.readyToSlash,true);assert.equal(m.sliding,false);
const troops=createTroopWaves();
const assault=troops.find(e=>e.type==='assault'),h=400;
const first=damageTroop(assault,1);
assert.ok(first.hit&&!first.killed);
assert.ok(assault.dodgeTime>0,'Assault enemies must dodge after being wounded');
assert.equal(enemyCombatPose(assault),'dodge');
const x=assault.x;
advanceTroopWaves([assault],.18,assault.x-200,assault.x+200,200,h,[]);
assert.notEqual(assault.x,x,'Dodge physically changes world position');
assert.equal(assault.stance,'crouch','Dodge changes the projectile collision silhouette');
advanceTroopWaves([assault],.19,assault.x-200,assault.x+200,200,h,[]);
assert.equal(assault.dodgeTime,0);
const heavy=troops.find(e=>e.type==='heavy');
damageTroop(heavy,1);assert.equal(enemyCombatPose(heavy),'hurt');
resetTroopWaves(troops);
assert.ok(troops.every(e=>e.dodgeTime===0),'Replay clears dodge states');
const main=readFileSync('main.js','utf8'),html=readFileSync('index.html','utf8');
for(const marker of [
 "import {createArcadeCombatMoves,actionFrame}",
 "combatMoves.slash();",
 "function drawCombatMoves()",
 "function slide(){",
 "combatMoves.step(dt)",
 "SPEED*combatMoves.slideSpeedFactor",
 "crouching:isCrouching()",
 "['slide',slide]",
 "if(e.key==='Shift'&&!e.repeat)slide()",
 "e.dodgeTime>0"
])assert.ok(main.includes(marker),'Gameplay integration '+marker);
assert.ok(html.includes('id="slide"')&&html.includes('SCIVOLA'));
console.log('PASS: anti-spam evasive slide, short-range melee arc, assault evade AI, reset and Android controls');
