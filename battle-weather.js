// Stage-specific 2D environmental effects, deliberately lightweight on Android.
// The original illustrated backgrounds remain untouched: this is atmosphere,
// not an opaque replacement screen or a reused full-screen rain effect.
const wave=n=>{const x=Math.sin(n*92.71+47.62)*43711.17;return x-Math.floor(x)};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const themes=Object.freeze([
 {name:'dust',tint:'#e2bb82',fg:'#ddc79b'},
 {name:'embers',tint:'#c57b56',fg:'#ffc171'},
 {name:'sparks',tint:'#b6a37e',fg:'#f7c07c'},
 {name:'rain',tint:'#8cacc6',fg:'#a7cbdc'}
]);
export const battlefieldWeatherForStage=stage=>themes[Math.max(0,Math.min(3,Math.floor(stage)||0))].name;
export function weatherParticleCount(quality='auto',layer='back'){
 const base=quality==='battery'?12:quality==='high'?47:28;
 return layer==='front'?Math.max(3,Math.round(base*.44)):base;
}
export function drawBattleWeather(ctx,W,H,scroll,ground,seconds,stage,quality='auto',layer='back'){
 if(!Number.isFinite(W)||!Number.isFinite(H)||W<=0||H<=0||
    !Number.isFinite(scroll)||!Number.isFinite(seconds)||!Number.isFinite(ground))return 0;
 const n=Math.max(0,Math.min(3,Math.floor(stage)||0)),style=themes[n];
 const front=layer==='front',count=weatherParticleCount(quality,layer);
 const pixel=Math.max(1,H*.003),alpha=front?.26:.18;
 ctx.save();ctx.imageSmoothingEnabled=false;
 let rendered=0;
 if(!front){
  ctx.globalAlpha=n===0?.029:n===1?.043:n===2?.037:.045;
  ctx.fillStyle=style.tint;ctx.fillRect(0,0,W,ground);
 }
 for(let i=0;i<count;i++){
  const seed=23.7+i*1.713+n*101.3;
  const slow=wave(seed*2.73),offset=wave(seed*5.17);
  const dx=(n===0?.12:n===1?.19:n===2?.24:.42)*H;
  const fall=n===0?18:n===1?-33:n===2?-52:390;
  // The negative modulo is normalized so particle positions never jump
  // during fast scrolling or on a page resumed after backgrounding.
  const span=W+H*.16;
  const base=wave(seed*7.1)*span;
  const px=((base+seconds*dx*(.42+slow)+scroll*(front?-.016:-.009))%span+span)%span-H*.08;
  const vertical=H*.68;
  const py=((offset*vertical+seconds*fall*(.58+slow*.6))%vertical+vertical)%vertical;
  if(px<0||px>W||py>ground-H*.015)continue;
  ctx.globalAlpha=alpha*(.6+wave(seed+11)*.7);
  if(n===0){
   // Low woodland dust and drifting small seeds, not oversized trees.
   ctx.fillStyle=i%4===0?'#a8b99b':'#ead7ac';
   ctx.fillRect(Math.round(px),Math.round(py),pixel*(i%4===0?1.5:.7),pixel*.7);
  }else if(n===1){
   ctx.fillStyle=i%5===0?'#fac66e':i%3===0?'#d47b43':'#c0b4a2';
   const size=pixel*(i%5===0?1.1:.6);
   ctx.fillRect(Math.round(px),Math.round(py),size,size);
   if(i%5===0){ctx.fillStyle='#a84430';ctx.fillRect(px+pixel*.5,py+pixel*.8,pixel*.55,pixel*.55)}
  }else if(n===2){
   ctx.fillStyle=i%3?'#e6a763':'#fcdfae';
   ctx.fillRect(Math.round(px),Math.round(py),pixel*(1.2+slow),pixel*.72);
   if(i%4===0){
    ctx.fillStyle='#bc673f';
    ctx.fillRect(px-pixel*(1+slow*2),py+pixel*.6,pixel*(1+slow),pixel*.5);
   }
  }else{
   // Fortress rain: a single small batch rather than 95 strokes every frame.
   ctx.strokeStyle=i%3===0?'#c3d4d7':'#789ab0';
   ctx.lineWidth=Math.max(.6,H*.0015);
   ctx.beginPath();ctx.moveTo(px,py);
   ctx.lineTo(px-H*.007*(1+slow),py+H*.020*(.7+slow*.5));ctx.stroke();
  }
  rendered++;
 }
 if(front&&n>0){
  // Ground glints are anchored to camera offset, not screen x, avoiding
  // the sliding-floor illusion that plagued earlier versions.
  const grid=H*.185,countGround=Math.ceil(W/grid)+2;
  for(let i=-1;i<countGround;i++){
   const world=i+Math.floor(scroll/grid),x=i*grid-(scroll%grid);
   const k=wave(world*91.13+stage*22);
   if(k<.50)continue;
   ctx.globalAlpha=.08+k*.14;ctx.fillStyle=style.fg;
   const y=ground+H*(.016+k*.016);
   ctx.fillRect(Math.round(x),Math.round(y),H*(.014+k*.023),Math.max(1,pixel*.55));
  }
 }
 ctx.restore();
 return rendered;
}
