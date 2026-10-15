// Original arcade cinematic effects, deterministic and canvas-only (no external downloads).
const rand=n=>{const x=Math.sin(n*127.1+78.233)*43758.5453;return x-Math.floor(x)};
export function drawBattleAtmosphere(ctx,W,H,scroll,phase,ground){
 ctx.save();ctx.imageSmoothingEnabled=false;
 // Distant industrial smoke, with layered opacity and motion.
 for(let i=0;i<12;i++){
  const world=440+i*910,x=world-scroll*.42;
  if(x<-W*.3||x>W*1.3)continue;
  const base=ground-H*(.33+rand(i)*.09);
  for(let j=0;j<8;j++){
   const age=(phase*.004+j/8+i*.17)%1;
   const radius=H*(.018+age*.055),px=x+Math.sin(age*5+i)*H*.035;
   ctx.globalAlpha=(1-age)*.10;
   ctx.fillStyle=j%2?'#c1b6a0':'#283d3d';
   ctx.beginPath();ctx.arc(px,base-age*H*.25,radius,0,Math.PI*2);ctx.fill();
  }
 }
 ctx.globalAlpha=1;
 // Fine atmospheric grit. World-anchored, so it never flickers between frames.
 for(let i=0;i<100;i++){
  const px=((rand(i+311)*W*2-scroll*.15)%(W*2)+W*2)%(W*2)-W*.5;
  const py=H*(.19+rand(i+718)*.54);
  if(px<0||px>W)continue;
  ctx.globalAlpha=.10+rand(i+20)*.14;
  ctx.fillStyle=i%3?'#f3e4bd':'#233b38';
  const size=Math.max(1,Math.round(H*.0015));
  ctx.fillRect(Math.round(px),Math.round(py),size,size);
 }
 ctx.restore();
}
export function drawArcadeForeground(ctx,W,H,scroll,ground,phase){
 ctx.save();ctx.imageSmoothingEnabled=false;
 // Near-camera silhouettes produce an independent third parallax plane.
 const spacing=H*1.38,shift=((scroll*1.23)%spacing+spacing)%spacing;
 for(let i=-1;i<Math.ceil(W/spacing)+2;i++){
  const x=i*spacing-shift;
  if(x>W+H*.2||x<-H*.25)continue;
  const variant=(i+Math.floor(scroll*1.23/spacing)+2000)%3;
  if(variant===0){
   ctx.fillStyle='#202c27';ctx.fillRect(x,ground-H*.16,H*.014,H*.16);
   ctx.fillStyle='#394b3b';ctx.fillRect(x-H*.015,ground-H*.18,H*.045,H*.013);
   ctx.fillStyle='#182923';ctx.fillRect(x-H*.022,ground-H*.15,H*.056,H*.011);
   ctx.fillStyle='#7b7658';ctx.fillRect(x+H*.006,ground-H*.12,H*.007,H*.026);
  }else if(variant===1){
   for(let j=0;j<4;j++){
    ctx.fillStyle=j%2?'#4b4936':'#696148';
    ctx.fillRect(x+j*H*.028,ground-H*(.018+(j%2)*.009),H*.025,H*.012);
   }
  }else{
   ctx.fillStyle='#343d2c';ctx.fillRect(x,ground-H*.075,H*.012,H*.075);
   for(let j=0;j<5;j++){
    const sway=Math.sin(phase*.035+j+x)*H*.003;
    ctx.fillStyle=j%2?'#4f603b':'#788054';
    ctx.fillRect(x-H*.014+j*H*.007+sway,ground-H*(.083+j%3*.009),H*.005,H*.03);
   }
  }
 }
 ctx.restore();
}
export function drawBossDeathCinematic(ctx,W,H,ground,elapsed,x){
 if(elapsed<0||elapsed>2.6)return;
 ctx.save();ctx.imageSmoothingEnabled=false;
 const p=elapsed/2.6;
 for(let i=0;i<22;i++){
  const delay=i*.08;
  if(elapsed<delay)continue;
  const life=Math.min(1,(elapsed-delay)/.52);
  const a=i*2.39996;
  const cx=x+Math.cos(a)*H*(.08+i%5*.045);
  const cy=ground-H*(.16+Math.abs(Math.sin(a))*.3);
  const radius=H*(.018+life*.10);
  ctx.globalAlpha=Math.max(0,1-life);
  ctx.fillStyle=life<.3?'#fff4bb':i%2?'#ffb43f':'#dc4a25';
  ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff0b0';ctx.fillRect(cx-radius*.25,cy-radius*.25,radius*.5,radius*.5);
 }
 ctx.globalAlpha=Math.max(0,.25-p*.25);
 ctx.fillStyle='#fff6dc';ctx.fillRect(0,0,W,H);
 ctx.restore();
}
