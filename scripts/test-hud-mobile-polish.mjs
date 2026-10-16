import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHudRenderer} from '../arcade-hud-renderer.js';

function el(){
 const counters={text:0,html:0,width:0,hidden:0,critical:0};
 const value={textContent:'',innerHTML:'',width:'',hidden:false,critical:false};
 return {
  get textContent(){return value.textContent},
  set textContent(v){value.textContent=v;counters.text++},
  get innerHTML(){return value.innerHTML},
  set innerHTML(v){value.innerHTML=v;counters.html++},
  style:{set width(v){value.width=v;counters.width++},get width(){return value.width}},
  get hidden(){return value.hidden},
  set hidden(v){value.hidden=v;counters.hidden++},
  classList:{toggle(name,on){assert.equal(name,'critical');value.critical=on;counters.critical++}},
  counters,value
 };
}
const points=el(),hearts=el(),stats=el(),armorHud=el(),armorFill=el(),armorLabel=el();
const hud=createHudRenderer({points,hearts,stats,armorHud,armorFill,armorLabel});
const initial={score:36000,best:36580,credits:1,health:3,stage:3,remaining:19,weapon:'rocket',
 ammo:29,grenades:4,combo:1,bossHealth:null,vehicle:false,vehicleHp:100,vehicleMaxHp:100};
hud.update(initial);
assert.equal(points.textContent,'PUNTI 36000 · BEST 36580 · C 1');
assert.ok(hearts.innerHTML.includes('heart '));
assert.equal(stats.textContent,'Z4 · 19m · ROCKET 29 · BOMBE 4');
assert.equal(armorHud.hidden,true);
const baseline={points:{...points.counters},hearts:{...hearts.counters},stats:{...stats.counters},armor:{...armorHud.counters}};
for(let i=0;i<600;i++)hud.update(initial);
assert.deepEqual(points.counters,baseline.points,'600 identical frames must not cause DOM score writes');
assert.deepEqual(hearts.counters,baseline.hearts,'Life icons are not re-rendered 60 times a second');
assert.deepEqual(stats.counters,baseline.stats,'Unchanged stats need no DOM allocations');
assert.deepEqual(armorHud.counters,baseline.armor);
const next={...initial,score:36100,health:2,remaining:18,vehicle:true,vehicleHp:27,bossHealth:33.2};
hud.update(next);
assert.equal(points.counters.text,2);
assert.equal(hearts.counters.html,2);
assert.equal(stats.counters.text,2);
assert.equal(armorHud.hidden,false);
assert.equal(armorFill.style.width,'27%');
assert.equal(armorLabel.textContent,'CORAZZA 27%');
assert.equal(armorHud.value.critical,true);
hud.update({...next,vehicleHp:54});
assert.equal(armorHud.value.critical,false,'Tank damage warning clears on repairs');
hud.update({...next,vehicle:false});
assert.equal(armorHud.hidden,true);
hud.update({...initial,score:0,best:36580,credits:3,stage:0,weapon:'pistol',ammo:Infinity,grenades:0});
assert.ok(!stats.textContent.includes('Infinity'));
assert.equal(hud.stats().hearts,3,'Only health changes cause icons to update');

const html=readFileSync('index.html','utf8');
const main=readFileSync('main.js','utf8'),css=readFileSync('style.css','utf8');
assert.equal((html.match(/id="aim-up"/g)||[]).length,1,'Aim is one actual touch control, not a floating extra');
assert.ok(html.includes('class="aim-button"'));
assert.ok(main.includes("const aimButton=document.getElementById('aim-up')"));
assert.ok(main.includes("aimButton.setAttribute('aria-pressed','true')"));
assert.ok(!main.includes("document.createElement('button');aimButton.type='button'"),
 'No more standalone aim button occluding the game center');
assert.ok(main.includes("import {createHudRenderer} from './arcade-hud-renderer.js'"));
assert.ok(main.includes('hudView.update({'));
assert.ok(css.includes('#controls .control-group .aim-button[aria-pressed="true"]'));
assert.ok(css.includes('min-width:44px'));
assert.ok(css.includes('backdrop-filter:none'),'Avoid expensive blur on eight Android controls');
console.log('PASS: foldable-safe thumb aim layout, 600 frames zero redundant HUD writes, combat stats, tank indicator and dynamic controls');
