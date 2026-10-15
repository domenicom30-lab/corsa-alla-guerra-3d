// Original hand-authored pixel-character animation: each pose has independent frames.
const COLORS={outline:'#25251e',shadow:'#394638',cloth:'#667751',light:'#a0a77a',helmet:'#596b50',skin:'#d8a17a',skinShade:'#a86e56',boot:'#39352d',metal:'#444d4a',shine:'#a6aaa0'};
const frameCounts={idle:4,run:8,jump:3,fire:4,duck:3};
function makeFrame(pose,index){
 const c=document.createElement('canvas');c.width=64;c.height=80;const g=c.getContext('2d');
 const box=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const limb=(x1,y1,x2,y2,width,color)=>{g.strokeStyle=COLORS.outline;g.lineWidth=width+3;g.lineCap='square';g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()};
 const cycle=index*Math.PI*2/frameCounts[pose];
 const running=pose==='run',crouched=pose==='duck',firing=pose==='fire';
 const stride=running?Math.sin(cycle)*10:0;
 const bounce=running?Math.abs(Math.sin(cycle))*2:pose==='idle'?Math.sin(cycle)*1:0;
 const offset=crouched?14:0;
 const torsoY=33+offset+bounce;
 const frontKnee=running?58-stride*.45:pose==='jump'?52:61;
 const rearKnee=running?58+stride*.45:pose==='jump'?50:61;
 limb(29,torsoY+13,24-stride*.6,frontKnee,9,COLORS.shadow);
 limb(24-stride*.6,frontKnee,19-stride,75-(pose==='jump'?10:0),8,COLORS.cloth);
 limb(37,torsoY+13,40+stride*.5,rearKnee,9,COLORS.shadow);
 limb(40+stride*.5,rearKnee,45+stride,75-(pose==='jump'?12:0),8,COLORS.cloth);
 box(12-stride,73-(pose==='jump'?10:0),16,5,COLORS.boot);
 box(39+stride,73-(pose==='jump'?12:0),15,5,COLORS.boot);
 box(24,torsoY-2,19,23,COLORS.outline);
 box(26,torsoY,15,19,COLORS.cloth);
 box(28,torsoY+3,4,12,COLORS.light);
 box(36,torsoY+4,4,12,COLORS.shadow);
 box(24,torsoY+14,20,5,COLORS.shadow);
 box(25,torsoY+15,18,2,'#b3a47a');
 box(28,torsoY-8,11,9,COLORS.skinShade);
 box(30,torsoY-8,10,8,COLORS.skin);
 box(38,torsoY-5,5,3,COLORS.skinShade);
 box(26,torsoY-16,19,9,COLORS.outline);
 box(28,torsoY-17,16,7,COLORS.helmet);
 box(30,torsoY-16,11,2,COLORS.light);
 box(25,torsoY-10,22,4,COLORS.helmet);
 box(40,torsoY-7,3,2,COLORS.outline);
 const armShift=firing?index%2*3:running?Math.sin(cycle)*4:0;
 limb(39,torsoY+3,45,torsoY+10+armShift,7,COLORS.cloth);
 limb(45,torsoY+10+armShift,51,torsoY+7+armShift,6,COLORS.skin);
 box(44,torsoY+5+armShift,17,5,COLORS.outline);
 box(46,torsoY+6+armShift,16,3,COLORS.metal);
 box(56,torsoY+3+armShift,3,4,COLORS.shine);
 box(48,torsoY+10+armShift,6,4,COLORS.boot);
 box(27,torsoY+1,6,13,COLORS.shadow);
 box(28,torsoY+4,3,7,COLORS.light);
 if(firing&&index%2===0){box(61,torsoY+4,3,3,'#ffcf66')}
 if(pose==='jump'){box(18,64,5,3,COLORS.boot)}
 g.imageSmoothingEnabled=false;return c;
}
export const soldierFrames={};
export function loadSoldierFrames(){for(const [pose,count] of Object.entries(frameCounts))soldierFrames[pose]=Array.from({length:count},(_,i)=>makeFrame(pose,i))}
export function drawSoldierFrame(ctx,pose,frame,x,y,w,h){const frames=soldierFrames[pose]||soldierFrames.idle;if(!frames)return false;ctx.imageSmoothingEnabled=false;ctx.drawImage(frames[Math.abs(Math.floor(frame))%frames.length],x,y,w,h);return true}
