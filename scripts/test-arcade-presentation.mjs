import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareHeroFrames,drawHeroFrame,heroFrameCounts} from '../hero-animation.js';
import {createArcadeSpectacle} from '../arcade-spectacle.js';
const main=readFileSync('main.js','utf8');
assert.ok(main.includes('loadSpritePacks()'),'Protagonist mandatory image packs loaded');
assert.ok(main.includes("drawRaster(ctx,'hero',pose,frame"),'Raster protagonist painted every frame');
assert.ok(main.includes('spectacle.drawFront(ctx,W,H,scroll,ground());'),'Effects composited into scene');
assert.ok(main.includes('spectacle.step(dt,cameraDelta)'),'Effects follow camera');
assert.ok(main.includes('spectacle.reset();'),'Restart clears particle pools');
assert.ok(main.includes('spectacle.impact(e.x-scroll,ground()-H*.16,result.killed?result.points:0)'),'Enemy hits award visible points');
const original=globalThis.document;
const drawOps=[];
let created=0;
const brush=new Proxy({imageSmoothingEnabled:false},{
 get(target,key){return key in target?target[key]:(()=>{})},
 set(target,key,value){target[key]=value;return true}
});
globalThis.document={createElement(tag){
 assert.equal(tag,'canvas');
 const canvas={width:0,height:0,getContext(){return brush},id:created++};
 return canvas;
}};
try{
 prepareHeroFrames();
 assert.equal(created,Object.values(heroFrameCounts).reduce((a,b)=>a+b,0));
 const screen={imageSmoothingEnabled:true,drawImage(...args){drawOps.push(args)}};
 for(const [pose,count] of Object.entries(heroFrameCounts)){
  for(let f=0;f<count;f++)assert.equal(drawHeroFrame(screen,pose,f,0,0,128,152),true);
 }
 assert.equal(drawOps.length,33);
 assert.equal(new Set(drawOps.map(a=>a[0].id)).size,33,'Each authored hero pose must have a unique cache image');
 prepareHeroFrames();
 assert.equal(created,33,'Sprites cached once');
}finally{if(original===undefined)delete globalThis.document;else globalThis.document=original}
const s=createArcadeSpectacle();
s.shot(140,100,1,false);
for(let i=0;i<100;i++)s.impact(140,160,120);
for(let i=0;i<80;i++)s.explosion(300,150);
assert.ok(s.stats().sparks<=170);
assert.ok(s.stats().smoke<=90);
assert.ok(s.stats().labels<=28);
assert.ok(s.stats().shockwaves<=24);
const fxCtx=new Proxy({save(){},restore(){},imageSmoothingEnabled:false},{
 get(t,k){return k in t?t[k]:(()=>{})},set(t,k,v){t[k]=v;return true}
});
s.drawBack(fxCtx,850,380,1200,290);
s.drawFront(fxCtx,850,380,1200,290);
s.drawOverlay(fxCtx,850,380,8);
s.step(3,0);
assert.equal(s.stats().sparks,0);
assert.equal(s.stats().smoke,0);
assert.equal(s.stats().labels,0);
s.explosion(100,150);s.reset();
assert.deepEqual(s.stats(),{sparks:0,smoke:0,labels:0,shockwaves:0});
console.log('PASS: 33 cached animated protagonist frames, bounded 2D effects and camera scroll');
