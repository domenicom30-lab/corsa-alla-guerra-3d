import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBattleCasualties} from '../battle-aftermath.js';
import {prepareTroopSprites,drawFallenTroop} from '../troop-art.js';
const main=readFileSync('main.js','utf8');
const stage=readFileSync('stage-art.js','utf8');

const b=createBattleCasualties(),H=400,ground=312;
b.defeated('rifleman',220,ground,H,1,1);
assert.equal(b.stats().falls,1);
const first=b.snapshot()[0];
assert.ok(first.y<ground&&first.life>3);
b.step(.03,12,ground,H);
assert.ok(b.snapshot()[0].x>first.x-12,'Velocity and camera delta both contribute to the pose');
const started=b.snapshot()[0].y;
for(let i=0;i<50;i++)b.step(.05,0,ground,H);
assert.ok(b.snapshot()[0].impact,'Bodies must finish falling and settle');
assert.ok(b.snapshot()[0].y>started,'Ground contact must occur');
let paints=0,corpses=0,saves=0,restores=0;
const noop=()=>{};
const brush=new Proxy({
 save(){saves++},restore(){restores++},
 fillRect(){paints++},
 beginPath:noop,ellipse:noop,fill:noop,translate:noop,rotate:noop,drawImage(){paints++}
},{get(target,key){return key in target?target[key]:noop},set(target,key,value){target[key]=value;return true}});
b.draw(brush,880,H,ground,(_ctx,fall)=>{corpses++;assert.ok(fall.life>0)});
assert.ok(paints>0&&corpses===1);
assert.equal(saves,restores,'Canvas stack must balance');
for(let i=0;i<70;i++)b.defeated(i%2?'heavy':'assault',100+i*4,ground,H,i%2?-1:1,2);
for(let i=0;i<100;i++)b.impact(150,250,H,i%2===0);
assert.ok(b.stats().falls<=24,'Bound death pose pool');
assert.ok(b.stats().debris<=54,'Bound flying debris pool');
assert.ok(b.stats().hits<=72,'Bound hit sparks pool');
for(let i=0;i<90;i++)b.step(.05,0,ground,H);
assert.deepEqual(b.stats(),{falls:0,debris:0,hits:0},'Expired effects must be removed');
b.defeated('heavy',200,ground,H);
b.reset();
assert.deepEqual(b.stats(),{falls:0,debris:0,hits:0},'Restart clears all effects');

// Render an original cached enemy illustration as an animated falling figure.
const original=globalThis.document;
let n=0;
globalThis.document={createElement(){
 n++;
 return {width:0,height:0,getContext:()=>new Proxy({},{
  get(t,k){return k in t?t[k]:noop},set(t,k,v){t[k]=v;return true}
 })};
}};
try{
 prepareTroopSprites();
 assert.equal(n,32);
 const falling={type:'heavy',x:220,y:ground-20,dir:-1,angle:1.1,fade:.5};
 assert.equal(drawFallenTroop(brush,falling,H),true);
 assert.equal(saves,restores);
}finally{if(original===undefined)delete globalThis.document;else globalThis.document=original}

// Wiring checks: defeats originate from melee, bullets, and blast, and follow camera movement.
for(const token of [
 "import {createBattleCasualties}",
 "aftermath.defeated(troop.type",
 "aftermath.defeated(e.type",
 "aftermath.step(dt,cameraDelta,ground(),H)",
 "aftermath.draw(ctx,W,H,ground(),drawFallenTroop)",
 "aftermath.reset();",
 "function isCrouching(){return duckHeld||duckTime>0}",
 "duckButton.setPointerCapture(e.pointerId);duckHeld=true",
 "duckHeld=false;duckTime=0",
 "crouching:isCrouching()"
])assert.ok(main.includes(token),token);
assert.ok(main.indexOf("drawWarzoneParallax(ctx,W,H,scroll,ground())")<main.indexOf("drawStageBackdrop(ctx,W,H,scroll,ground(),phase)"),'New battlegrounds painted above forest backdrop');
assert.ok(stage.includes("ctx.globalAlpha*=night===3?.5:.3"),'Sky glow respects stage crossfade');
assert.ok(stage.includes("ctx.globalAlpha*=.09+noise(i+j+k)*.07"),'Factory smoke respects stage crossfade');
console.log('PASS: animated enemy knockdowns, 3 bounded effect pools, original cached sprites, crouch hold and layered stages');
