// Original hand-authored pixel-character animation: each pose has independent frames.
const COLORS={outline:'#25251e',shadow:'#394638',cloth:'#667751',light:'#a0a77a',helmet:'#596b50',skin:'#d8a17a',skinShade:'#a86e56',boot:'#39352d',metal:'#444d4a',shine:'#a6aaa0'};
const frameCounts={idle:4,run:8,jump:3,fire:4,duck:3};
export const soldierFrameCounts=Object.freeze({...frameCounts});
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
 box(29,torsoY-19,10,2,COLORS.outline);
 box(30,torsoY-18,7,2,COLORS.light);
 box(27,torsoY-11,5,2,COLORS.shadow);
 box(40,torsoY-7,3,2,COLORS.outline);
 const armShift=firing?index%2*3:running?Math.sin(cycle)*4:0;
 limb(39,torsoY+3,45,torsoY+10+armShift,7,COLORS.cloth);
 limb(45,torsoY+10+armShift,51,torsoY+7+armShift,6,COLORS.skin);
 box(44,torsoY+5+armShift,17,5,COLORS.outline);
 box(46,torsoY+6+armShift,16,3,COLORS.metal);
 box(56,torsoY+3+armShift,3,4,COLORS.shine);
 box(48,torsoY+10+armShift,6,4,COLORS.boot);
 box(51,torsoY+6+armShift,3,2,COLORS.shine);
 box(55,torsoY+9+armShift,2,6,COLORS.outline);
 // Equipment, webbing and separate swaying satchel add silhouette depth.
 const packSwing=running?Math.round(Math.cos(cycle)*2):0;
 box(17+packSwing,torsoY+1,10,18,COLORS.outline);
 box(18+packSwing,torsoY+2,8,15,COLORS.shadow);
 box(19+packSwing,torsoY+3,6,4,COLORS.light);
 box(20+packSwing,torsoY+10,5,2,'#b9a879');
 box(27,torsoY+1,6,13,COLORS.shadow);
 box(28,torsoY+4,3,7,COLORS.light);
 // Hand-pixelled material detail: helmet wear, facial features, cloth folds and weapon hardware.
 box(31,torsoY-14,5,1,'#b4b68a');
 box(35,torsoY-12,3,1,'#3d4b3c');
 box(32,torsoY-5,2,1,'#292923');
 box(40,torsoY-3,2,1,'#593d31');
 box(30,torsoY+6,3,2,'#89936a');
 box(33,torsoY+11,2,5,'#414c3b');
 box(38,torsoY+13,3,2,'#a7a37b');
 box(22-stride*.6,frontKnee-3,4,2,'#a0a17b');
 box(39+stride*.5,rearKnee-3,4,2,'#889473');
 box(17-stride,74-(pose==='jump'?10:0),9,1,'#82775b');
 box(42+stride,74-(pose==='jump'?12:0),9,1,'#82775b');
 box(48,torsoY+6+armShift,4,1,'#8d988b');
 box(54,torsoY+8+armShift,6,1,'#202626');
 box(58,torsoY+5+armShift,2,1,'#c3b69a');
 box(20+packSwing,torsoY+5,3,1,'#8c9b72');
 box(19+packSwing,torsoY+14,6,1,'#252d28');
 // High-contrast pixel clusters keep the silhouette readable at mobile scale.
 box(25,torsoY+19,6,2,'#343d30');
 box(37,torsoY+19,6,2,'#343d30');
 if(firing&&index%2===0){box(61,torsoY+4,3,3,'#ffcf66')}
 if(pose==='jump'){box(18,64,5,3,COLORS.boot)}
 g.imageSmoothingEnabled=false;return c;
}
export const soldierFrames={};
export function loadSoldierFrames(){for(const [pose,count] of Object.entries(frameCounts))soldierFrames[pose]=Array.from({length:count},(_,i)=>makeFrame(pose,i))}
export function drawSoldierFrame(ctx,pose,frame,x,y,w,h){const frames=soldierFrames[pose]||soldierFrames.idle;if(!frames)return false;ctx.imageSmoothingEnabled=false;ctx.drawImage(frames[Math.abs(Math.floor(frame))%frames.length],x,y,w,h);return true}
