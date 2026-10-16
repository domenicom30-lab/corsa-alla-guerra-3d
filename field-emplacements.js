// Original enemy gun nests. Deterministic attack cadence and finite sprite cache.
// Coordinates for nests are world-space; projectile positions are screen-space.
import {firstRectHit} from './collision-order.js';

const POSITIONS=[1900,3800,5090,6870,7790,9230];
const FULL_HP=5;
let frames=null;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

export function createFieldEmplacements(){
 const emplacements=POSITIONS.map((x,id)=>({
  id,x,hp:FULL_HP,maxHp:FULL_HP,destroyed:false,
  cooldown:.9+(id%3)*.47,warning:0,burstLeft:0,burstTimer:0,
  facing:-1,muzzle:0,flash:0
 }));
 function reset(){
  for(const e of emplacements)Object.assign(e,{
   hp:FULL_HP,destroyed:false,cooldown:.9+(e.id%3)*.47,
   warning:0,burstLeft:0,burstTimer:0,facing:-1,muzzle:0,flash:0
  });
 }
 function hit(e,damage){
  if(!e||e.destroyed||!Number.isFinite(damage)||damage<=0)
   return {hit:false,killed:false,points:0};
  e.hp=Math.max(0,e.hp-damage);e.flash=.18;
  e.warning=0;e.burstLeft=0;e.burstTimer=0;
  e.cooldown=Math.max(e.cooldown,.7);
  if(e.hp>0)return {hit:true,killed:false,points:0};
  e.destroyed=true;
  return {hit:true,killed:true,points:450,x:e.x,id:e.id};
 }
 function blast(x,radius,damage=5){
  if(!Number.isFinite(x)||!Number.isFinite(radius)||radius<=0)return [];
  const killed=[];
  for(const e of emplacements){
   if(e.destroyed||Math.abs(e.x-x)>radius)continue;
   const result=hit(e,damage);
   if(result.killed)killed.push(result);
  }
  return killed;
 }
 function targets(scroll,ground,H){
  if(!Number.isFinite(scroll)||!(H>0))return [];
  return emplacements.filter(e=>!e.destroyed).map(e=>({
   kind:'emplacement',ref:e,x:e.x-scroll,y:ground-H*.122,w:H*.117,h:H*.13
  }));
 }
 function ram(start,end,speed,H){
  if(![start,end,speed,H].every(Number.isFinite)||H<=0||Math.abs(speed)<90)return [];
  const dir=Math.sign(speed),a=start+dir*H*.20,b=end+dir*H*.20;
  const killed=[];
  for(const e of emplacements){
   if(e.destroyed)continue;
   const t=firstRectHit(a,0,b,0,{x:e.x,y:0,w:H*.12,h:1});
   if(t===null)continue;
   const result=hit(e,FULL_HP);
   if(result.killed)killed.push(result);
  }
  return killed;
 }
 function step(dt,{scroll=0,playerWorldX=0,ground=0,H=0,enemyShots=[],onFire=()=>{}}={}){
  if(!Number.isFinite(dt)||dt<=0||!(H>0))return;
  // Enemy shot budget is shared with infantry and the final armored boss.
  for(const e of emplacements){
   if(e.destroyed)continue;
   e.muzzle=Math.max(0,e.muzzle-dt);
   e.flash=Math.max(0,e.flash-dt);
   const dx=playerWorldX-e.x,range=Math.abs(dx);
   if(range>H*2.1){
    e.warning=0;e.burstLeft=0;e.burstTimer=0;
    e.cooldown=Math.max(e.cooldown,.65);
    continue;
   }
   e.facing=Math.sign(dx)||e.facing;
   if(range<H*.25){
    // Give the player a path to jump over or get behind an emplacement.
    e.warning=0;e.burstLeft=0;e.burstTimer=0;
    e.cooldown=Math.max(e.cooldown,.38);continue;
   }
   if(e.warning>0){
    e.warning=Math.max(0,e.warning-dt);
    if(e.warning===0){e.burstLeft=e.hp<=2?4:3;e.burstTimer=0}
   }else if(e.burstLeft>0){
    e.burstTimer=Math.max(0,e.burstTimer-dt);
    if(e.burstTimer===0){
     if(enemyShots.length<=19){
      const x=e.x-scroll+e.facing*H*.125,y=ground-H*.155;
      enemyShots.push({x,y,vx:e.facing*H*1.23,vy:0,kind:'tracer',life:1.85});
      e.muzzle=.1;onFire({x,y,dir:e.facing});
     }
     e.burstLeft--;
     e.burstTimer=.17;
     if(e.burstLeft===0)e.cooldown=e.hp<=2?1.5:2.25;
    }
   }else{
    e.cooldown=Math.max(0,e.cooldown-dt);
    if(e.cooldown===0)e.warning=e.hp<=2?.49:.64;
   }
  }
 }
 function draw(ctx,scroll,ground,H,phase){
  if(!(H>0))return;
  if(!frames)frames=makeFrames();
  if(!frames)return;
  const w=H*.30,h=H*.205;
  const view=ctx.canvas?.clientWidth||ctx.canvas?.width||Infinity;
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(const e of emplacements){
   const x=e.x-scroll;
   if(x<-w||x>view+w)continue;
   const mode=e.destroyed?3:e.warning>0?1:e.hp<=2?2:0;
   ctx.save();
   ctx.translate(x,ground);
   if(e.facing===-1)ctx.scale(-1,1);
   ctx.drawImage(frames[mode],-w*.5,-h,w,h);
   if(e.flash>0&&!e.destroyed){
    ctx.globalAlpha=clamp(e.flash*3,0,.6);
    ctx.fillStyle='#fff4bd';ctx.fillRect(-w*.26,-h*.76,w*.65,h*.34);ctx.globalAlpha=1;
   }
   if(e.muzzle>0&&!e.destroyed){
    ctx.globalAlpha=clamp(e.muzzle*9,0,1);
    ctx.fillStyle='#ffe8a0';ctx.fillRect(w*.39,-h*.65,w*.13,h*.09);
    ctx.fillStyle='#f6a148';ctx.fillRect(w*.51,-h*.62,w*.1,h*.045);
   }
   ctx.restore();
   if(e.warning>0&&!e.destroyed){
    const pulse=.65+.35*Math.sin(phase*1.5+e.id);
    ctx.globalAlpha=pulse;
    ctx.fillStyle='#ffdc7d';
    ctx.font='900 '+Math.max(14,H*.043)+'px monospace';
    ctx.textAlign='center';
    ctx.fillText('!',x,ground-h-H*.024);
    ctx.globalAlpha=1;
   }
  }
  ctx.restore();
 }
 return {emplacements,reset,hit,blast,targets,ram,step,draw};
}

function makeFrames(){
 if(typeof document==='undefined')return null;
 const imgs=[];
 for(let mode=0;mode<4;mode++){
  const canvas=document.createElement('canvas');canvas.width=176;canvas.height=120;
  const g=canvas.getContext('2d');if(!g)return null;
  g.imageSmoothingEnabled=false;
  const r=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
  const p=(v,c)=>{g.fillStyle=c;g.beginPath();g.moveTo(...v[0]);
   for(let i=1;i<v.length;i++)g.lineTo(...v[i]);
   g.closePath();g.fill()};
  // Dark cast-iron stand, ammo crates and triangular support.
  r(18,91,142,22,'#141f21');
  r(20,91,135,7,'#738070');r(24,102,128,14,'#354641');
  for(let i=0;i<10;i++){
   r(24+i*13,101+(i%2)*3,9,9,i%3===0?'#6a7259':'#4d5e50');
   r(25+i*13,101+(i%2)*3,4,2,'#a1a58a');
  }
  r(33,84,34,16,'#2b3834');r(36,86,28,8,'#a08b5c');
  r(38,89,6,4,'#efe0a4');
  r(41,82,24,4,'#1b2526');
  if(mode===3){
   // The broken metal mount remains in the level as permanent cover debris.
   r(71,80,25,9,'#20292a');r(78,74,11,14,'#88735b');
   p([[83,80],[118,65],[129,75],[99,89]],'#3c514c');
   r(94,84,44,7,'#1c2427');r(100,83,22,3,'#829484');
   r(58,69,20,7,'#9a563e');r(58,76,8,6,'#1f2927');
   imgs.push(canvas);continue;
  }
  // Heavy mechanical body with three distinct armor and recoil planes.
  r(76,52,38,29,'#121f20');r(80,50,34,24,'#435e56');
  r(82,53,28,5,'#a3ae94');r(84,61,24,8,'#263f3d');
  r(79,73,35,8,'#879480');r(81,78,32,4,'#1d2b2b');
  r(79,82,8,9,'#344b41');r(105,82,7,9,'#344b41');
  for(const a of [87,96,105]){r(a,64,2,3,'#e3cfa0');r(a+1,73,2,2,'#192626')}
  // Operator silhouette: separate helmet, breathing scarf, torso and gloves.
  p([[58,53],[63,42],[80,42],[89,50],[88,58],[61,60]],'#1a2927');
  r(62,44,25,10,mode===2?'#725b47':'#6c8370');
  r(66,46,12,3,'#d0c6a0');
  r(59,55,21,8,'#283b38');r(64,57,10,4,'#bcad89');
  r(67,61,23,21,'#3b544a');r(70,65,19,11,'#82917d');
  r(70,77,6,13,'#202e2b');r(83,78,8,13,'#1f2d2b');
  // Water-cooled barrel, muzzle and ammunition band.
  r(107,58,48,15,'#142325');r(110,60,45,9,'#455d5a');
  r(112,61,34,3,'#a5b5a5');r(148,57,13,17,'#1f2c2b');
  r(153,59,4,14,'#9aaa91');r(159,61,6,9,'#253635');
  for(let x=116;x<145;x+=7){r(x,65,2,5,'#263636');r(x,64,2,1,'#dec895')}
  r(91,70,11,5,'#c4a36f');r(89,74,11,5,'#67583e');
  for(let i=0;i<5;i++)r(86-i*4,78+i*3,7,4,i%2?'#ddb46c':'#78603b');
  // Rivets, welded seams and unique bright warning lenses.
  r(107,53,8,5,mode===1?'#ffdb75':'#b79962');
  r(109,54,3,2,mode===1?'#fff4c1':'#382e29');
  r(85,55,3,3,'#dfcfa5');r(82,71,2,3,'#d7b377');
  if(mode===2){
   for(const [x,y] of [[87,58],[94,59],[99,67],[107,76]]){
    r(x,y,7,3,'#26322c');r(x+1,y+1,3,1,'#c28e5c');
   }
   r(104,48,4,6,'#bd673f');
  }
  if(mode===1){
   r(145,56,9,3,'#ffb65a');r(153,53,4,6,'#fff2ae');
   r(105,45,10,4,'#f07a3e');
  }
  imgs.push(canvas);
 }
 return imgs;
}
