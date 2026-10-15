// Original 2D battle aftermath: animated enemy falls, helmets, dust and hit sparks.
// Everything is screen-space and camera-compensated; bounded for mobile GPUs.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createBattleCasualties(){
 const falls=[],debris=[],hits=[];
 let seed=3,clock=0;
 const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 function bounded(list,item,max){if(list.length>=max)list.shift();list.push(item)}
 function defeated(type,x,ground,H,direction=1,power=1){
  const force=clamp(power,.3,3),dir=direction<0?-1:1;
  bounded(falls,{
   type,x,y:ground-H*.14,vx:dir*H*(.16+force*.12),
   vy:-H*(.35+force*.1),angle:0,angular:dir*(3.5+force*1.1),
   dir,age:0,life:3.35,impact:false,ground,fade:1
  },24);
  // Helmet flies independently from the animated body.
  bounded(debris,{x:x-dir*H*.025,y:ground-H*.27,vx:dir*H*(.2+force*.15),
   vy:-H*(.45+rng()*.1),angle:0,spin:dir*(5+rng()*5),kind:'helmet',size:H*.022,life:2.2},54);
  for(let i=0;i<6;i++)bounded(debris,{x:x+dir*H*.012,y:ground-H*(.10+rng()*.08),
   vx:(rng()-.5)*H*(.4+force*.1),vy:-H*(.2+rng()*.35),angle:0,
   spin:(rng()-.5)*12,kind:i%3===0?'brass':'stone',size:H*(.008+rng()*.012),life:.8+rng()*.7},54);
 }
 function impact(x,y,H,armored=false){
  for(let i=0;i<(armored?10:6);i++){
   const a=rng()*Math.PI*2,speed=H*(.15+rng()*(armored?.6:.4));
   bounded(hits,{x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,
    life:.18+rng()*.22,ttl:.4,size:H*(.004+rng()*.007),color:armored?'#f3d69a':'#fff5cb'},72);
  }
 }
 function step(dt,cameraDelta,ground,H){
  if(dt<=0)return;
  dt=Math.min(.06,dt);clock+=dt;
  for(let i=falls.length-1;i>=0;i--){
   const f=falls[i];f.age+=dt;f.life-=dt;f.x+=f.vx*dt-cameraDelta;
   if(!f.impact){
    f.vy+=H*2.4*dt;f.y+=f.vy*dt;f.angle+=f.angular*dt;
    if(f.y>=ground-H*.075){
     f.y=ground-H*.075;f.vy=0;f.impact=true;
     f.angle=f.dir*Math.PI*.5;f.vx*=.24;
     for(let j=0;j<4;j++)bounded(debris,{
      x:f.x+(rng()-.5)*H*.13,y:ground-H*.035,
      vx:(rng()-.5)*H*.22,vy:-H*(.08+rng()*.16),
      angle:0,spin:0,kind:'dust',size:H*(.012+rng()*.017),life:.37+rng()*.3
     },54);
    }
   }else{f.vx*=Math.pow(.12,dt);f.y=ground-H*.075}
   f.fade=clamp(f.life/.7,0,1);
   if(f.life<=0)falls.splice(i,1);
  }
  for(let i=debris.length-1;i>=0;i--){
   const p=debris[i];p.x+=p.vx*dt-cameraDelta;p.y+=p.vy*dt;
   p.vy+=H*(p.kind==='dust'?.12:2.3)*dt;p.angle+=p.spin*dt;p.life-=dt;
   if(p.y>ground-H*.008){p.y=ground-H*.008;p.vy*=p.kind==='helmet'?-.28:0;p.vx*=.7}
   if(p.life<=0)debris.splice(i,1);
  }
  for(let i=hits.length-1;i>=0;i--){
   const p=hits[i];p.x+=p.vx*dt-cameraDelta;p.y+=p.vy*dt;
   p.vy+=H*.5*dt;p.life-=dt;if(p.life<=0)hits.splice(i,1);
  }
 }
 function draw(ctx,W,H,ground,paintCorpse){
  ctx.save();ctx.imageSmoothingEnabled=false;
  // Layered grounding shadows and animated cloth silhouettes.
  for(const f of falls){
   if(f.x<-H*.3||f.x>W+H*.3)continue;
   const w=H*(f.type==='heavy'?.19:.155);
   ctx.globalAlpha=f.fade*.22;ctx.fillStyle='#151a16';
   ctx.beginPath();ctx.ellipse(f.x,ground+H*.004,w,H*.01,0,0,Math.PI*2);ctx.fill();
   ctx.globalAlpha=f.fade;
   paintCorpse(ctx,f,H);
  }
  for(const p of debris){
   if(p.x<-H*.1||p.x>W+H*.1)continue;
   ctx.globalAlpha=clamp(p.life/.4,0,1);
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
   if(p.kind==='helmet'){
    ctx.fillStyle='#202f2c';ctx.beginPath();ctx.ellipse(0,0,p.size*1.2,p.size*.72,0,Math.PI,Math.PI*2);ctx.fill();
    ctx.fillStyle='#8a9684';ctx.fillRect(-p.size*.9,-p.size*.12,p.size*1.8,p.size*.2);
    ctx.fillStyle='#475b51';ctx.fillRect(-p.size*.55,-p.size*.55,p.size*.65,p.size*.2);
   }else if(p.kind==='dust'){
    ctx.fillStyle='#a59b7b';ctx.fillRect(-p.size*.5,-p.size*.5,p.size,p.size*.55);
   }else{
    ctx.fillStyle=p.kind==='brass'?'#d5ad62':'#626355';
    ctx.fillRect(-p.size*.5,-p.size*.5,p.size,p.size*.65);
   }
   ctx.restore();
  }
  for(const p of hits){
   if(p.x<-H*.05||p.x>W+H*.05)continue;
   ctx.globalAlpha=clamp(p.life/p.ttl,0,1);
   ctx.fillStyle=p.color;
   ctx.fillRect(p.x,p.y,Math.max(1,p.size),Math.max(1,p.size*.45));
  }
  ctx.restore();
 }
 const reset=()=>{falls.length=0;debris.length=0;hits.length=0;clock=0;seed=3};
 return {defeated,impact,step,draw,reset,
  stats:()=>({falls:falls.length,debris:debris.length,hits:hits.length}),
  snapshot:()=>falls.map(f=>({type:f.type,x:f.x,y:f.y,angle:f.angle,impact:f.impact,life:f.life}))};
}
