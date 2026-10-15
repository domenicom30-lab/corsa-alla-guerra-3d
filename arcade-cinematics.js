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
 // Restrained distant haze: avoid bright square noise that obscures soldiers.
 for(let i=0;i<13;i++){
  const px=((rand(i+311)*W*2-scroll*.15)%(W*2)+W*2)%(W*2)-W*.5;
  const py=H*(.19+rand(i+718)*.54);
  if(px<0||px>W)continue;
  ctx.globalAlpha=.025+rand(i+20)*.025;
  ctx.fillStyle=i%3?'#f3e4bd':'#233b38';
  const size=Math.max(.7,H*.0011);
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

// Original multi-plane 2D battlefront: timber, bunkers, trenches and stones.
const tileNoise=n=>{const v=Math.sin(n*91.73+4.17)*19413.17;return v-Math.floor(v)};
export function drawWarzoneParallax(ctx,W,H,scroll,ground){
 ctx.save();ctx.imageSmoothingEnabled=false;
 const wrap=(value,period)=>((value%period)+period)%period;
 // Smoke-veiled structures move at 20% of camera speed.
 const shift=scroll*.2,step=H*.41,offset=wrap(shift,step);
 for(let i=-1;i<Math.ceil(W/step)+2;i++){
  const index=i+Math.floor(shift/step),x=i*step-offset;
  const v=tileNoise(index+30);
  if(v>.53){
   const h=H*(.11+v*.09);
   ctx.globalAlpha=.4;ctx.fillStyle='#333f38';
   ctx.fillRect(x,ground-H*.12-h,H*.014,h);
   ctx.fillRect(x-H*.038,ground-H*.11-h*.63,H*.11,H*.014);
   ctx.globalAlpha=1;
  }else if(v<.23){
   ctx.fillStyle='#41423a';ctx.fillRect(x,ground-H*.145,H*.16,H*.11);
   ctx.fillStyle='#292d2c';ctx.fillRect(x-H*.02,ground-H*.165,H*.20,H*.027);
   ctx.fillStyle='#202626';ctx.fillRect(x+H*.046,ground-H*.10,H*.07,H*.045);
  }
 }
 // Scarred sand berms move at half the scroll speed.
 const middleShift=scroll*.5,middleStep=H*.37,middleOffset=wrap(middleShift,middleStep);
 for(let i=-1;i<Math.ceil(W/middleStep)+2;i++){
  const index=i+Math.floor(middleShift/middleStep),x=i*middleStep-middleOffset;
  if(tileNoise(index+217)>.4){
   const size=H*(.03+tileNoise(index+103)*.055);
   ctx.fillStyle='#4b4e3d';
   ctx.beginPath();ctx.ellipse(x,ground-H*.017,size*1.65,size*.45,0,Math.PI,0);ctx.fill();
   ctx.fillStyle='#7e775b';
   ctx.fillRect(x-size*.45,ground-H*.025,size*.6,H*.006);
  }
 }
 // World-aligned pixel ground prevents swimming when the camera scrolls.
 ctx.fillStyle='#403b2d';ctx.fillRect(0,ground,W,H-ground);
 ctx.fillStyle='#899078';ctx.fillRect(0,ground,W,H*.012);
 ctx.fillStyle='#626549';ctx.fillRect(0,ground+H*.012,W,H*.024);
 ctx.fillStyle='#32352d';ctx.fillRect(0,ground+H*.038,W,H*.026);
 const rockStep=H*.085,rockOffset=wrap(scroll,rockStep);
 for(let i=-1;i<Math.ceil(W/rockStep)+2;i++){
  const index=i+Math.floor(scroll/rockStep),x=i*rockStep-rockOffset;
  const size=H*(.004+tileNoise(index+817)*.012);
  ctx.fillStyle=tileNoise(index+413)>.5?'#9a8966':'#282c27';
  ctx.fillRect(x,ground+H*(.014+tileNoise(index+729)*.17),size*2,size);
  if(index%5===0){
   ctx.fillStyle='#53664b';ctx.fillRect(x+size,ground-H*.008,size*.7,H*.02);
   ctx.fillStyle='#758759';ctx.fillRect(x-size*.5,ground-H*.012,size*.8,H*.008);
  }
 }
 for(let i=0;i<3;i++){
  ctx.globalAlpha=.13;ctx.fillStyle=i%2?'#e0be83':'#141915';
  ctx.fillRect(0,ground+H*(.08+i*.085),W,H*.009);
 }
 ctx.restore();
}


// Screen-space storm layer: rain, occasional lightning and darkened warzone sky.
const stormDrops=Array.from({length:95},(_,i)=>({x:(i*73.37)%997,y:(i*139.71)%557,len:9+i%11}));
export function drawArcadeStorm(ctx,W,H,seconds,active=true){
 if(!active)return;
 ctx.save();
 ctx.strokeStyle='rgba(180,206,235,.27)';ctx.lineWidth=Math.max(1,H/650);
 ctx.beginPath();
 for(const drop of stormDrops){
  const x=((drop.x+seconds*68)%1000)/1000*W;
  const y=((drop.y+seconds*420)%560)/560*H;
  ctx.moveTo(x,y);ctx.lineTo(x-W*.004,y+H*drop.len/650);
 }
 ctx.stroke();
 const lightning=Math.sin(seconds*1.93)*Math.sin(seconds*2.71);
 if(lightning>.985){ctx.fillStyle='rgba(222,232,255,.16)';ctx.fillRect(0,0,W,H)}
 ctx.restore();
}


// War-torn city backdrop: opaque sky hides the old sunny hills and forests.
export function drawRuinedCity(ctx,W,H,scroll,ground,phase){
 ctx.save();ctx.imageSmoothingEnabled=false;
 const sky=ctx.createLinearGradient(0,0,0,ground);
 sky.addColorStop(0,'#151b25');sky.addColorStop(.58,'#4b3937');sky.addColorStop(1,'#987055');
 ctx.fillStyle=sky;ctx.fillRect(0,0,W,ground);
 ctx.fillStyle='#bb7650';ctx.globalAlpha=.26;
 ctx.beginPath();ctx.arc(W*.77,H*.26,H*.105,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 for(let layer=0;layer<2;layer++){
  const scale=layer===0?.28:.53,unit=H*(layer===0?.085:.125);
  const shift=scroll*scale,first=Math.floor(shift/unit)-2,last=Math.ceil((shift+W)/unit)+2;
  for(let i=first;i<=last;i++){
   const x=Math.floor(i*unit-shift),seed=Math.abs(Math.sin(i*12.9898+layer*78.2));
   const floors=2+Math.floor(seed*4),width=unit*(.76+seed*.45),height=floors*unit*.66;
   const y=ground-height+(layer===0?H*.07:0);
   ctx.fillStyle=layer===0?'#292d32':'#292b2a';ctx.fillRect(x,y,width,height);
   ctx.fillStyle=layer===0?'#42403d':'#55473e';
   ctx.fillRect(x+width*.08,y-H*.018,width*.26,H*.018);
   for(let floor=0;floor<floors;floor++)for(let col=0;col<3;col++){
    const wx=x+width*(.13+col*.27),wy=y+unit*(.12+floor*.63);
    if(wy>ground-H*.035)continue;
    ctx.fillStyle=(i+col+floor)%7===0?'#aa6446':'#141b20';
    ctx.fillRect(wx,wy,width*.12,unit*.18);
   }
   if(i%4===0){ctx.fillStyle='#171e22';ctx.fillRect(x+width*.65,y-H*.13,width*.11,H*.13)}
   if(i%5===0){ctx.fillStyle='#1d2225';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width*.38,y-H*.06);ctx.lineTo(x+width*.6,y);ctx.fill()}
  }
 }
 ctx.fillStyle='#3c332f';ctx.fillRect(0,ground-H*.012,W,H*.02);
 for(let i=0;i<24;i++){
  const x=((i*187-scroll*.8)%(W+H*.2)+(W+H*.2))%(W+H*.2)-H*.1;
  ctx.fillStyle=i%3===0?'#655346':'#332f2d';
  ctx.fillRect(x,ground-H*(.012+(i%4)*.008),H*(.025+i%3*.014),H*.014);
 }
 ctx.restore();
}
