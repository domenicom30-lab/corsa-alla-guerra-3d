// Original hand-drawn side-scroller protagonist. 22 cached poses, no external artwork.
// Canvas shapes are painted once at native 128x152 resolution; gameplay blits a single image.
const frames={};
export const heroFrameCounts=Object.freeze({idle:4,run:8,jump:3,fire:4,duck:3});
const ink='#18211c',olive='#65724e',highlight='#9da981',shadow='#374732',skin='#d7aa7f';
function paintFrame(pose,index){
 const c=document.createElement('canvas');c.width=160;c.height=152;
 const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 g.lineJoin='round';g.lineCap='round';
 const cyclic=index*Math.PI*2/(heroFrameCounts[pose]||4);
 const running=pose==='run',jumping=pose==='jump',ducking=pose==='duck',firing=pose==='fire';
 const stride=running?Math.sin(cyclic)*15:jumping?11:0;
 const bob=running?Math.abs(Math.sin(cyclic))*3:pose==='idle'?Math.sin(cyclic)*1.6:0;
 const crouch=ducking?20:0;
 const recoil=firing?(index%2)*6:0;
 const bodyY=69+bob+crouch;
 const line=(points,color,width=5)=>{
  g.beginPath();g.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)g.lineTo(points[i][0],points[i][1]);
  g.strokeStyle=ink;g.lineWidth=width+5;g.stroke();
  g.strokeStyle=color;g.lineWidth=width;g.stroke();
 };
 const poly=(points,color,stroke=ink,width=3)=>{
  g.beginPath();g.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)g.lineTo(points[i][0],points[i][1]);
  g.closePath();g.fillStyle=color;g.fill();
  if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke()}
 };
 const fillPath=(callback,color,stroke=ink,width=3)=>{
  g.beginPath();callback(g);g.closePath();
  g.fillStyle=color;g.fill();
  if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke()}
 };
 const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h)};
 const oval=(x,y,rx,ry,color)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=color;g.fill()};
 // Rear leg with a separate knee, boot and cloth wrinkle.
 const rightKnee=[79-stride*.35,108+(jumping?-14:0)+bob];
 const rightBoot=[82-stride,139-(jumping?24:0)];
 line([[75,bodyY+36],rightKnee,rightBoot],'#41503b',18);
 poly([[rightBoot[0]-12,rightBoot[1]-5],[rightBoot[0]+7,rightBoot[1]-7],[rightBoot[0]+21,rightBoot[1]+2],[rightBoot[0]+20,rightBoot[1]+7],[rightBoot[0]-13,rightBoot[1]+7]],'#393d31',ink,4);
 rect(rightBoot[0]-7,rightBoot[1]+3,27,3,'#a29b79');
 poly([[rightKnee[0]-11,rightKnee[1]-6],[rightKnee[0]+11,rightKnee[1]-7],[rightKnee[0]+13,rightKnee[1]+4],[rightKnee[0]-8,rightKnee[1]+7]],'#758064');
 rect(rightKnee[0]-5,rightKnee[1]-3,9,2,'#c1b68d');
 // Front leg projects past the jacket hem; alternating movement has articulated boots.
 const leftKnee=[50+stride*.4,107+(jumping?-16:0)+bob];
 const leftBoot=[45+stride,140-(jumping?18:0)];
 line([[53,bodyY+38],leftKnee,leftBoot],'#536048',19);
 poly([[leftBoot[0]-16,leftBoot[1]-7],[leftBoot[0]+7,leftBoot[1]-9],[leftBoot[0]+11,leftBoot[1]+2],[leftBoot[0]+3,leftBoot[1]+8],[leftBoot[0]-20,leftBoot[1]+7]],'#333d32',ink,4);
 rect(leftBoot[0]-17,leftBoot[1]+3,27,3,'#b5ae8c');
 rect(leftBoot[0]-12,leftBoot[1]-3,14,3,'#6f7961');
 poly([[leftKnee[0]-12,leftKnee[1]-7],[leftKnee[0]+8,leftKnee[1]-9],[leftKnee[0]+13,leftKnee[1]+4],[leftKnee[0]-9,leftKnee[1]+6]],'#6c7757');
 rect(leftKnee[0]-5,leftKnee[1]-3,11,2,'#bac09a');
 // Irregular backpack with buckle, pocket flap, strap and dark silhouette.
 fillPath(p=>{p.moveTo(44,bodyY+1);p.bezierCurveTo(26,bodyY-9,23,bodyY+11,29,bodyY+30);p.lineTo(34,bodyY+42);p.lineTo(52,bodyY+40);p.lineTo(57,bodyY+4);},'#3f4a38',ink,4);
 poly([[31,bodyY+12],[49,bodyY+10],[47,bodyY+30],[32,bodyY+32]],'#57654a');
 rect(34,bodyY+19,11,2,'#b4ac87');rect(39,bodyY+18,3,5,'#e1cd9a');
 rect(29,bodyY+34,18,6,'#293528');rect(34,bodyY+36,10,2,'#7f8667');
 // Rolled blanket on top of the pack.
 fillPath(p=>{p.moveTo(30,bodyY+1);p.quadraticCurveTo(34,bodyY-12,48,bodyY-6);p.lineTo(54,bodyY+6);p.quadraticCurveTo(39,bodyY+10,30,bodyY+1)},'#8e8964');
 rect(35,bodyY-3,12,2,'#d0bb91');
 // Flared, rumpled jacket with multiple shadow planes.
 fillPath(p=>{p.moveTo(48,bodyY-12);p.quadraticCurveTo(66,bodyY-23,80,bodyY-11);
 p.lineTo(90,bodyY+14);p.lineTo(82,bodyY+40);
 p.quadraticCurveTo(76,bodyY+49,61,bodyY+49);
 p.lineTo(45,bodyY+44);p.quadraticCurveTo(39,bodyY+23,48,bodyY-12)},olive,ink,5);
 poly([[49,bodyY-9],[63,bodyY-13],[60,bodyY+29],[48,bodyY+39]],'#536247',null);
 poly([[75,bodyY-10],[82,bodyY+1],[86,bodyY+29],[74,bodyY+43],[68,bodyY+34]],shadow,null);
 poly([[52,bodyY+29],[83,bodyY+27],[82,bodyY+35],[54,bodyY+35]],'#2b3a30',null);
 rect(58,bodyY+31,8,4,'#bfb28e');
 // Coat side flap and stitched seams follow running gait.
 const flap=running?Math.round(Math.sin(cyclic)*7):jumping?-7:0;
 poly([[48,bodyY+42],[60,bodyY+47],[51+flap,bodyY+55],[44+flap,bodyY+53]],'#4b5b41');
 poly([[70,bodyY+44],[82,bodyY+39],[85+flap*.5,bodyY+49],[73,bodyY+53]],'#798262');
 for(let k=0;k<4;k++)rect(50+k*6,bodyY+42+(k%2)*2,3,2,k%2?'#343f33':'#acb28d');
 // Webbing and ammo pouches.
 poly([[54,bodyY-9],[58,bodyY-9],[80,bodyY+34],[75,bodyY+34]],'#b2a782',null);
 rect(61,bodyY+25,9,12,'#404c38');rect(62,bodyY+27,7,3,'#919a73');
 rect(73,bodyY+25,8,10,'#333f33');rect(74,bodyY+28,6,2,'#c8b68d');
 poly([[65,bodyY-13],[73,bodyY-15],[77,bodyY-10],[67,bodyY-7]],'#d1c39b',null);
 // Face / collar, big but clearly organic side profile.
 fillPath(p=>{p.moveTo(64,bodyY-37);p.bezierCurveTo(77,bodyY-48,94,bodyY-35,95,bodyY-17);
 p.lineTo(100,bodyY-11);p.lineTo(93,bodyY-7);p.quadraticCurveTo(91,bodyY+1,80,bodyY+1);
 p.lineTo(70,bodyY-6);p.lineTo(65,bodyY-14)},skin,ink,4);
 poly([[67,bodyY-22],[77,bodyY-31],[80,bodyY-8],[72,bodyY-8]],'#b78a67',null);
 rect(90,bodyY-14,5,2,'#6d4a37');rect(91,bodyY-9,4,2,'#e6bc91');
 // Eyebrow, glint in open eye, ear, chin and stubble.
 rect(88,bodyY-25,10,3,'#302e27');rect(91,bodyY-21,5,5,'#faf0dc');
 rect(94,bodyY-20,2,5,'#202825');rect(96,bodyY-21,1,2,'#ffffff');
 oval(67,bodyY-18,5,7,'#be906d');rect(67,bodyY-17,4,2,'#7d533d');
 rect(82,bodyY-6,9,2,'#5f4a3c');rect(86,bodyY-3,8,2,'#ab7359');
 // Soft scarf at throat and an independent wind-blown tail.
 poly([[65,bodyY-8],[80,bodyY-2],[89,bodyY+2],[83,bodyY+9],[67,bodyY+2]],'#d5b36c');
 const scarfSway=running?Math.sin(cyclic)*9:jumping?9:Math.sin(cyclic)*2;
 poly([[67,bodyY+2],[54,bodyY+8],[38-scarfSway,bodyY+2],[53,bodyY+15]],'#b34f35');
 rect(52,bodyY+8,12,2,'#e89563');
 // Domed steel helmet with chipped rim, curved profile and a bright field insignia (not historical).
 fillPath(p=>{p.moveTo(57,bodyY-36);p.quadraticCurveTo(56,bodyY-57,76,bodyY-60);
 p.quadraticCurveTo(94,bodyY-61,101,bodyY-48);
 p.lineTo(103,bodyY-37);p.quadraticCurveTo(87,bodyY-32,57,bodyY-36)},'#3e513d',ink,4);
 fillPath(p=>{p.moveTo(66,bodyY-49);p.quadraticCurveTo(82,bodyY-60,96,bodyY-46);
 p.lineTo(96,bodyY-41);p.quadraticCurveTo(80,bodyY-39,65,bodyY-43)},'#718465',null);
 rect(66,bodyY-54,15,3,'#a6b090');rect(71,bodyY-59,7,3,'#bdc7a5');
 poly([[56,bodyY-40],[103,bodyY-40],[106,bodyY-35],[58,bodyY-33]],'#2c392f',ink,3);
 rect(66,bodyY-37,27,2,'#8e9f77');
 // Oversized padded shooting arm with independent wrist.
 const armY=bodyY+9-(jumping?9:0)+(running?stride*.18:0);
 line([[81,bodyY+4],[91,armY+6],[102-recoil,armY+5]],'#445340',17);
 poly([[81,bodyY-1],[93,bodyY+4],[95,bodyY+13],[84,bodyY+18],[76,bodyY+8]],'#7e8b67');
 rect(88,bodyY+4,5,4,'#bfc5a3');
 oval(104-recoil,armY+6,9,6,'#bd936d');
 rect(105-recoil,armY+3,10,5,'#d4ae83');
 // Deeply shaded original submachine-gun: upper receiver, wooden stock, magazine and barrel.
 const gunX=90-recoil,gunY=armY-1;
 poly([[gunX-22,gunY+1],[gunX-5,gunY],[gunX+5,gunY+7],[gunX-12,gunY+10]],'#3c3c35');
 poly([[gunX-5,gunY-5],[gunX+34,gunY-6],[gunX+38,gunY+3],[gunX-4,gunY+8]],'#282e2d',ink,4);
 rect(gunX+3,gunY-4,26,2,'#b4b8ad');
 rect(gunX+5,gunY+2,22,2,'#626e6b');
 rect(gunX+36,gunY-4,16,4,'#232827');rect(gunX+48,gunY-6,5,8,'#3a4340');
 rect(gunX+51,gunY-4,3,2,'#d2d6ba');
 poly([[gunX+10,gunY+6],[gunX+24,gunY+6],[gunX+22,gunY+21],[gunX+13,gunY+24]],'#30352f');
 rect(gunX+11,gunY+10,10,2,'#8c8e7c');
 rect(gunX-5,gunY-7,12,2,'#a6a69c');rect(gunX-2,gunY-10,4,3,'#434a44');
 // Tiny hand-painted sheen and pixel clusters prevent blocky flat fills.
 const accents=[[60,bodyY+13],[67,bodyY+16],[76,bodyY+21],[54,bodyY+31],[81,bodyY+34],[61,bodyY+39]];
 for(let k=0;k<accents.length;k++)rect(accents[k][0],accents[k][1],k%2?5:3,2,k%2?'#a3ae85':'#d1bf90');
 if(firing&&index%2===0){rect(gunX+51,gunY-8,10,2,'#ffeab4');rect(gunX+56,gunY-5,14,5,'#ffc75e')}
 return c;
}
export function prepareHeroFrames(){
 if(typeof document==='undefined')return;
 for(const [pose,count] of Object.entries(heroFrameCounts)){
  if(frames[pose]?.length===count)continue;
  frames[pose]=Array.from({length:count},(_,index)=>paintFrame(pose,index));
 }
}
export function drawHeroFrame(ctx,pose,frame,x,y,w,h){
 const list=frames[pose]||frames.idle;
 if(!list?.length)return false;
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(list[Math.abs(Math.floor(frame))%list.length],x,y,w,h);
 return true;
}
