import './style.css';
// Pure 2D horizontal sprite runner. No 3D meshes, camera, perspective or depth scaling.
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const message=document.getElementById('message'),stats=document.getElementById('stats');
let W=0,H=0,dpr=1,last=0,running=false,paused=false,score=0,health=3,distance=0;
let lane=1,jumpClock=0,duckClock=0,scroll=0;
const paths={background:'./assets/2d/forest-background.webp',reference:'./assets/2d/reference-scene.webp',soldier:'./assets/2d/soldier-back.png',crate:'./assets/2d/crate.png',barrier:'./assets/2d/barrier.png',sandbags:'./assets/2d/sandbags.png'};
const images={};
for(const [name,url] of Object.entries(paths)){const img=new Image();img.onload=()=>{images[name]=img};img.src=url;}
const obstacles=Array.from({length:24},(_,i)=>({x:W+380+i*410,lane:(i*7+1)%3,type:i%3===0?'barrier':i%3===1?'crate':'sandbags',hit:false}));
function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);canvas.style.width=W+'px';canvas.style.height=H+'px';}
addEventListener('resize',resize);resize();
function laneY(i){return H*(0.47+i*0.18)}
function drawSprite(img,x,y,w,h){if(!img)return false;ctx.drawImage(img,x-w/2,y-h,w,h);return true}
function background(){
 const img=images.background||images.reference;
 if(img){const scale=Math.max(W/img.width,H/img.height);const w=img.width*scale,h=img.height*scale;ctx.drawImage(img,(W-w)/2,(H-h)/2,w,h);return;}
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#77858a');g.addColorStop(.5,'#596b57');g.addColorStop(1,'#4c473b');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#514a3d';ctx.fillRect(0,H*.42,W,H*.58);
 for(let i=0;i<3;i++){ctx.strokeStyle='#c6bda166';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,laneY(i)+H*.04);ctx.lineTo(W,laneY(i)+H*.04);ctx.stroke();}
}
function drawObstacles(){
 for(const o of obstacles){if(o.hit)continue;const x=o.x-scroll,y=laneY(o.lane),h=H*.14,w=h*1.1;if(x< -w||x>W+w)continue;
 ctx.fillStyle='#14130f55';ctx.beginPath();ctx.ellipse(x,y,w*.42,6,0,0,Math.PI*2);ctx.fill();
 if(!drawSprite(o.type==='crate'||o.type==='barrier'?images.sandbags:images[o.type],x,y,w,h)){ctx.fillStyle='#4e3829';ctx.fillRect(x-w/2,y-h,w,h);ctx.strokeStyle='#b98a59';ctx.lineWidth=4;ctx.strokeRect(x-w/2,y-h,w,h);}
 }
}
function drawSoldier(){
 const x=W*.26,y=laneY(lane),jump=jumpClock>0?Math.sin((1-jumpClock/.65)*Math.PI)*H*.15:0;
 const h=H*(duckClock>0?.24:.4),w=h*.53;
 ctx.fillStyle='#0d130f55';ctx.beginPath();ctx.ellipse(x,y,w*.4,8,0,0,Math.PI*2);ctx.fill();
 if(drawSprite(images.soldier,x,y-jump,w,h))return;
 ctx.save();ctx.translate(x,y-jump);ctx.fillStyle='#343b31';ctx.strokeStyle='#2c342a';ctx.lineWidth=w*.19;ctx.lineCap='round';
 const step=running?Math.sin(scroll*.04)*h*.04:0;
 ctx.beginPath();ctx.moveTo(-w*.18,-h*.35);ctx.lineTo(-w*.19+step,-h*.05);ctx.moveTo(w*.18,-h*.35);ctx.lineTo(w*.19-step,-h*.05);ctx.stroke();
 ctx.fillRect(-w*.32,-h*.75,w*.64,h*.42);ctx.beginPath();ctx.arc(0,-h*.86,w*.22,0,Math.PI*2);ctx.fill();ctx.restore();
}
function update(dt){
 if(!running||paused)return;
 const speed=Math.max(210,W*.27);scroll+=speed*dt;distance+=dt*12;
 if(jumpClock>0)jumpClock=Math.max(0,jumpClock-dt);
 if(duckClock>0)duckClock=Math.max(0,duckClock-dt);
 for(const o of obstacles){if(o.hit)continue;const x=o.x-scroll;
 if(x<W*.26+20&&x>W*.26-24){o.hit=true;if(o.lane===lane&&jumpClock===0&&duckClock===0){health--;if(health<=0){running=false;message.textContent='PARTITA TERMINATA — TOCCA PER RIPROVARE';message.style.display='block'}}else score+=20;}
 }
 document.getElementById('points').textContent='PUNTI: '+score;
 document.getElementById('hearts').innerHTML=Array.from({length:3},(_,i)=>'<span class="heart '+(i>=health?'heart-lost':'')+'">♥</span>').join('');
 stats.textContent='TRAGUARDO: '+Math.max(0,200-Math.floor(distance))+' m';
 if(distance>=200){running=false;message.textContent='MISSIONE COMPLETATA — TOCCA PER RIPROVARE';message.style.display='block'}
}
function frame(now){const dt=Math.min((now-last)/1000||0,.05);last=now;update(dt);background();drawObstacles();drawSoldier();requestAnimationFrame(frame)}
function start(){running=true;paused=false;score=0;health=3;distance=0;lane=1;scroll=0;jumpClock=0;duckClock=0;obstacles.forEach(o=>o.hit=false);message.style.display='none'}
function move(d){if(!running){start();return}if(!paused)lane=Math.max(0,Math.min(2,lane+d))}
function jump(){if(!running){start();return}if(!paused&&jumpClock<=0)jumpClock=.65}
function duck(){if(!running){start();return}if(!paused)duckClock=.65}
function pause(){if(!running)return;paused=!paused;message.textContent='IN PAUSA — TOCCA PER RIPRENDERE';message.style.display=paused?'block':'none'}
for(const [id,fn] of [['left',()=>move(-1)],['right',()=>move(1)],['jump',jump],['duck',duck],['pause',pause]])document.getElementById(id).addEventListener('pointerdown',e=>{e.preventDefault();fn()});
message.addEventListener('pointerdown',()=>{if(paused)pause();else start()});
canvas.addEventListener('pointerdown',()=>{if(!running)start()});
addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a')move(-1);if(e.key==='ArrowRight'||e.key==='d')move(1);if(e.key==='ArrowUp'||e.key===' ')jump();if(e.key==='ArrowDown')duck();if(e.key==='Escape')pause()});
requestAnimationFrame(frame);
