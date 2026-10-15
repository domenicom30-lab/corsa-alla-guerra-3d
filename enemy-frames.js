// Original eight-frame enemy animation, drawn on a small pixel canvas.
const frames=[];
export function prepareEnemyFrames(){
 if(frames.length)return;
 for(let i=0;i<8;i++){
  const c=document.createElement('canvas');c.width=48;c.height=40;
  const g=c.getContext('2d'),s=Math.sin(i*Math.PI/4),lift=Math.round(Math.abs(s)*2);
  const b=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h)};
  // Four pairs of independently moving insect legs.
  for(let k=0;k<4;k++){
   const x=9+k*9,phase=(k%2?1:-1)*s;
   b(x-8,23+lift+Math.round(phase*3),10,3,'#4c171b');
   b(x+2,25+lift-Math.round(phase*3),11,3,'#4c171b');
   b(x-7,27+lift+Math.round(phase*3),3,8,'#822e2b');
   b(x+11,28+lift-Math.round(phase*3),3,7,'#822e2b');
   // Independently animated foreleg tips and contact highlights.
   const leftStep=Math.round(phase*3),rightStep=Math.round(-phase*3);
   b(x-9+leftStep,33+lift+Math.max(0,leftStep),6,2,'#3c1c22');
   b(x+10+rightStep,34+lift+Math.max(0,rightStep),6,2,'#3c1c22');
   b(x-7+leftStep,34+lift+Math.max(0,leftStep),3,1,'#dc7d55');
   b(x+12+rightStep,35+lift+Math.max(0,rightStep),3,1,'#dc7d55');
  }
  b(9,12+lift,31,18,'#331b1e');
  b(11,10+lift,27,17,'#7d272a');
  b(13,10+lift,23,5,'#b4493b');
  b(14,17+lift,20,7,'#a12e2c');
  for(let k=0;k<4;k++)b(16+k*5,17+lift,2,8,'#d45c44');
  b(34,15+lift,8,9,'#3b1d20');
  b(36,16+lift,5,5,'#b64c37');
  b(39,17+lift,2,2,'#fff2b2');
  // Eight distinct gait poses add original shell facets, moving highlights and antennae.
  const gait=[0,2,4,2,0,-2,-4,-2][i];
  b(17+gait,13+lift,10,2,'#e28b60');
  b(23-gait,23+lift,7,2,'#632127');
  b(30+gait,14+lift,5,2,'#d96649');
  b(38+gait,7+lift,2,7,'#58252a');
  b(38+gait,6+lift,3,2,'#dc7651');
  b(39,22+lift,4,2,'#e2a270');
  // A migrating shell glint makes all eight authored frames visually distinct.
  b(15+i*3,20+lift,3,2,'#f1b077');
  b(5,17+lift,7,3,'#8b3030');
  b(7,10+lift,3,8,'#442126');
  b(36,8+lift,3,7,'#442126');
  frames.push(c);
 }
}
export function drawEnemyFrame(ctx,frame,x,y,w,h){
 if(!frames.length)return false;
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(frames[Math.abs(Math.floor(frame))%frames.length],x,y,w,h);
 return true;
}


// Original 8-frame animated enemy riflemen, drawn once to cached canvases.
const sentryFrames=[];
export function prepareSentryFrames(){
 if(sentryFrames.length)return;
 for(let i=0;i<8;i++){
  const c=document.createElement('canvas');c.width=64;c.height=92;
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const box=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h)};
  const polygon=(pts,color)=>{g.beginPath();g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(...p);g.closePath();g.fillStyle=color;g.fill()};
  const gait=Math.sin(i*Math.PI/4),step=Math.round(gait*8),bob=Math.round(Math.abs(gait)*2);
  const body='#6b5949',dark='#28272a',light='#a49374',skin='#c49b76';
  polygon([[25,52+bob],[37,54+bob],[29+step,76],[19+step,84],[12+step,82],[21,62]],dark);
  polygon([[34,54+bob],[44,53+bob],[48-step,78],[55-step,85],[39-step,85],[32,65]],'#423b32');
  box(10+step,80,17,6,'#242423');box(40-step,81,15,5,'#282625');
  box(19+step,78,5,2,light);box(42-step,81,7,2,light);
  polygon([[20,27+bob],[30,21+bob],[46,28+bob],[47,52+bob],[39,61+bob],[21,57+bob],[16,46+bob]],dark);
  polygon([[23,28+bob],[31,24+bob],[43,29+bob],[43,51+bob],[35,56+bob],[24,53+bob]],body);
  box(23,37+bob,8,12,'#857663');box(31,37+bob,9,12,'#4e4539');
  box(20,52+bob,25,5,dark);box(28,53+bob,6,3,'#b8a17a');
  polygon([[24,28+bob],[27,28+bob],[40,48+bob],[37,50+bob]],'#c4ad7e');
  box(17,33+bob,7,19,dark);box(18,35+bob,6,15,'#655a49');
  box(25,46+bob,5,8,'#342f2c');box(35,45+bob,6,8,'#302e2a');
  box(28,15+bob,16,16,'#8a654c');box(30,17+bob,13,12,skin);
  box(41,23+bob,5,3,'#a77959');box(37,21+bob,4,2,dark);
  polygon([[25,15+bob],[27,9+bob],[35,6+bob],[46,9+bob],[49,16+bob],[50,20+bob],[24,20+bob]],dark);
  polygon([[27,14+bob],[32,9+bob],[42,10+bob],[47,16+bob]],'#525347');
  box(24,18+bob,27,4,'#35372f');box(30,12+bob,12,2,'#85836c');
  box(43,31+bob,8,18,'#3a3a33');box(46,43+bob,12,7,body);
  box(49,45+bob,8,4,skin);box(42,37+bob,21,5,dark);
  box(48,38+bob,16,2,'#89938c');box(57,41+bob,7,2,'#bab7a5');
  box(51,42+bob,5,10,dark);box(53,44+bob,3,5,'#6a6960');
  if(i%4===0)box(61,36+bob,3,2,'#e8b35e');
  sentryFrames.push(c);
 }
}
export function drawSentryFrame(ctx,frame,x,y,w,h,facing=-1){
 if(!sentryFrames.length)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(facing<0){ctx.translate(x+w,0);ctx.scale(-1,1);x=0}
 ctx.drawImage(sentryFrames[Math.abs(Math.floor(frame))%sentryFrames.length],x,y,w,h);
 ctx.restore();return true;
}
