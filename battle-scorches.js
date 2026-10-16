// Original residual battlefield damage: animated ember rings and persistent char marks.
// World-space, capped, resettable, single four-frame cached sprite. No offscreen loops.
const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
let pictures=null;
export function createBattleScorches(limit=22){
 const marks=[];
 let age=0,seq=0;
 function mark(worldX,y,ground,H,intensity=1){
  if(![worldX,y,ground,H,intensity].every(Number.isFinite)||H<=0)return false;
  // Aerial explosions cannot scorch floating sky.
  if(y<ground-H*.31||y>ground+H*.10)return false;
  const width=H*cap(.12+intensity*.11,.14,.39);
  if(marks.some(m=>Math.abs(m.x-worldX)<width*.42&&m.age<1.5))return false;
  if(marks.length>=limit)marks.shift();
  marks.push({x:worldX,ground,w:width,age:0,ttl:12+intensity*3,index:seq++%4});
  return true;
 }
 function step(dt){
  if(!Number.isFinite(dt)||dt<=0)return;
  age+=dt;
  for(let i=marks.length-1;i>=0;i--){
   const m=marks[i];m.age+=dt;
   if(m.age>=m.ttl)marks.splice(i,1);
  }
 }
 function draw(ctx,scroll,W,H){
  if(!(H>0)||!Number.isFinite(scroll))return;
  if(pictures===null)pictures=renderFrames();
  if(!pictures)return;
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(const m of marks){
   const x=m.x-scroll;
   if(x<-m.w||x>W+m.w)continue;
   const fade=cap((m.ttl-m.age)/3,0,1),entrance=cap(m.age/.14,0,1);
   ctx.globalAlpha=fade*.73*entrance;
   ctx.drawImage(pictures[m.index],Math.round(x-m.w*.5),Math.round(m.ground-H*.024),
    Math.round(m.w),Math.max(3,Math.round(m.w*.22)));
   if(m.age<1.25){
    ctx.globalAlpha=cap(1-m.age/1.25,0,.7);
    const pulse=H*(.0015+Math.sin(m.age*19+m.index)*.001);
    ctx.fillStyle='#e18e43';
    for(let i=0;i<3;i++)
     ctx.fillRect(Math.round(x+(i-1)*m.w*.16),Math.round(m.ground-H*.020-i%2*H*.006),
      Math.max(1,pulse*(i+1)),Math.max(1,H*.004));
   }
  }
  ctx.restore();
 }
 function reset(){marks.length=0;age=0;seq=0}
 return {mark,step,draw,reset,
  snapshot:()=>marks.map(m=>({x:m.x,age:m.age,ttl:m.ttl})),
  stats:()=>({marks:marks.length,max:limit})};
}
function renderFrames(){
 if(typeof document==='undefined')return null;
 const frames=[];
 for(let i=0;i<4;i++){
  const c=document.createElement('canvas');c.width=160;c.height=36;
  const g=c.getContext('2d');if(!g)return null;
  g.imageSmoothingEnabled=false;
  // Three concentric patchy rings: soot, dark soil, hot copper and cracks.
  const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
  for(let k=0;k<44;k++){
   const t=k*2.39996+i*.31,rad=(k%5+2)*9.3;
   const x=80+Math.cos(t)*rad*1.42,y=18+Math.sin(t)*rad*.24;
   const w=3+(k%4)*4,h=2+(k%3);
   const color=k%5===0?'#c27b43':k%3===0?'#1a2220':k%2===0?'#3a3027':'#65503a';
   rect(Math.round(x),Math.round(y),w,h,color);
  }
  for(let k=0;k<20;k++){
   const x=30+((k*37+i*13)%99),y=12+((k*11+i*3)%14);
   rect(x,y,4+k%3,1+k%2,k%6===0?'#d3924f':'#252926');
  }
  frames.push(c);
 }
 return frames;
}
