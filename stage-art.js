// Four original connected 2D battle environments. Foreground actors never become 3D.
const noise=n=>{const x=Math.sin(n*117.318+7.73)*43141.47;return x-Math.floor(x)};
const themes=[
 {name:'FORESTA DI CONFINE',from:0},
 {name:'VILLAGGIO IN ROVINA',from:2350},
 {name:'DISTRETTO INDUSTRIALE',from:5450},
 {name:'FORTEZZA DI FERRO',from:8250}
];
export const STAGES=Object.freeze(themes.map(x=>({...x})));
export function stageAt(scroll){let index=0;for(let i=1;i<themes.length;i++)if(scroll>=themes[i].from)index=i;return index}
function paintSky(ctx,W,H,ground,night){
 const g=ctx.createLinearGradient(0,0,0,ground);
 if(night===1){g.addColorStop(0,'#272e3a');g.addColorStop(.55,'#645e59');g.addColorStop(1,'#af8b6c')}
 if(night===2){g.addColorStop(0,'#1c2834');g.addColorStop(.63,'#596267');g.addColorStop(1,'#aa835b')}
 if(night===3){g.addColorStop(0,'#0f192b');g.addColorStop(.6,'#293745');g.addColorStop(1,'#685445')}
 ctx.fillStyle=g;ctx.fillRect(0,0,W,ground);
 ctx.save();ctx.fillStyle=night===3?'#c6d3c6':'#e9a36c';ctx.globalAlpha*=night===3?.5:.3;
 ctx.beginPath();ctx.arc(W*.8,H*.19,H*(night===3?.05:.09),0,Math.PI*2);ctx.fill();ctx.restore();
}
function village(ctx,W,H,scroll,ground,phase){
 paintSky(ctx,W,H,ground,1);
 const width=H*.29,shift=scroll*.28;
 for(let i=Math.floor(shift/width)-3;i<=Math.ceil((shift+W)/width)+2;i++){
  const x=i*width-shift,t=noise(i+201),h=H*(.22+t*.18);
  ctx.fillStyle=t>.57?'#41443f':'#333e43';ctx.fillRect(x,ground-h,width*(.85+t*.5),h);
  ctx.fillStyle='#1e292d';ctx.beginPath();
  ctx.moveTo(x-H*.015,ground-h);ctx.lineTo(x+width*.17,ground-h-H*.08);
  ctx.lineTo(x+width*.52,ground-h-H*.01);ctx.lineTo(x+width*.8,ground-h-H*.055);
  ctx.lineTo(x+width*.94,ground-h);ctx.closePath();ctx.fill();
  ctx.fillStyle='#141f23';
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){
   if(noise(i*13+row*3+col)<.16)continue;
   const wx=x+width*(.1+col*.23),wy=ground-h+H*(.04+row*.078);
   if(wy<ground-H*.035){ctx.fillRect(wx,wy,H*.029,H*.046);
    if(noise(i*8+row+col)>.85){ctx.fillStyle='#bd8055';ctx.fillRect(wx+3,wy+4,H*.010,H*.023);ctx.fillStyle='#141f23'}}
  }
  if(i%4===0){
   ctx.fillStyle='#585e54';ctx.fillRect(x+width*.83,ground-h-H*.11,H*.025,H*.11);
   ctx.fillStyle='#232d2a';ctx.fillRect(x+width*.81,ground-h-H*.12,H*.06,H*.021);
  }
 }
 // Separately scrolling closer ruined facades and a faint window ember.
 const near=H*.8,offset=((scroll*.55)%near+near)%near;
 for(let j=-1;j<Math.ceil(W/near)+2;j++){
  const index=j+Math.floor(scroll*.55/near),x=j*near-offset;
  if(index%3===0){ctx.fillStyle='#514b3e';ctx.fillRect(x,ground-H*.17,H*.19,H*.17);
   ctx.fillStyle='#262b2a';ctx.fillRect(x+H*.034,ground-H*.125,H*.065,H*.087);
   ctx.fillStyle='#d2b18a';ctx.fillRect(x+H*.044,ground-H*.119,H*.004,H*.077)}
 }
}
function factory(ctx,W,H,scroll,ground,phase){
 paintSky(ctx,W,H,ground,2);
 const u=H*.43,shift=scroll*.19;
 for(let i=Math.floor(shift/u)-2;i<=Math.ceil((shift+W)/u)+2;i++){
  const x=i*u-shift,h=H*(.18+noise(i+311)*.22);
  ctx.fillStyle='#293439';ctx.fillRect(x,ground-h,u*.9,h);
  ctx.fillStyle='#47565a';ctx.fillRect(x,ground-h,u*.86,H*.016);
  for(let j=0;j<3;j++){
   const bx=x+H*(.04+j*.115),bh=H*(.2+noise(i*3+j)*.32);
   ctx.fillStyle=j%2?'#3c4749':'#242e33';ctx.fillRect(bx,ground-h-bh,H*.035,bh);
   ctx.fillStyle='#5f6261';ctx.fillRect(bx-H*.004,ground-h-bh,H*.043,H*.008);
   const smoke=H*(.04+noise(i+j)*.025),drift=(phase*.23+i*13+j*7)%36;
   for(let k=0;k<3;k++){
    ctx.save();ctx.globalAlpha*=.09+noise(i+j+k)*.07;ctx.fillStyle='#c2bbae';
    ctx.beginPath();ctx.arc(bx+Math.sin(phase*.03+k)*H*.024,ground-h-bh-smoke-(drift+k*12)*H*.009,H*(.03+k*.02),0,Math.PI*2);ctx.fill();ctx.restore()
   }
  }
  ctx.fillStyle='#97724c';
  for(let p=0;p<6;p++)ctx.fillRect(x+H*(.03+p*.05),ground-h+H*.03,H*.024,H*.037);
 }
 const steel=H*.52,dx=((scroll*.61)%steel+steel)%steel;
 for(let i=-1;i<Math.ceil(W/steel)+2;i++){
  const x=i*steel-dx;
  ctx.fillStyle='#2b393b';ctx.fillRect(x,ground-H*.16,H*.037,H*.16);
  ctx.fillStyle='#566568';ctx.fillRect(x-H*.01,ground-H*.165,H*.058,H*.018);
  ctx.strokeStyle='#465451';ctx.lineWidth=Math.max(2,H*.009);
  ctx.beginPath();ctx.moveTo(x,ground-H*.13);ctx.lineTo(x+steel,ground-H*.07);
  ctx.moveTo(x+steel,ground-H*.13);ctx.lineTo(x,ground-H*.07);ctx.stroke();
 }
}
function fortress(ctx,W,H,scroll,ground,phase){
 paintSky(ctx,W,H,ground,3);
 const u=H*.65,shift=scroll*.17;
 for(let i=Math.floor(shift/u)-2;i<=Math.ceil((shift+W)/u)+2;i++){
  const x=i*u-shift;
  ctx.fillStyle='#222e36';ctx.fillRect(x,ground-H*.39,u*.91,H*.39);
  ctx.fillStyle='#516066';ctx.fillRect(x,ground-H*.4,u*.9,H*.02);
  for(let j=0;j<6;j++){
   const xx=x+j*(u*.9)/6;
   ctx.fillStyle='#27353a';ctx.fillRect(xx,ground-H*.44,u*.1,H*.065);
   ctx.fillStyle='#a59678';ctx.fillRect(xx+H*.005,ground-H*.44,H*.007,H*.013);
  }
  ctx.fillStyle='#121f27';ctx.fillRect(x+H*.13,ground-H*.27,H*.22,H*.25);
  ctx.fillStyle='#869193';ctx.fillRect(x+H*.11,ground-H*.28,H*.26,H*.012);
  ctx.fillStyle='#7e6143';ctx.fillRect(x+H*.19,ground-H*.17,H*.052,H*.014);
  for(let j=0;j<5;j++){
   const y=ground-H*(.32-j*.068);ctx.fillStyle='#647276';
   ctx.fillRect(x+H*.013,y,H*.085,H*.01);
  }
 }
 // Searchlight beams pulse from the fortified horizon, behind foreground units.
 ctx.save();ctx.globalAlpha=.07+.02*Math.sin(phase*.09);ctx.fillStyle='#d9d9b3';
 for(let i=0;i<4;i++){
  const x=W*(i+.3)/4+Math.sin(phase*.06+i)*H*.08;
  ctx.beginPath();ctx.moveTo(x,ground-H*.4);ctx.lineTo(x-H*.21,0);
  ctx.lineTo(x+H*.15,0);ctx.fill();
 }
 ctx.restore();
}
export function drawStageBackdrop(ctx,W,H,scroll,ground,phase){
 const index=stageAt(scroll);if(index===0)return;
 ctx.save();
 const from=themes[index].from,fade=Math.min(1,(scroll-from)/300);
 const paint=(kind)=>{if(kind===1)village(ctx,W,H,scroll,ground,phase);else if(kind===2)factory(ctx,W,H,scroll,ground,phase);else fortress(ctx,W,H,scroll,ground,phase)};
 if(index>1)paint(index-1);
 ctx.globalAlpha=fade;paint(index);
 ctx.restore();
}
export function drawStageMarker(ctx,W,H,scroll,ground){
 const index=stageAt(scroll),start=themes[index].from;
 if(index===0||scroll>start+W*1.5)return;
 const x=start-scroll+W*.64;if(x<-H*.2||x>W+H*.2)return;
 ctx.save();ctx.translate(x,ground);const u=H*.012;
 ctx.fillStyle='#2c3630';ctx.fillRect(-2*u,-18*u,4*u,18*u);
 ctx.fillStyle='#bda87e';ctx.fillRect(-12*u,-18*u,24*u,7*u);
 ctx.fillStyle='#2a3029';ctx.fillRect(-11*u,-17*u,22*u,5*u);
 ctx.textAlign='center';ctx.fillStyle='#ffdf9b';ctx.font='bold '+Math.max(10,H*.021)+'px system-ui';
 ctx.fillText('ZONA '+(index+1),0,-13*u);ctx.restore();
}
