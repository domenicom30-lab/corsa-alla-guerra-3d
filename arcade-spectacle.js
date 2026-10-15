// Original retro run-and-gun FX. Bounded pools and camera-relative coordinates.
const hash=i=>{const x=Math.sin(i*143.7+29.12)*35891.23;return x-Math.floor(x)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createArcadeSpectacle(){
 const sparks=[],smoke=[],labels=[],shockwaves=[];
 let tick=0,seed=12;
 const rnd=()=>hash(seed++);
 function particle(arr,obj,max){if(arr.length>=max)arr.shift();arr.push(obj)}
 function shot(x,y,dir=1,heavy=false){
  for(let i=0;i<(heavy?13:6);i++){
   const a=(rnd()-.5)*2.4,v=(heavy?220:110)*(.6+rnd());
   particle(sparks,{x:x+dir*6,y,vx:Math.cos(a)*v*dir,vy:Math.sin(a)*v,life:.10+rnd()*.2,ttl:.3,size:heavy?4:2,color:i%2?'#ffcc68':'#fff6c9'},170);
  }
 }
 function impact(x,y,score=0,color='#ffcd68'){
  for(let i=0;i<14;i++){
   const a=i/14*Math.PI*2+rnd()*.2,v=75+rnd()*210;
   particle(sparks,{x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.18+rnd()*.3,ttl:.48,size:1.7+rnd()*3.4,color:i%3===0?'#fffbd8':color},170);
  }
  if(score>0)particle(labels,{x,y:y-14,text:'+'+score,life:.75,ttl:.75},28);
  particle(shockwaves,{x,y,r:4,life:.25,ttl:.25},24);
 }
 function explosion(x,y,scale=1){
  scale=clamp(scale,.4,2.3);
  for(let i=0;i<28;i++){
   const a=i*Math.PI*2/28+rnd()*.5,v=(65+rnd()*260)*scale;
   particle(sparks,{x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.17+rnd()*.5,ttl:.7,size:(3+rnd()*8)*scale,color:i%5===0?'#fff4ba':i%2?'#f06727':'#ffbd4d'},170);
  }
  for(let i=0;i<11;i++){
   const a=rnd()*Math.PI*2,r=(12+rnd()*28)*scale;
   particle(smoke,{x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,vx:(rnd()-.5)*25,vy:-35-rnd()*40,life:.6+rnd()*.6,ttl:1.2,size:(11+rnd()*30)*scale},90);
  }
  particle(shockwaves,{x,y,r:8*scale,life:.35,ttl:.35},24);
 }
 function step(dt,move){
  tick+=dt;
  for(const [arr,gravity,drag] of [[sparks,370,.92],[smoke,-19,.985]]){
   for(let i=arr.length-1;i>=0;i--){
    const p=arr[i];p.x+=p.vx*dt-move;p.y+=p.vy*dt;p.vy+=gravity*dt;
    p.vx*=Math.pow(drag,dt*60);
    p.life-=dt;if(p.life<=0)arr.splice(i,1);
   }
  }
  for(const l of labels){l.x-=move;l.y-=dt*38;l.life-=dt}
  for(let i=labels.length-1;i>=0;i--)if(labels[i].life<=0)labels.splice(i,1);
  for(const ring of shockwaves){ring.x-=move;ring.r+=260*dt;ring.life-=dt}
  for(let i=shockwaves.length-1;i>=0;i--)if(shockwaves[i].life<=0)shockwaves.splice(i,1);
 }
 function drawBack(ctx,w,h,scroll,ground){
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(let i=0;i<9;i++){
   const n=i+37,period=w+h*.8,x=((n*245-scroll*.18)%period+period)%period-h*.2;
   const y=ground-h*(.38+hash(n)*.24),blink=Math.sin(tick*.9+n*1.7);
   if(blink>.55){ctx.globalAlpha=(blink-.55)*.23;ctx.strokeStyle='#dfb178';ctx.lineWidth=Math.max(1,h*.003);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+h*.07,y+h*.015);ctx.stroke()}
  }
  for(let i=0;i<28;i++){
   const x=300+i*390-scroll;if(x<-h*.4||x>w+h*.4)continue;
   const kind=i%5;
   if(kind===0){
    ctx.fillStyle='#232b2a';ctx.fillRect(x,ground-h*.28,h*.16,h*.28);
    ctx.fillStyle='#59614c';ctx.fillRect(x+h*.013,ground-h*.27,h*.13,h*.035);
    ctx.fillStyle='#171e20';ctx.fillRect(x+h*.03,ground-h*.19,h*.095,h*.08);
    ctx.fillStyle='#b2a47d';ctx.fillRect(x+h*.036,ground-h*.19,h*.012,h*.08);
   }else if(kind===1){
    ctx.save();ctx.translate(x,ground);ctx.strokeStyle='#343b37';ctx.lineWidth=h*.019;
    ctx.beginPath();ctx.moveTo(-h*.07,-h*.02);ctx.lineTo(h*.07,-h*.16);
    ctx.moveTo(-h*.06,-h*.15);ctx.lineTo(h*.06,-h*.01);ctx.stroke();
    ctx.strokeStyle='#9da087';ctx.lineWidth=h*.003;ctx.beginPath();
    ctx.moveTo(-h*.05,-h*.025);ctx.lineTo(h*.05,-h*.129);ctx.stroke();ctx.restore();
   }else if(kind===2){
    ctx.fillStyle='#353b31';ctx.fillRect(x,ground-h*.13,h*.19,h*.13);
    ctx.fillStyle='#8e7758';ctx.fillRect(x-h*.02,ground-h*.15,h*.24,h*.047);
    ctx.fillStyle='#6f5b43';ctx.fillRect(x-h*.03,ground-h*.095,h*.23,h*.034);
    ctx.fillStyle='#d1af72';ctx.fillRect(x+h*.018,ground-h*.146,h*.005,h*.008);
   }else if(kind===3){
    ctx.strokeStyle='#343b31';ctx.lineWidth=h*.014;ctx.beginPath();
    ctx.moveTo(x,ground);ctx.lineTo(x,ground-h*.32);ctx.stroke();
    ctx.strokeStyle='#a49e77';ctx.lineWidth=Math.max(1,h*.003);ctx.beginPath();
    ctx.moveTo(x-h*.04,ground-h*.26);ctx.quadraticCurveTo(x+h*.13,ground-h*.16,x+h*.35,ground-h*.24);ctx.stroke();
    ctx.fillStyle='#4c5849';ctx.fillRect(x-h*.045,ground-h*.27,h*.09,h*.012);
   }else{
    for(let row=0;row<2;row++)for(let j=0;j<3;j++){
     const bx=x+j*h*.06+(row%2)*h*.025,by=ground-h*(.043+row*.035);
     ctx.fillStyle='#292d24';ctx.fillRect(bx-1,by-1,h*.072,h*.042);
     ctx.fillStyle=row?'#8f886a':'#6e765e';ctx.fillRect(bx,by,h*.065,h*.029);
     ctx.fillStyle='#bdaf8d';ctx.fillRect(bx+h*.006,by+h*.006,h*.026,h*.004);
    }
   }
  }
  ctx.restore();
 }
 function drawFront(ctx,w,h,scroll,ground){
  ctx.save();ctx.imageSmoothingEnabled=false;
  const unit=h*.15,offset=((scroll*1.13)%unit+unit)%unit;
  for(let i=-1;i<Math.ceil(w/unit)+2;i++){
   const n=i+Math.floor(scroll*1.13/unit),x=i*unit-offset,variant=Math.floor(hash(n+421)*4);
   if(variant===0){
    ctx.fillStyle='#262b25';ctx.fillRect(x,ground-h*.009,h*.054,h*.016);
    ctx.fillStyle='#71715b';ctx.fillRect(x+h*.014,ground-h*.011,h*.021,h*.003);
   }else if(variant===1){
    for(let j=0;j<3;j++){ctx.fillStyle=j%2?'#7f755a':'#4c553a';ctx.fillRect(x+j*h*.012,ground-h*(.015+j*.006),h*.005,h*(.015+j*.006))}
   }else if(variant===2){
    ctx.fillStyle='#33362c';ctx.beginPath();ctx.ellipse(x,ground+h*.004,h*.045,h*.009,0,0,Math.PI*2);ctx.fill();
   }
  }
  for(const p of smoke){
   const alpha=clamp(p.life/p.ttl,0,1)*.32;
   ctx.globalAlpha=alpha;ctx.fillStyle='#161c1c';
   const sz=Math.max(2,p.size*(1+(1-alpha)*.6));
   ctx.beginPath();ctx.arc(Math.round(p.x),Math.round(p.y),sz*.6,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#ada99a';ctx.globalAlpha=alpha*.25;
   ctx.fillRect(Math.round(p.x-sz*.25),Math.round(p.y-sz*.5),sz*.4,sz*.17);
  }
  ctx.globalAlpha=1;
  for(const p of sparks){
   ctx.globalAlpha=clamp(p.life/p.ttl,0,1);ctx.fillStyle=p.color;
   ctx.fillRect(Math.round(p.x),Math.round(p.y),Math.ceil(p.size),Math.ceil(p.size));
   ctx.fillStyle='#fff3c0';
   ctx.fillRect(Math.round(p.x-p.vx*.012),Math.round(p.y-p.vy*.012),Math.max(1,p.size*.4),Math.max(1,p.size*.4));
  }
  for(const ring of shockwaves){
   ctx.globalAlpha=clamp(ring.life/ring.ttl,0,1)*.55;
   ctx.strokeStyle='#ffe4a4';ctx.lineWidth=Math.max(2,h*.006);ctx.beginPath();
   ctx.ellipse(ring.x,ring.y,ring.r,ring.r*.72,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.globalAlpha=1;ctx.restore();
 }
 function drawOverlay(ctx,w,h,combo){
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  for(const label of labels){
   const a=clamp(label.life/label.ttl,0,1),size=Math.max(13,h*.036);
   ctx.globalAlpha=a;ctx.font='900 '+size+'px system-ui,sans-serif';
   ctx.lineWidth=Math.max(3,size*.17);ctx.strokeStyle='#1a201d';ctx.strokeText(label.text,label.x,label.y);
   ctx.fillStyle='#ffd782';ctx.fillText(label.text,label.x,label.y);
  }
  if(combo>=3){
   ctx.globalAlpha=.82;ctx.font='900 '+Math.max(17,h*.043)+'px system-ui,sans-serif';
   ctx.lineWidth=4;ctx.textAlign='left';ctx.strokeStyle='#18221d';ctx.strokeText('COMBO ×'+combo,w*.03,h*.285);
   ctx.fillStyle='#ffdd84';ctx.fillText('COMBO ×'+combo,w*.03,h*.285);
  }
  ctx.restore();
 }
 function reset(){sparks.length=0;smoke.length=0;labels.length=0;shockwaves.length=0;tick=0}
 return {shot,impact,explosion,step,drawBack,drawFront,drawOverlay,reset,
  stats(){return {sparks:sparks.length,smoke:smoke.length,labels:labels.length,shockwaves:shockwaves.length}}};
}
