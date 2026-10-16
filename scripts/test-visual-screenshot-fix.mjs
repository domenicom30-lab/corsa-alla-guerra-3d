import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawBossDeathCinematic} from '../arcade-cinematics.js';

const main=readFileSync('main.js','utf8');
const cinematic=readFileSync('arcade-cinematics.js','utf8');
assert.ok(main.includes("const width=H*(.095+.055*Math.sin(Math.PI*progress))"),
  'Oversized original explosion PNGs must be capped below 0.15 screen height');
assert.ok(!main.includes('const width=H*(.20+progress*.23)'),
  'Original screenshot showed oversized 0.43H raster circles');
assert.ok(cinematic.includes("drawRaster(ctx,'fx','explosion'"),
  'Boss death uses real original animated effect art');
assert.ok(!cinematic.includes("for(let i=0;i<22;i++)"),
  'Old twenty-two giant discs must not reappear');
const events={rects:[],saves:0,restores:0,arcs:0};
const ctx={imageSmoothingEnabled:false,
 save(){events.saves++},restore(){events.restores++},
 fillRect(...a){events.rects.push(a)},beginPath(){},
 arc(){events.arcs++},fill(){},drawImage(){}};
drawBossDeathCinematic(ctx,1100,530,407,-.3,400);
assert.equal(events.saves,0);
drawBossDeathCinematic(ctx,1100,530,407,1.1,400);
assert.equal(events.saves,1);
assert.equal(events.restores,1);
assert.equal(events.arcs,0,'Screenshot obscured by painted circles in boss cinematic');
assert.ok(events.rects.length>0&&events.rects.length<=70,
 'Compact pixel fallback rather than sky-covering glow');
assert.ok(events.rects.every(([, ,w,h])=>w<=530*.006&&h<=530*.006),
 'Death fragments must be tiny, leaving the stage readable');
drawBossDeathCinematic(ctx,1100,530,407,2.7,400);
assert.equal(events.saves,1,'Finished cinema does not keep painting');
console.log('PASS: screenshot-driven fix, reduced PNG explosions, no circular death flashes, bounded original cinematic FX');
