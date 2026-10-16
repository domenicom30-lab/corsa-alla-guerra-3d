// An original cached four-pose 2D fighter and deterministic damage rules.
// All its flight coordinates are screen-space (not attached to camera scrolling).
const W=256,H=112;
let frames=null;
export function aircraftHitbox(plane,height){
 if(!plane?.active||!(plane.hp>0)||!(height>0))return null;
 return {x:plane.x+height*.142,y:height*.125,w:height*.115,h:height*.049};
}
export function damageAircraft(plane,damage,height){
 if(!plane?.active||!(plane.hp>0)||!Number.isFinite(damage)||damage<=0||!(height>0))
  return {hit:false,killed:false,points:0};
 plane.hp=Math.max(0,plane.hp-damage);plane.hitFlash=.16;
 if(plane.hp>0)return {hit:true,killed:false,points:0};
 plane.active=false;plane.crashTime=1.35;plane.crashY=height*.125;plane.crashAngle=0;
 return {hit:true,killed:true,points:850,x:plane.x+height*.142,y:height*.125};
}
function makeFrames(){
 if(typeof document==='undefined')return null;
 const result=[];
 for(let frame=0;frame<4;frame++){
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const g=c.getContext('2d');if(!g)return null;g.imageSmoothingEnabled=false;
  const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
  const poly=(points,color,stroke='#1b2927')=>{
   g.beginPath();g.moveTo(...points[0]);
   for(let i=1;i<points.length;i++)g.lineTo(...points[i]);
   g.closePath();g.fillStyle=color;g.fill();
   if(stroke){g.lineWidth=3;g.strokeStyle=stroke;g.stroke()}
  };
  // Distinct angular tail, staggered wing planes and metal-rimmed fuselage.
  poly([[23,51],[11,12],[29,9],[62,50],[65,70],[33,72]],'#566b58');
  poly([[45,50],[57,27],[85,31],[72,56]],'#81947d');
  poly([[74,56],[115,15],[157,15],[146,56]],'#344a47');
  poly([[77,53],[120,21],[152,21],[139,52]],'#758e7c',null);
  poly([[95,65],[120,101],[164,101],[153,68]],'#263b3b');
  poly([[102,70],[124,94],[153,94],[142,70]],'#58776d',null);
  poly([[23,48],[69,45],[103,42],[194,41],[226,47],[244,56],[240,66],[217,73],[143,76],[89,68],[32,69]],'#2b3a37');
  poly([[31,50],[110,46],[200,46],[232,55],[217,65],[125,66],[31,60]],'#61766a',null);
  poly([[79,59],[117,55],[180,54],[217,56],[210,61],[100,64]],'#99a995',null);
  rect(37,48,11,13,'#acaa82');rect(50,50,6,9,'#3b5047');
  // Glass canopy, riveted metal, panel seams, dual underwing cannons.
  poly([[157,43],[170,31],[192,33],[207,47],[201,50],[164,50]],'#1e302f');
  poly([[165,44],[175,35],[190,37],[198,45]],'#88b7ad',null);
  rect(173,38,11,2,'#d1ead5');rect(191,43,5,2,'#d1ead5');
  rect(201,52,28,6,'#354540');rect(210,48,7,16,'#293a38');
  rect(230,54,11,7,'#b4a481');rect(240,55,8,4,'#28312c');
  rect(127,75,12,12,'#1d2b2b');rect(130,76,5,7,'#c7be91');
  rect(142,73,11,17,'#253c38');rect(145,76,4,11,'#879b82');
  rect(48,56,13,3,'#e9ce8b');rect(63,57,5,3,'#202927');
  for(const x of [72,88,104,121,138,215]){rect(x,54,3,2,'#1b2828');rect(x,54,1,1,'#c7c6a6')}
  // Custom rank stripes, not symbols from another game.
  rect(112,31,10,3,'#ead39a');rect(114,36,11,3,'#273c37');
  rect(18,26,8,3,'#c9bd93');rect(21,31,8,3,'#334b40');
  // Engine hub plus four discrete spinning-propeller frames.
  if(frame%2===0){rect(243,19,4,72,'#1e2d2c');rect(244,24,2,62,'#c8d5c7')}
  else{rect(244,27,3,54,'#1e2d2c');rect(229,53,24,4,'#c8d5c7')}
  rect(239,52,11,8,'#1b2828');rect(242,54,5,3,'#e9d1a4');
  rect(4+frame*2,52,12,3,'#e78e49');rect(15+frame,50,10,6,'#deb06b');
  result.push(c);
 }
 return result;
}
export function drawAircraft(ctx,plane,height,phase){
 if(!(plane?.active||plane?.crashTime>0)||!(height>0))return false;
 if(!frames)frames=makeFrames();
 if(!frames)return false;
 const w=height*.302,h=height*.132,x=plane.x,y=plane.crashTime>0?plane.crashY:height*.125;
 ctx.save();ctx.imageSmoothingEnabled=false;
 const image=frames[Math.floor(phase)%4];
 if(plane.crashTime>0){
  ctx.translate(x+w*.5,y);ctx.rotate(plane.crashAngle||0);
  ctx.drawImage(image,-w*.5,-h*.5,w,h);
 }else{
  ctx.drawImage(image,x,y-h*.5,w,h);
  if(plane.hitFlash>0){ctx.globalAlpha=Math.min(.6,plane.hitFlash*3);
   ctx.fillStyle='#fff1c0';ctx.fillRect(x+w*.12,y-h*.16,w*.74,h*.32)}
  if(plane.hp<plane.maxHp*.5){ctx.globalAlpha=.48;ctx.fillStyle='#373b35';
   const puff=(phase*7)%1;ctx.fillRect(x-height*(.04+puff*.10),y-height*(.02+puff*.018),height*(.04+puff*.035),height*.032)}
 }
 ctx.restore();return true;
}
