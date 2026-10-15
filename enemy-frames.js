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
  }
  b(9,12+lift,31,18,'#331b1e');
  b(11,10+lift,27,17,'#7d272a');
  b(13,10+lift,23,5,'#b4493b');
  b(14,17+lift,20,7,'#a12e2c');
  for(let k=0;k<4;k++)b(16+k*5,17+lift,2,8,'#d45c44');
  b(34,15+lift,8,9,'#3b1d20');
  b(36,16+lift,5,5,'#b64c37');
  b(39,17+lift,2,2,'#fff2b2');
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
