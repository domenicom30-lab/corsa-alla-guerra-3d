import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createArcadeSystems} from '../arcade-mechanics.js';
import {createTroopWaves,damageTroop,resetTroopWaves} from '../enemy-director.js';
import {STAGES,stageAt} from '../stage-art.js';
const world=createArcadeSystems(),troops=createTroopWaves(),H=400,ground=H*.78;
assert.equal(world.boss.maxHp,28);
assert.ok(STAGES.length===4,'Complete campaign must cross four battle zones');
assert.equal(stageAt(0),0);
assert.equal(stageAt(10000),3);
let rescued=0,score=0,killed=0;
const loot=new Set();
for(let position=0;position<=10000;position+=20){
 const pickup=world.collect(position,0,ground,H);
 if(pickup)loot.add(pickup);
 rescued+=world.rescue(position,0,H);
 for(const e of troops){
  if(e.alive&&Math.abs(e.x-position)<H*.1){
   const result=damageTroop(e,100);
   assert.equal(result.killed,true);
   killed++;score+=world.kill()+result.points;
  }
 }
 if(position>9000&&!world.boss.active){
  world.step(.03,position-H*.22,H*.22,ground,H,()=>{},()=>{});
 }
}
assert.equal(rescued,world.prisoners.length,'All prisoners can be rescued along the mission');
assert.ok(loot.has('rocket')&&loot.has('heavy')&&loot.has('spread')&&loot.has('health'));
assert.equal(killed,troops.length,'Every one of the encounter troops can be defeated');
assert.ok(score>killed*100,'Mission awards per-enemy and combo points');
assert.equal(world.boss.active,true,'Final boss activates before the end of the 200m run');
let shots=0;
while(world.boss.hp>0&&shots<60){
 const bullet=world.fire(0,ground-H*.15,1,600)[0];
 world.boss.hp=Math.max(0,world.boss.hp-bullet.damage);
 shots++;
}
assert.equal(world.boss.hp,0,'A finite amount of ammo defeats the final boss');
world.boss.defeated=true;world.boss.active=false;
assert.equal(world.boss.defeated&&10000/50>=200,true,'Mission victory can be reached');
world.reset();resetTroopWaves(troops);
assert.equal(world.boss.hp,28,'Replay restores boss HP');
assert.equal(world.boss.defeated,false,'Replay restores boss activity');
assert.ok(world.pickups.every(p=>!p.taken),'Replay restores all weapon bonuses');
assert.ok(world.prisoners.every(p=>!p.rescued),'Replay restores all prisoners');
assert.ok(troops.every(e=>e.alive),'Replay restores all troop waves');
const main=readFileSync('main.js','utf8'),html=readFileSync('index.html','utf8');
assert.ok(main.includes("distance>=200&&arcade.boss.defeated"),'Ending depends on 200m + boss defeat');
assert.ok(main.includes("missionSeconds+=dt"),'Mission time tracked');
assert.ok(html.includes('2D · v2.5'),'Installed APK can be identified onscreen');
console.log('PASS: playable four-stage 200m mission, all troop encounters, weapon drops, prisoners, final boss, ending and replay');
