import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bossPhase,createBossEncounter} from '../boss-encounter.js';
import {createArcadeSystems} from '../arcade-mechanics.js';

const H=400,ground=H*.78;
const makeBoss=()=>({x:600,hp:28,maxHp:28,active:true,defeated:false});
const initial=(boss,extra={})=>({
 boss,scroll:0,playerX:200,playerWorldX:200,ground,H,cameraDelta:0,
 jumpY:0,sliding:false,occupied:false,covers:[],onDamage:()=>{},onImpact:()=>{},...extra
});
assert.equal(bossPhase(makeBoss()),1);
assert.equal(bossPhase({...makeBoss(),hp:18}),2);
assert.equal(bossPhase({...makeBoss(),hp:9}),3);
assert.equal(bossPhase({...makeBoss(),hp:NaN}),1);

const phaseOne=createBossEncounter(),full=makeBoss();
phaseOne.state.cooldown=0;
for(let i=0;i<60;i++)phaseOne.step(.016,initial(full));
assert.equal(phaseOne.state.windup,0,'First phase uses regular cannons only');
assert.equal(phaseOne.state.waves.length,0);

function fireSpecial(encounter,boss,options={}){
 encounter.state.cooldown=0;
 encounter.step(.016,initial(boss,options));
 assert.ok(encounter.state.windup>0,'The player receives a telegraph first');
 assert.equal(encounter.state.waves.length,0,'Warning window cannot hurt');
 for(let i=0;i<62&&encounter.state.attacks===0;i++)
  encounter.step(.016,initial(boss,options));
 assert.equal(encounter.state.attacks,1,'Special attack launches after its warning');
}
const wounded={...makeBoss(),hp:16};
const groundHit=createBossEncounter();
let damage=0,impact=0;
const groundCtx={onDamage:()=>damage++,onImpact:()=>impact++};
fireSpecial(groundHit,wounded,groundCtx);
for(let i=0;i<100;i++)groundHit.step(.016,initial(wounded,groundCtx));
assert.equal(damage,1,'Crossing the grounded player must hit once');
assert.equal(impact,1,'Only one burst per projectile hit');
assert.equal(groundHit.state.waves.length,0);

for(const [label,props] of [
 ['jump',{jumpY:H*.18}],['slide',{sliding:true}],['armored vehicle',{occupied:true}]
]){
 const enemy=createBossEncounter();let taken=0;
 const dodge={...props,onDamage:()=>taken++};
 fireSpecial(enemy,wounded,dodge);
 for(let i=0;i<105;i++)enemy.step(.016,initial(wounded,dodge));
 assert.equal(taken,0,label+' avoids low ground waves');
}
const cover={x:400,hp:90},block=createBossEncounter();let blocked=0,injured=0;
const blockCfg={covers:[cover],onDamage:()=>injured++,onImpact:()=>blocked++};
fireSpecial(block,wounded,blockCfg);
for(let i=0;i<100;i++)block.step(.016,initial(wounded,blockCfg));
assert.equal(cover.hp,45,'First intact barricade absorbs the ground shock');
assert.equal(blocked,1);assert.equal(injured,0);

const berserk={...makeBoss(),hp:8},double=createBossEncounter();
fireSpecial(double,berserk,{playerX:0,playerWorldX:0});
assert.equal(double.state.pending,1,'Phase three queues a second low attack');
for(let i=0;i<21;i++)double.step(.016,initial(berserk,{playerX:0,playerWorldX:0}));
assert.equal(double.state.pending,0,'Second shock launches after a controlled delay');
assert.ok(double.state.waves.length>=1,'The paired attack remains active');

const distant=createBossEncounter();distant.state.cooldown=0;
for(let i=0;i<110;i++)distant.step(.016,initial(wounded,{playerX:0,playerWorldX:-3000}));
assert.equal(distant.state.attacks,0,'No offscreen special attacks');
const dead=createBossEncounter();fireSpecial(dead,wounded);wounded.defeated=true;
dead.step(.016,initial(wounded));
assert.equal(dead.state.waves.length,0,'Death cancels lingering attacks');
assert.equal(dead.state.windup,0);
wounded.defeated=false;
dead.reset();assert.equal(dead.state.attacks,0);assert.equal(dead.state.cooldown,3.8);
assert.equal(dead.state.waves.length,0);

const live=createArcadeSystems();
assert.ok(live.bossEncounter,'Shared encounter must be exposed for debug');
live.boss.active=true;live.boss.hp=16;live.bossEncounter.state.cooldown=0;
live.step(.016,live.boss.x-H,200,ground,H,()=>{},()=>{},0,{jumpY:0,sliding:false,occupied:false});
assert.ok(live.bossEncounter.state.windup>0,'Boss special runs in actual combat simulation');
live.reset();assert.equal(live.bossEncounter.state.windup,0,'Full restart clears specials');

const main=readFileSync('main.js','utf8');
const mechanics=readFileSync('arcade-mechanics.js','utf8');
const apk=readFileSync('.github/workflows/build-apk.yml','utf8');
for(const marker of [
 "import {bossPhase} from './boss-encounter.js'",
 'sliding:combatMoves.sliding,occupied:ride.occupied',
 "ctx.fillText('IRON COMMANDER · FASE '"
])assert.ok(main.includes(marker),'Main gameplay missing: '+marker);
for(const marker of ['bossEncounter.step(dt', 'bossEncounter.draw(ctx', 'bossEncounter.reset()']){
 assert.ok(mechanics.includes(marker),'Boss integration missing: '+marker);
}
assert.ok(apk.includes('on:\n  workflow_dispatch:')&&!apk.includes('\n  push:'),'Do not launch APK from every commit');
console.log('PASS: three boss phases, telegraphed shock, jump/slide/vehicle dodge, barriers, double strike, distance and restart');
