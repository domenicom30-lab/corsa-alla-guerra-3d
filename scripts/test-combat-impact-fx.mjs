import assert from 'node:assert/strict';
import {createCombatImpactFx} from '../combat-impact-fx.js';
import {readFileSync} from 'node:fs';
const fx=createCombatImpactFx();
assert.equal(fx.strike(NaN,100),false,'Invalid coordinates are ignored');
assert.equal(fx.strike(240,180,{kind:'infantry',direction:1}),true);
assert.equal(fx.stats().flashes,1);
assert.equal(fx.stats().chips,7);
assert.ok(fx.snapshot().chips.some(x=>x.vx<0),'Rightward shot produces backward scatter');
fx.step(.016,20,340);
assert.equal(fx.snapshot().flashes[0].x,220,'Impacts follow camera scroll');
const ops=[],ctx={save(){ops.push('save')},restore(){ops.push('restore')},
 fillRect(x,y,w,h){assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&w>0&&h>0,'Safe pixel rectangles');assert.ok(w<40&&h<40,'No giant flash shapes');ops.push('rect')},
 imageSmoothingEnabled:true};
fx.draw(ctx,960,540);
assert.equal(ops[0],'save');assert.equal(ops.at(-1),'restore');
fx.reset();fx.strike(240,180,{kind:'armor',direction:-1});
assert.ok(fx.snapshot().chips.some(x=>x.vx>0),'Reverse armored hit rebounds rightward');
assert.equal(fx.stats().chips,11);
for(let i=0;i<100;i++)fx.strike(240,180,{kind:i%2?'boss':'cover'});
assert.ok(fx.stats().flashes<=22&&fx.stats().chips<=112,'Mobile-safe bounded pools');
fx.draw(ctx,960,540,'battery');
for(let i=0;i<60;i++)fx.step(.05,0,340);
assert.deepEqual(fx.stats(),{flashes:0,chips:0},'Particles expire');
fx.strike(30,100,{kind:'melee'});fx.reset();
assert.deepEqual(fx.stats(),{flashes:0,chips:0},'Restart clears combat FX');
const main=readFileSync('main.js','utf8');
for(const token of [
 "import {createCombatImpactFx} from './combat-impact-fx.js'",
 'const hitFx=createCombatImpactFx()',
 'hitFx.step(dt,cameraDelta,ground())',
 'hitFx.draw(ctx,W,H,graphicsQuality)',
 'hitFx.reset();'
])assert.ok(main.includes(token),'Live game integration missing: '+token);
assert.ok(main.includes("kind:'boss'")&&main.includes("kind:'melee'"),'Boss/melee use distinct feedback');
const slash=readFileSync('main.js','utf8'),scores=readFileSync('arcade-spectacle.js','utf8');
assert.ok(slash.includes('ctx.arc(0,0,H*.055')&&slash.includes('ctx.arc(0,0,H*.069'),
 'Melee effect must match compact character proportions');
assert.ok(!slash.includes('ctx.arc(0,0,H*.125'),
 'Old oversize melee crescent obscured soldiers');
assert.ok(scores.includes('size=Math.max(12,h*.026)'),
 'Floating score labels should not cover actor faces');
console.log('PASS: directional combat FX, armored ricochet, scenery impacts, mobile cap and camera motion');
