import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {battlefieldWeatherForStage,weatherParticleCount,drawBattleWeather} from '../battle-weather.js';
assert.deepEqual([0,1,2,3].map(battlefieldWeatherForStage),
 ['dust','embers','sparks','rain']);
assert.equal(battlefieldWeatherForStage(-10),'dust');
assert.equal(battlefieldWeatherForStage(400),'rain');
assert.equal(weatherParticleCount('battery'),12);
assert.equal(weatherParticleCount('auto'),28);
assert.equal(weatherParticleCount('high'),47);
assert.ok(weatherParticleCount('battery')<weatherParticleCount('high'));
assert.ok(weatherParticleCount('battery','front')<=6);
function mock(){
 const frames={draw:0,strokes:0,ops:[],saves:0,restores:0};
 const ctx={save(){frames.saves++},restore(){frames.restores++},
  fillRect(x,y,w,h){frames.draw++;assert.ok([x,y,w,h].every(Number.isFinite));if(frames.ops.length<50)frames.ops.push([x,y,w,h,this.fillStyle])},
  beginPath(){},moveTo(){},lineTo(){},stroke(){frames.strokes++},
  fillStyle:'',globalAlpha:1,imageSmoothingEnabled:false};
 return {ctx,frames};
}
for(let stage=0;stage<4;stage++){
 const scene=mock();
 const count=drawBattleWeather(scene.ctx,1100,520,1230,406,2.5,stage,'auto','back');
 assert.ok(count>0&&count<=28,'Bounded particles behind soldiers');
 assert.equal(scene.frames.saves,scene.frames.restores,'Balanced canvas operations');
 if(stage===3)assert.ok(scene.frames.strokes>0,'Rain has thin diagonal strokes');
 const foreground=mock();
 const front=drawBattleWeather(foreground.ctx,1100,520,1230,406,2.5,stage,'high','front');
 assert.ok(front<=weatherParticleCount('high','front'));
 assert.equal(foreground.frames.saves,foreground.frames.restores);
}
const battery=mock(),high=mock();
const low=drawBattleWeather(battery.ctx,1100,520,1230,406,3,2,'battery');
const quality=drawBattleWeather(high.ctx,1100,520,1230,406,3,2,'high');
assert.ok(low<=12&&quality>low,'Performance setting scales effect density');
const first=mock(),again=mock();
drawBattleWeather(first.ctx,1100,520,1230,406,2.5,1,'high','back');
drawBattleWeather(again.ctx,1100,520,1230,406,2.5,1,'high','back');
assert.deepEqual(first.frames.ops,again.frames.ops,'Same time/scroll yields deterministic particles');
const broken=mock();
assert.equal(drawBattleWeather(broken.ctx,0,500,0,380,0,0),0);
assert.equal(drawBattleWeather(broken.ctx,100,NaN,0,380,0,0),0);
assert.equal(broken.frames.saves,0);
const main=readFileSync('main.js','utf8');
assert.ok(main.includes("import {drawBattleWeather} from './battle-weather.js'"));
for(const layer of ['back','front']){
 assert.ok(main.includes("stageAt(scroll),graphicsQuality,'"+layer+"')"),
  'Weather layer not integrated into active four-stage mission: '+layer);
}
assert.ok(!main.includes('drawArcadeStorm(ctx,W,H,phase*.015,scroll>2900)'),
 'Outdated uniform rain across three levels must be replaced');
console.log('PASS: four distinct atmospheric conditions, two parallax planes, deterministic bounded weather, battery mode and runtime integration');
