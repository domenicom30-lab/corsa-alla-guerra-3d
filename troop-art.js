// Independently painted original enemy sprites: 4 silhouettes, 8 gait frames each.
// Generated once off-screen to keep Android draw cost stable.
const sheets=new Map();
export const troopKinds=['rifleman','assault','grenadier','heavy'];
function build(type,frame){
 const c=document.createElement('canvas');c.width=132;c.height=126;
 const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.lineJoin='round';
 const run=Math.sin(frame*Math.PI/4),stride=run*8,bob=Math.abs(run)*2;
 const colors={rifleman:['#75634b','#ba9b70'],assault:['#51624e','#a0a77e'],grenadier:['#8b7848','#d1ba78'],heavy:['#46565b','#71898a']};
 const [coat,bright]=colors[type],ink='#1d2625',skin='#bb956c';
 const heavy=type==='heavy',w=heavy?48:37,origin=48,bodyY=46+bob;
 const rect=(x,y,ww,hh,color)=>{g.fillStyle=color;g.fillRect(x,y,ww,hh)};
 const stroke=(coords,color,width)=>{g.beginPath();g.moveTo(...coords[0]);for(const p of coords.slice(1))g.lineTo(...p);g.strokeStyle=ink;g.lineWidth=width+5;g.stroke();g.strokeStyle=color;g.lineWidth=width;g.stroke()};
 const shape=(coords,color)=>{g.beginPath();g.moveTo(...coords[0]);for(const p of coords.slice(1))g.lineTo(...p);g.closePath();g.fillStyle=color;g.fill();g.strokeStyle=ink;g.lineWidth=3;g.stroke()};
 const oval=(x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill()};
 // Separated gait and boots (the leg paths never share their moving endpoints).
 stroke([[origin-10,bodyY+26],[origin-13+stride*.4,92],[origin-17+stride,115]],'#555846',14);
 stroke([[origin+9,bodyY+27],[origin+13-stride*.4,93],[origin+10-stride,117]],'#424b43',15);
 shape([[origin-34+stride,110],[origin-15+stride,108],[origin-9+stride,120],[origin-35+stride,120]],'#30332c');
 shape([[origin-3-stride,111],[origin+17-stride,111],[origin+25-stride,122],[origin-4-stride,122]],'#30352e');
 rect(origin-33+stride,116,25,3,'#999781');rect(origin-3-stride,118,27,3,'#a59f83');
 // Equipment hangs behind the torso with separate pack, straps and canteen.
 shape([[origin-28,bodyY-10],[origin-15,bodyY-16],[origin-12,bodyY+34],[origin-34,bodyY+30]],'#37433a');
 rect(origin-31,bodyY+5,15,16,coat);rect(origin-28,bodyY+9,9,3,bright);
 oval(origin-28,bodyY+32,7,9,'#7c7055');rect(origin-35,bodyY+28,10,3,'#252c26');
 // Coat and folds: broad readable silhouette, with physical edge highlights.
 shape([[origin-19,bodyY-18],[origin+10,bodyY-21],[origin+w*.56,bodyY-11],
  [origin+w*.64,bodyY+23],[origin+10,bodyY+39],[origin-20,bodyY+35]],coat);
 shape([[origin-16,bodyY-15],[origin-4,bodyY-18],[origin-5,bodyY+27],[origin-13,bodyY+33]],bright);
 shape([[origin+7,bodyY-17],[origin+14,bodyY-6],[origin+17,bodyY+29],[origin+5,bodyY+32]],'#39443a');
 rect(origin-20,bodyY+24,40,7,'#2b312d');rect(origin-6,bodyY+24,11,6,'#c6b28c');
 for(let k=0;k<3;k++){rect(origin+2+k*7,bodyY+31,6,10,'#353d35');rect(origin+3+k*7,bodyY+33,3,2,'#d1bd87')}
 stroke([[origin-13,bodyY-16],[origin+9,bodyY+27]],'#c0ac85',4);
 // Hand-painted collar, face, open eye and jaw.
 shape([[origin-9,bodyY-27],[origin+13,bodyY-31],[origin+18,bodyY-8],[origin-10,bodyY-11]],skin);
 rect(origin+12,bodyY-22,6,3,'#d5b58a');rect(origin+16,bodyY-17,5,3,'#81583c');
 rect(origin+10,bodyY-26,8,3,ink);rect(origin+13,bodyY-24,3,2,'#fef3d7');
 // Four original helmet silhouettes and distinguishing markings.
 if(heavy){
   oval(origin+3,bodyY-37,25,16,'#36474d');
   rect(origin-22,bodyY-39,53,9,'#29383a');
   rect(origin-16,bodyY-48,29,4,'#9eb4b6');
   rect(origin-12,bodyY-37,29,5,'#232f30');
 }else if(type==='grenadier'){
   oval(origin,bodyY-36,22,15,'#65613c');
   shape([[origin-19,bodyY-38],[origin+24,bodyY-37],[origin+19,bodyY-31],[origin-16,bodyY-31]],'#4c5036');
   rect(origin-14,bodyY-46,15,4,'#bda866');
 }else{
   oval(origin,bodyY-37,22,15,type==='assault'?'#354b3d':'#454b3e');
   rect(origin-23,bodyY-37,49,6,'#2a3430');
   rect(origin-13,bodyY-47,15,3,bright);
 }
 // Weighted arms, multi-piece weapons, magazine and angled stocks.
 stroke([[origin+9,bodyY-8],[origin+18,bodyY+7],[origin+28,bodyY+9]],bright,heavy?17:12);
 oval(origin+27,bodyY+8,8,6,skin);
 if(type==='grenadier'){
   rect(origin+12,bodyY-2,40,11,'#343c36');rect(origin+16,bodyY,26,3,'#a19b6e');
   rect(origin+44,bodyY-6,9,4,'#272e2c');rect(origin+48,bodyY+8,6,12,'#454b3b');
 }else if(heavy){
   rect(origin+7,bodyY-4,58,14,'#263334');rect(origin+13,bodyY-2,43,3,'#a3aea5');
   rect(origin+30,bodyY+11,17,17,'#2c3837');rect(origin+62,bodyY-6,5,18,'#455656');
   rect(origin+64,bodyY-2,12,4,'#232c30');
 }else{
   rect(origin+7,bodyY+1,49,9,'#252f2d');rect(origin+10,bodyY+2,35,2,'#a2a895');
   rect(origin+45,bodyY,21,4,'#29352f');rect(origin+23,bodyY+10,7,17,'#2c342d');
   rect(origin+34,bodyY-3,5,4,'#d0c2a0');
 }
 // Metallic glints, elbow creases and separate chest markings.
 rect(origin-9,bodyY-10,11,2,'#ded0a7');rect(origin-6,bodyY+13,4,2,'#b0b298');
 rect(origin+4,bodyY+8,4,3,'#1c2826');rect(origin+5,bodyY+8,2,2,'#e9c17a');
 return c;
}
export function prepareTroopSprites(){
 if(typeof document==='undefined')return;
 for(const type of troopKinds){
  if(sheets.has(type))continue;
  sheets.set(type,Array.from({length:8},(_,i)=>build(type,i)));
 }
}
export function drawTroop(ctx,e,scroll,H,ground,phase){
 const frames=sheets.get(e.type);
 if(!frames)return false;
 const width=H*(e.type==='heavy'?.23:.185),height=H*(e.type==='heavy'?.28:.245);
 const px=e.x-scroll,dir=e.aim||((e.x>=scroll+innerWidth*.22)?-1:1);
 const f=Math.floor(e.walk+(e.vx?0:phase*.25)+e.phase)%8;
 let ypos=ground-height,drawH=height;
 if(e.stance==='crouch'){drawH=height*.7;ypos=ground-drawH}
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(e.flinch>0){ctx.shadowColor='#fff2c7';ctx.shadowBlur=H*.015}
 if(dir<0){ctx.translate(px+width*.5,0);ctx.scale(-1,1);ctx.drawImage(frames[Math.abs(f)],0,ypos,width,drawH)}
 else{ctx.drawImage(frames[Math.abs(f)],px-width*.5,ypos,width,drawH)}
 ctx.restore();
 ctx.save();
 if(e.windup>0){
  const pulse=.65+.35*Math.sin(phase*.8+e.phase*9);
  ctx.globalAlpha=pulse;
  ctx.fillStyle=e.type==='heavy'?'#ff9b43':'#ffdb85';
  const marker=H*(e.type==='heavy'?.017:.013);
  ctx.fillRect(px-marker*.32,ypos-H*.025,marker*.65,marker*1.55);
  ctx.fillRect(px-marker*.32,ypos-H*.025+marker*1.8,marker*.65,marker*.5);
 }
 if(e.fireFlash>0){
  const x=dir<0?px-width*.60:px+width*.60;
  ctx.fillStyle='#fff0c2';ctx.beginPath();ctx.arc(x,ypos+drawH*.45,H*.017,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffba54';ctx.fillRect(x+dir*H*.013,ypos+drawH*.445,H*.032,H*.005);
 }
 if(e.maxHp>2&&e.alive){
  const pipSize=H*.01,gap=pipSize*.35;
  for(let i=0;i<e.maxHp;i++){
   const x=px-(e.maxHp*(pipSize+gap)-gap)*.5+i*(pipSize+gap);
   ctx.fillStyle=i<e.hp?'#d8bf83':'#3b4840';ctx.fillRect(x,ypos-H*.041,pipSize,pipSize*.43);
  }
 }
 ctx.restore();
 return true;
}
