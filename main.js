import './style.css';

// Corsa alla Guerra 2.5D — canvas renderer with perspective projection.
// All artwork can be replaced by transparent pre-rendered PNG/WebP sprites.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const message = document.getElementById('message');
const stats = document.getElementById('stats');
const lanes = [-1, 0, 1];
let lane = 1, distance = 0, score = 0, health = 3, running = false;
let jumping = false, jumpTime = 0, ducking = false, paused = false, last = 0, worldShift = 0;
let W = 0, H = 0, dpr = 1;
const ASSETS = {
  background: './assets/2d/forest-background.webp',
  soldier: './assets/2d/soldier-back.webp',
  tree: './assets/2d/spruce.webp',
  sandbags: './assets/2d/sandbags.webp',
  crate: './assets/2d/crate.webp',
  road: './assets/2d/muddy-road.webp'
};
const images = {};
for (const [key, url] of Object.entries(ASSETS)) {
  const img = new Image();
  img.onload = () => { images[key] = img; };
  img.onerror = () => { /* offline fallback remains playable */ };
  img.src = url;
}
function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const rand = (n) => { const x = Math.sin(n * 127.1 + 78.233) * 43758.5453; return x - Math.floor(x); };
const objects = Array.from({ length: 80 }, (_, i) => ({
  depth: i * 22 + 18,
  side: i % 2 ? -1 : 1,
  type: i % 5 === 0 ? 'sandbags' : 'tree',
  seed: i
}));
const obstacles = Array.from({ length: 18 }, (_, i) => ({
  depth: 90 + i * 72,
  lane: Math.floor(rand(i + 37) * 3),
  hit: false
}));
function horizon() { return H * 0.34; }
function projection(depth) {
  const t = 1 / (1 + Math.max(0, depth) * 0.017);
  return { t, y: horizon() + (H * 0.57) * t, roadHalf: W * (0.045 + 0.57 * t) };
}
function roadX(laneIndex, depth) {
  const p = projection(depth);
  return W * 0.5 + (laneIndex - 1) * p.roadHalf * 0.58;
}
function drawImageContain(img, x, bottom, width, height) {
  if (!img) return false;
  ctx.drawImage(img, x - width / 2, bottom - height, width, height);
  return true;
}
function backdrop() {
  if (images.background) {
    const img = images.background;
    const scale = Math.max(W / img.width, H / img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    return;
  }
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#62727b'); sky.addColorStop(0.39, '#b3ada0'); sky.addColorStop(1, '#4c4d39');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // Distant forest layers with atmospheric desaturation.
  for (let layer = 0; layer < 3; layer++) {
    const base = horizon() + layer * 13;
    ctx.fillStyle = ['#778276', '#536451', '#354b3d'][layer];
    for (let i = -2; i < 30; i++) {
      const x = i * W / 25 + (rand(i + layer * 77) - 0.5) * 24;
      const size = 22 + layer * 13 + rand(i * 4 + layer) * 30;
      ctx.beginPath(); ctx.moveTo(x, base - size); ctx.lineTo(x - size * 0.4, base + 8);
      ctx.lineTo(x + size * 0.4, base + 8); ctx.fill();
    }
  }
}
function road() {
  const hy = horizon(), bottom = H + 50;
  const far = W * 0.047, near = W * 0.64;
  ctx.beginPath(); ctx.moveTo(W / 2 - far, hy); ctx.lineTo(W / 2 + far, hy);
  ctx.lineTo(W / 2 + near, bottom); ctx.lineTo(W / 2 - near, bottom); ctx.closePath();
  ctx.save(); ctx.clip();
  if (images.road) {
    const pattern = ctx.createPattern(images.road, 'repeat');
    if (pattern) { ctx.fillStyle = pattern; ctx.fillRect(0, hy, W, bottom - hy); }
  } else {
    const dirt = ctx.createLinearGradient(0, hy, 0, bottom);
    dirt.addColorStop(0, '#5b5140'); dirt.addColorStop(1, '#8b7557');
    ctx.fillStyle = dirt; ctx.fillRect(0, hy, W, bottom - hy);
    // Irregular grain, depth-scaled to avoid repetitive flat colors.
    for (let i = 0; i < 460; i++) {
      const y = hy + rand(i + 12) * (bottom - hy);
      const ratio = (y - hy) / (bottom - hy);
      const half = far + (near - far) * ratio;
      const x = W / 2 + (rand(i + 220) * 2 - 1) * half;
      ctx.fillStyle = i % 3 ? 'rgba(38,33,25,.09)' : 'rgba(217,190,145,.09)';
      ctx.fillRect(x, y, 1 + ratio * 5, 1 + ratio * 3);
    }
  }
  // Subtle parallel wheel ruts, not tire-stamp graphics.
  for (const sign of [-1, 1]) {
    ctx.strokeStyle = 'rgba(38,31,23,.27)';
    ctx.lineWidth = Math.max(2, W * 0.012);
    ctx.beginPath(); ctx.moveTo(W / 2 + sign * far * 0.42, hy);
    ctx.lineTo(W / 2 + sign * near * 0.42, bottom); ctx.stroke();
  }
  ctx.restore();
  // Dark forest verge blends the road into the environment.
  ctx.strokeStyle = 'rgba(25,31,22,.35)'; ctx.lineWidth = 3;
  for (const sign of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(W / 2 + sign * far, hy);
    ctx.lineTo(W / 2 + sign * near, bottom); ctx.stroke();
  }
}
function fallbackTree(x, y, width, height, seed) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#332b20'; ctx.fillRect(-width * 0.045, -height * 0.7, width * 0.09, height * 0.7);
  for (let k = 0; k < 10; k++) {
    const t = k / 10, cy = -height * (0.95 - t * 0.72);
    const reach = width * (0.11 + t * 0.43);
    ctx.fillStyle = ['#263d31','#304734','#1f352b','#40533a'][(k + seed) % 4];
    ctx.beginPath(); ctx.moveTo((rand(seed + k) - 0.5) * width * 0.08, cy - height * 0.1);
    ctx.lineTo(-reach, cy + height * 0.13); ctx.lineTo(reach, cy + height * 0.13);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function fallbackCrate(x, y, size) {
  ctx.fillStyle = '#4a3323'; ctx.fillRect(x - size / 2, y - size, size, size);
  ctx.strokeStyle = '#aa8255'; ctx.lineWidth = Math.max(1, size * 0.07);
  ctx.strokeRect(x - size / 2 + 2, y - size + 2, size - 4, size - 4);
  ctx.beginPath(); ctx.moveTo(x - size / 2, y - size); ctx.lineTo(x + size / 2, y); ctx.stroke();
}
function scenery() {
  const visible = objects.map(o => ({...o, z: (o.depth - worldShift % 1760 + 1760) % 1760})).filter(o => o.z < 430);
  visible.sort((a,b) => b.z - a.z);
  for (const o of visible) {
    const p = projection(o.z);
    const x = W / 2 + o.side * (p.roadHalf + W * (0.018 + p.t * 0.11));
    const h = H * (0.11 + p.t * 0.66) * (0.82 + rand(o.seed) * 0.35);
    const w = h * (o.type === 'tree' ? 0.62 : 1.15);
    ctx.fillStyle = 'rgba(18,22,15,.20)';
    ctx.beginPath(); ctx.ellipse(x, p.y, w * 0.35, Math.max(2,h * 0.028), 0, 0, Math.PI * 2); ctx.fill();
    if (o.type === 'tree') {
      if (!drawImageContain(images.tree, x, p.y, w, h)) fallbackTree(x,p.y,w,h,o.seed);
    } else if (!drawImageContain(images.sandbags,x,p.y,w,h*0.43)) {
      ctx.fillStyle='#6b6247';
      for(let j=0;j<3;j++)for(let k=0;k<4;k++){
        ctx.beginPath();ctx.ellipse(x+(k-1.5)*w*.22,p.y-j*h*.11,w*.12,h*.07,0,0,Math.PI*2);ctx.fill();
      }
    }
  }
}
function drawObstacles() {
  const visible = obstacles.filter(o => !o.hit).map(o => ({...o,z:o.depth-worldShift})).filter(o=>o.z>-10&&o.z<430).sort((a,b)=>b.z-a.z);
  for(const o of visible) {
    const p=projection(Math.max(0,o.z)), size=H*(0.02+p.t*.14);
    const x=roadX(o.lane,o.z);
    if(!drawImageContain(images.crate,x,p.y,size,size)) fallbackCrate(x,p.y,size);
  }
}
function soldier() {
  const x=roadX(lane,0), ground=H*.93;
  const lift=jumping ? Math.sin(jumpTime*Math.PI)*H*.14 : 0;
  const height=Math.min(H*.52,W*.32)*(ducking?0.68:1), width=height*.58;
  ctx.fillStyle='rgba(20,19,15,.32)';
  ctx.beginPath();ctx.ellipse(x,ground,width*.37*(1-lift/H),height*.065,0,0,Math.PI*2);ctx.fill();
  if(drawImageContain(images.soldier,x,ground-lift,width,height))return;
  // Readable rear-view fallback, not a T-pose.
  ctx.save();ctx.translate(x,ground-lift);
  const sway=running?Math.sin(worldShift*.13)*height*.018:0;
  ctx.fillStyle='#353c31';ctx.strokeStyle='#272d25';ctx.lineWidth=height*.09;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-width*.13,-height*.39);ctx.lineTo(-width*.16+sway,-height*.06);
  ctx.moveTo(width*.13,-height*.39);ctx.lineTo(width*.16-sway,-height*.06);ctx.stroke();
  ctx.fillStyle='#4d5141';ctx.beginPath();ctx.moveTo(-width*.25,-height*.75);
  ctx.lineTo(width*.25,-height*.75);ctx.lineTo(width*.19,-height*.34);
  ctx.lineTo(-width*.19,-height*.34);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#414538';ctx.lineWidth=height*.075;ctx.beginPath();
  ctx.moveTo(-width*.23,-height*.69);ctx.lineTo(-width*.33,-height*.44+sway);
  ctx.moveTo(width*.23,-height*.69);ctx.lineTo(width*.33,-height*.44-sway);ctx.stroke();
  ctx.fillStyle='#444c3d';ctx.beginPath();ctx.arc(0,-height*.84,width*.18,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#303c30';ctx.beginPath();ctx.ellipse(0,-height*.91,width*.25,height*.055,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function update(dt) {
  if(!running)return;
  worldShift+=dt*16;distance+=dt*16;
  if(jumping){jumpTime+=dt*2.4;if(jumpTime>=1){jumping=false;jumpTime=0;}}
  for(const o of obstacles){
    if(!o.hit&&o.depth-worldShift<9&&o.depth-worldShift>-12){
      o.hit=true;
      if(o.lane===lane&&!jumping){health=Math.max(0,health-1);if(health===0){running=false;message.textContent='PARTITA TERMINATA — TOCCA PER RIPROVARE';message.style.display='block';}}
      else score+=20;
    }
  }
  stats.textContent='TRAGUARDO: '+Math.max(0,200-Math.floor(distance/5))+' m';
  document.getElementById('points').textContent='PUNTI: '+score;
  document.getElementById('hearts').innerHTML=Array.from({length:3},(_,i)=>'<span class="heart '+(i>=health?'heart-lost':'')+'">♥</span>').join('');
  if(distance>=1000){running=false;message.textContent='MISSIONE COMPLETATA — TOCCA PER RIPROVARE';message.style.display='block';}
}
function frame(now) {
  const dt=Math.min((now-last)/1000||0,.05);last=now;
  update(dt);backdrop();road();scenery();drawObstacles();soldier();
  requestAnimationFrame(frame);
}
function start(){
  if(running)return;
  lane=1;distance=0;worldShift=0;score=0;health=3;jumping=false;jumpTime=0;ducking=false;paused=false;
  obstacles.forEach(o=>o.hit=false);
  running=true;message.style.display='none';
}
function move(delta){if(!running){start();return;}lane=Math.max(0,Math.min(2,lane+delta));}
function jump(){if(!running){start();return;}if(!jumping){jumping=true;jumpTime=0;}}
function duck(){if(!running){start();return;}ducking=true;setTimeout(()=>{ducking=false},650);}
function togglePause(){if(!running)return;paused=!paused;message.textContent=paused?'IN PAUSA — TOCCA PER RIPRENDERE':'';message.style.display=paused?'block':'none';}
document.getElementById('left').addEventListener('pointerdown',e=>{e.preventDefault();move(-1);});
document.getElementById('right').addEventListener('pointerdown',e=>{e.preventDefault();move(1);});
document.getElementById('jump').addEventListener('pointerdown',e=>{e.preventDefault();jump();});
document.getElementById('duck').addEventListener('pointerdown',e=>{e.preventDefault();duck();});
document.getElementById('pause').addEventListener('pointerdown',e=>{e.preventDefault();togglePause();});
message.addEventListener('pointerdown',()=>{if(paused)togglePause();else start();});
canvas.addEventListener('pointerdown',()=>{if(!running)start();});
window.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')move(-1);
  if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')move(1);
  if(e.key===' '||e.key==='ArrowUp')jump();
  if(e.key==='ArrowDown')duck();
  if(e.key==='Escape')togglePause();
});
requestAnimationFrame(frame);
