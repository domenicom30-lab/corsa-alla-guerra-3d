// Original destructible steel drums with deterministic world-space chain reactions.
// This module owns only prop state and artwork; combat scoring remains in main.js.
import {firstRectHit} from './collision-order.js';
const POSITIONS=[1260,1388,2980,3120,5700,5834,6860,6985,8080,8215,9030,9164];
const MAX_HP=3;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
let images=null;
export function createExplosiveProps(){
 const props=POSITIONS.map((x,id)=>({id,x,hp:MAX_HP,primed:false,fuse:0,detonated:false,heat:0}));
 function reset(){
  for(const p of props)Object.assign(p,{hp:MAX_HP,primed:false,fuse:0,detonated:false,heat:0});
 }
 function ignite(p,delay=.12){
  if(!p||p.detonated)return false;
  if(p.primed){p.fuse=Math.min(p.fuse,Math.max(0,delay));return false}
  p.hp=0;p.primed=true;p.fuse=Math.max(0,delay);p.heat=1;return true;
 }
 function hit(p,amount=1){
  if(!p||p.primed||p.detonated||!Number.isFinite(amount)||amount<=0)return {hit:false,primed:false};
  p.hp=Math.max(0,p.hp-amount);
  p.heat=1;
  return {hit:true,primed:p.hp===0&&ignite(p,.10)};
 }
 function igniteNear(worldX,radius){
  if(!Number.isFinite(worldX)||!Number.isFinite(radius)||radius<=0)return 0;
  let affected=0;
  for(const p of props)if(!p.detonated&&!p.primed&&Math.abs(p.x-worldX)<=radius){
   if(ignite(p,.08+(p.id%3)*.035))affected++;
  }
  return affected;
 }
 function targets(scroll,ground,H){
  if(!(H>0))return [];
  return props.filter(p=>p.hp>0&&!p.primed&&!p.detonated).map(p=>({
   kind:'barrel',ref:p,x:p.x-scroll,y:ground-H*.074,w:H*.052,h:H*.075
  }));
 }
 function ram(previousWorldX,worldX,velocity,H){
  if(!Number.isFinite(previousWorldX)||!Number.isFinite(worldX)||!Number.isFinite(velocity)||H<=0||Math.abs(velocity)<75)return [];
  const r=[];
  // Swept tank nose prevents tunnelling at low mobile frame rates.
  const dir=Math.sign(velocity);
  const from=previousWorldX+dir*H*.20,to=worldX+dir*H*.20;
  for(const p of props){
   if(p.primed||p.detonated)continue;
   const t=firstRectHit(from,0,to,0,{x:p.x,y:0,w:H*.067,h:1});
   if(t!==null&&ignite(p,.055))r.push(p);
  }
  return r;
 }
 function step(dt,onDetonate=()=>{}){
  if(!Number.isFinite(dt)||dt<=0)return;
  const ready=[];
  for(const p of props){
   p.heat=Math.max(0,p.heat-dt*2.2);
   if(!p.primed||p.detonated)continue;
   p.fuse=Math.max(0,p.fuse-dt);
   if(p.fuse===0){
    p.primed=false;p.detonated=true;
    ready.push(p);
   }
  }
  // Precompute ready set before callbacks to prevent newly ignited drums
  // from exploding in the same simulation step.
  for(const p of ready)onDetonate({x:p.x,id:p.id,points:180});
 }
 function draw(ctx,scroll,ground,H,t){
  if(!(H>0))return;
  if(!images)images=makeFrames();
  if(!images)return;
  const w=H*.118,h=H*.159,viewportWidth=ctx.canvas?.clientWidth||ctx.canvas?.width||Infinity;
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(const p of props){
   const x=p.x-scroll-w*.5;
   if(x<-w||x>viewportWidth+w)continue;
   const frame=p.detonated?3:p.primed?1+Math.floor(t*.8)%2:p.hp<2?1:0;
   ctx.drawImage(images[frame],Math.round(x),Math.round(ground-h),w,h);
   if(p.primed){
    ctx.globalAlpha=.55+.3*Math.sin(t*1.7+p.id);
    ctx.fillStyle='#fff1af';ctx.fillRect(x+w*.46,ground-h*.99,w*.08,h*.13);
    ctx.globalAlpha=1;
   }
  }
  ctx.restore();
 }
 return {props,reset,hit,igniteNear,targets,ram,step,draw};
}
function makeFrames(){
 if(typeof document==='undefined')return null;
 const result=[];
 for(let frame=0;frame<4;frame++){
  const c=document.createElement('canvas');c.width=72;c.height=96;
  const g=c.getContext('2d');if(!g)return null;g.imageSmoothingEnabled=false;
  const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
  if(frame===3){
   // Charred empty drum and fallen copper hoops after destruction.
   rect(7,85,59,8,'#151d1e');rect(12,81,47,5,'#453d31');
   rect(16,74,39,9,'#283033');rect(14,71,36,5,'#6e5441');
   rect(26,66,23,5,'#a36736');
   for(let i=0;i<5;i++)rect(17+i*9,83-(i%2)*5,7,4,i%2?'#7e5b35':'#252d2b');
   result.push(c);continue;
  }
  // Pixel-painted tapered industrial barrel, layered metallic highlights and rust.
  rect(13,11,47,78,'#161f22');rect(17,8,39,7,'#6c807a');
  rect(17,15,39,70,'#374b4c');rect(20,15,8,68,'#869b89');
  rect(29,15,19,68,'#506965');rect(49,15,6,68,'#253636');
  rect(15,11,43,5,'#a4b5a0');rect(18,20,37,4,'#172729');
  rect(17,75,40,7,'#19292b');rect(14,83,44,6,'#95a593');
  rect(21,84,29,3,'#273837');
  for(const y of [27,69]){rect(14,y,44,6,'#1e2b2c');rect(17,y+1,37,2,'#adad90');rect(19,y+4,33,1,'#687c70')}
  // Original amber hazard paint, physically integrated into a corrugated panel.
  rect(28,40,21,21,'#d59b4e');
  rect(32,44,13,13,'#202d2d');
  for(let i=0;i<4;i++){
   rect(29+i*5,40+(i%2)*3,3,4,'#473b2e');
   rect(30+i*5,58-(i%2)*2,3,3,'#eece74');
  }
  rect(35,47,6,7,'#ffcf67');rect(37,43,2,12,'#242e2a');
  for(const [x,y] of [[24,35],[45,35],[25,64],[46,63],[22,18]]){
   rect(x,y,3,3,'#20302f');rect(x,y,1,1,'#edc48b');
  }
  // Age damage / ignition state: scorch marks and animated danger beacon.
  if(frame>0){
   rect(18,34,8,5,'#26312d');rect(47,60,7,10,'#a26235');
   rect(19,52,5,5,'#b7843c');rect(45,22,6,2,'#e8b474');
   if(frame===2){rect(33,3,14,8,'#e97335');rect(37,0,6,9,'#ffda65')}
   else{rect(35,1,11,9,'#f7a944');rect(39,0,3,8,'#fff1a1')}
  }
  result.push(c);
 }
 return result;
}
