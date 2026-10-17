// Lightweight original 2D combat feedback. All particles are screen-space and bounded.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const VALID_KINDS=new Set(['infantry','armor','cover','boss','melee']);
const PALETTE={
 infantry:['#fff0ca','#dfbc91','#987252'],
 armor:['#fcf3cc','#f7c86e','#83b4c0'],
 cover:['#e9d5ad','#a39370','#756d56'],
 boss:['#fff9da','#edb35c','#b3c1af'],
 melee:['#fff8db','#f5c886','#c7935a']
};
export function createCombatImpactFx(){
 const flashes=[],chips=[];
 let seed=0x12345;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 function strike(x,y,{kind='infantry',direction=1,force=1}={}){
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  kind=VALID_KINDS.has(kind)?kind:'infantry';
  const dir=direction<0?-1:1,weight=clamp(Number(force)||1,.4,3);
  const armored=kind==='armor'||kind==='boss';
  const palette=PALETTE[kind],count=kind==='boss'?14:armored?11:kind==='cover'?8:7;
  if(flashes.length>=22)flashes.shift();
  flashes.push({x,y,kind,direction:dir,life:kind==='boss'?.20:.14,ttl:kind==='boss'?.20:.14});
  for(let i=0;i<count;i++){
   const spread=(rnd()-.5)*2.8;
   // Ricochets rebound toward the shooter; softer targets scatter vertically.
   const base=armored?125:kind==='cover'?85:100;
   const speed=base*(.6+rnd()*.9)*weight;
   const vx=(-dir*Math.cos(spread)*(armored?.88:.60)+(rnd()-.5)*.42)*speed;
   const vy=(Math.sin(spread)*.85-.36-rnd()*.32)*speed;
   if(chips.length>=112)chips.shift();
   const ttl=(armored?.26:.22)+rnd()*.23;
   chips.push({x,y,vx,vy,life:ttl,ttl,kind,color:palette[i%3],size:1.4+rnd()*(armored?3.2:2.4)});
  }
  return true;
 }
 function step(dt,cameraDelta=0,ground=Infinity){
  if(!Number.isFinite(dt)||dt<=0)return;
  dt=clamp(dt,0,.05);
  const camera=Number.isFinite(cameraDelta)?cameraDelta:0;
  for(let i=flashes.length-1;i>=0;i--){
   const f=flashes[i];f.x-=camera;f.life-=dt;
   if(f.life<=0)flashes.splice(i,1);
  }
  for(let i=chips.length-1;i>=0;i--){
   const p=chips[i];p.x+=p.vx*dt-camera;p.y+=p.vy*dt;
   p.vy+=650*dt;p.vx*=Math.pow(.93,dt*60);p.life-=dt;
   if(p.y>=ground){p.y=ground;p.vy*= -.22;p.vx*=.5}
   if(p.life<=0)chips.splice(i,1);
  }
 }
 function draw(ctx,W,H,quality='auto'){
  if(!ctx||!(W>0&&H>0))return;
  ctx.save();ctx.imageSmoothingEnabled=false;
  const battery=quality==='battery';
  for(const f of flashes){
   if(f.x< -H*.1||f.x>W+H*.1||f.y<0||f.y>H)continue;
   const a=clamp(f.life/f.ttl,0,1),scale=H*.012*(f.kind==='boss'?1.5:1);
   ctx.globalAlpha=a*.93;
   ctx.fillStyle=f.kind==='infantry'?'#fff5d7':'#fff1b2';
   ctx.fillRect(f.x-scale*.5,f.y-scale*.45,scale,scale*.6);
   // Bright pixel crosses, never oversized circular scenery-obscuring flashes.
   const length=scale*(f.kind==='armor'||f.kind==='boss'?2.9:1.9)*a;
   ctx.fillStyle=f.kind==='cover'?'#dec597':'#f9d58c';
   ctx.fillRect(f.x-f.direction*length*.22,f.y-scale*.18,length,Math.max(1,H*.003));
   ctx.fillRect(f.x-scale*.12,f.y-length*.60,Math.max(1,H*.003),length);
  }
  for(let i=0;i<chips.length;i++){
   if(battery&&i%2!==0)continue;
   const p=chips[i];
   if(p.x< -H*.06||p.x>W+H*.06||p.y<0||p.y>H)continue;
   const a=clamp(p.life/p.ttl,0,1),size=Math.max(1,H*.0026*p.size);
   ctx.globalAlpha=a;ctx.fillStyle=p.color;
   const x=Math.round(p.x),y=Math.round(p.y);
   ctx.fillRect(x,y,size*(p.kind==='armor'||p.kind==='boss'?2.1:1.3),Math.max(1,size*.45));
   if(!battery&&(p.kind==='armor'||p.kind==='boss')){
    ctx.fillStyle='#fff1cf';
    ctx.fillRect(x-Math.sign(p.vx)*size*2,y+size*.3,size*1.3,Math.max(1,size*.28));
   }
  }
  ctx.restore();
 }
 function reset(){flashes.length=0;chips.length=0;seed=0x12345}
 function stats(){return {flashes:flashes.length,chips:chips.length}}
 function snapshot(){return {flashes:flashes.map(({x,y,kind,direction,life})=>({x,y,kind,direction,life})),chips:chips.slice(0,12).map(({x,y,vx,vy,kind})=>({x,y,vx,vy,kind}))}}
 return {strike,step,draw,reset,stats,snapshot};
}
