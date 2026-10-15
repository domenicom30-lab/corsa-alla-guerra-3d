import {sprites,pixelBackdrop} from './pixel-art.js';
import {loadArcadeArt,arcadeArt,paintArcadeBackground} from './arcade-art.js';
loadArcadeArt();
import './style.css';
// Side-scrolling 2D platform runner: fixed-size sprites, horizontal world, no depth projection.
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const message=document.getElementById('message'),stats=document.getElementById('stats');
let W=0,H=0,dpr=1,last=0,running=false,paused=false,score=0,health=3,distance=0;
let scroll=0,vy=0,jumpY=0,duckTime=0,phase=0,invulnerable=0,shotCooldown=0,muzzleFlash=0,fireHeld=false;
const movement={left:false,right:false};
const bullets=[];
const particles=[];
const ticks=Array.from({length:25},(_,i)=>({x:1050+i*520,y:0,alive:true,phase:i*.7}));
const SPEED=250,GRAVITY=1900;
function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function ground(){return H*.78}
function playerX(){return W*.22}
const obstacles=Array.from({length:32},(_,i)=>({x:750+i*420+(i%3)*100,type:i%3,hit:false}));
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
const backdrop=document.createElement('canvas');backdrop.width=480;backdrop.height=270;const bg=backdrop.getContext('2d');
function background(){
 bg.imageSmoothingEnabled=false;if(!paintArcadeBackground(bg,480,270,scroll*480/Math.max(W,1)))pixelBackdrop(bg,480,270,scroll*480/Math.max(W,1));
 ctx.imageSmoothingEnabled=false;ctx.drawImage(backdrop,0,0,W,H);
 // Detailed modular scenery, on the same horizontal plane.
 for(let i=0;i<14;i++){const x=420+i*670-scroll;if(x<-240||x>W+240)continue;
 const type=i%3;if(type===0)ctx.drawImage(arcadeArt.tower||sprites.tower,x,ground()-H*.49,H*.27,H*.49);
 else if(type===1){ctx.drawImage(arcadeArt.sandbags||sprites.sandbags,x,ground()-H*.12,H*.22,H*.12);ctx.drawImage(arcadeArt.crate||sprites.crate,x+H*.17,ground()-H*.16,H*.16,H*.16)}
 else {ctx.drawImage(arcadeArt.crate||sprites.crate,x,ground()-H*.15,H*.15,H*.15);ctx.drawImage(arcadeArt.crate||sprites.crate,x+H*.12,ground()-H*.15,H*.15,H*.15)}
 }
}
function drawPlayer(){
 const h=H*(duckTime>0?.19:.32),w=h*72/88,runFrame=jumpY>0?1:Math.floor(phase*1.1)%6;
 const x=playerX()-w*.5,y=ground()-jumpY-h;
 ctx.save();ctx.imageSmoothingEnabled=false;
 // Keep character readable while invulnerable: use a subtle outline, not transparency.
 if(invulnerable>0&&Math.floor(invulnerable*12)%2===0){ctx.shadowColor='#f8e2a1';ctx.shadowBlur=H*.014;}
 const sheet=arcadeArt.soldier; if(sheet){const frameW=sheet.width/6;ctx.drawImage(sheet,runFrame*frameW,0,frameW,sheet.height,x,y,w,h)}else ctx.drawImage(sprites.soldier[runFrame],x,y,w,h);
 if(muzzleFlash>0){ctx.fillStyle='#ffe27a';const mx=x+w*.95,my=y+h*.48;ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx+H*.042,my-H*.019);ctx.lineTo(mx+H*.025,my);ctx.lineTo(mx+H*.042,my+H*.02);ctx.fill()}
 ctx.restore();
}
function drawObstacles(){
 for(const o of obstacles){const x=o.x-scroll,w=H*.13,h=H*.14;if(x<-w||x>W+w)continue;
 const sprite=o.type===0?(arcadeArt.sandbags||sprites.sandbags):(arcadeArt.crate||sprites.crate);ctx.drawImage(sprite,x,ground()-h,w,h);
 }
}
function drawTicks(){
 for(const t of ticks){if(!t.alive)continue;const x=t.x-scroll,y=ground()-H*.065+Math.sin(phase*1.7+t.phase)*H*.006,w=H*.095,h=H*.078;
 if(x<-w||x>W+w)continue;ctx.imageSmoothingEnabled=false;const sheet=arcadeArt.tick;const frame=Math.floor(phase*.9+t.phase)%4;if(sheet){const fw=sheet.width/4;ctx.drawImage(sheet,frame*fw,0,fw,sheet.height,x-w*.5,y-h*.5,w,h)}else ctx.drawImage(sprites.tick[frame],x-w*.5,y-h*.5,w,h);
 }
}
function drawBullets(){ctx.fillStyle='#ffdf75';for(const b of bullets){ctx.fillRect(b.x,b.y,Math.max(10,H*.022),Math.max(3,H*.006))}}
function burst(x,y){for(let i=0;i<13;i++){const angle=i*Math.PI*2/13;particles.push({x,y,vx:Math.cos(angle)*(80+i*9),vy:Math.sin(angle)*(80+i*7)-60,life:.38+i*.012,color:i%3===0?'#ffdc6b':i%3===1?'#ee5828':'#aa181b'})}}
function drawParticles(){for(const p of particles){ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,Math.max(3,H*.007),Math.max(3,H*.007))}}
function shoot(){if(!running){start();return}if(paused||shotCooldown>0)return;shotCooldown=.17;muzzleFlash=.07;bullets.push({x:playerX()+H*.12,y:ground()-jumpY-H*(duckTime>0?.12:.21),speed:Math.max(550,W*.8)})}
function hud(){document.getElementById('points').textContent='PUNTI: '+score;document.getElementById('hearts').innerHTML=Array.from({length:3},(_,i)=>'<span class="heart '+(i>=health?'heart-lost':'')+'">♥</span>').join('');stats.textContent='TRAGUARDO: '+Math.max(0,200-Math.floor(distance))+' m'}
function update(dt){
 if(!running||paused)return;
 const direction=Number(movement.right)-Number(movement.left);
 const advance=SPEED*dt*direction;
 scroll=Math.max(0,scroll+advance);distance=Math.max(0,distance+advance/50);phase+=dt*15;
 shotCooldown=Math.max(0,shotCooldown-dt);muzzleFlash=Math.max(0,muzzleFlash-dt);if(fireHeld&&shotCooldown===0)shoot();
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=400*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1)}
 for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.speed*dt;let hit=false;for(const t of ticks){const x=t.x-scroll;if(t.alive&&Math.abs(b.x-x)<H*.055&&Math.abs(b.y-(ground()-H*.055))<H*.145){t.alive=false;score+=100;burst(x,ground()-H*.07);hit=true;break}}if(hit||b.x>W+40)bullets.splice(i,1)}
 for(const t of ticks){const x=t.x-scroll;if(t.alive&&invulnerable===0&&Math.abs(x-playerX())<H*.075&&jumpY<H*.09){t.alive=false;health--;invulnerable=1.2;if(health<=0){running=false;message.textContent='PARTITA TERMINATA — TOCCA PER RIPROVARE';message.style.display='block'}}}
 if(duckTime>0)duckTime=Math.max(0,duckTime-dt);
 if(invulnerable>0)invulnerable=Math.max(0,invulnerable-dt);
 if(jumpY>0||vy>0){jumpY+=vy*dt;vy-=GRAVITY*dt;if(jumpY<=0){jumpY=0;vy=0}}
 for(const o of obstacles){const x=o.x-scroll,w=H*.13;if(!o.hit&&x<playerX()+H*.05&&x+w>playerX()-H*.05){o.hit=true;if(jumpY<H*.12&&invulnerable===0){health--;invulnerable=1.1;if(health<=0){running=false;message.textContent='PARTITA TERMINATA — TOCCA PER RIPROVARE';message.style.display='block'}}else score+=20}}
 if(distance>=200){running=false;message.textContent='MISSIONE COMPLETATA — TOCCA PER RIPROVARE';message.style.display='block'}hud();
}
function frame(t){const dt=Math.min((t-last)/1000||0,.05);last=t;update(dt);background();drawObstacles();drawTicks();drawPlayer();drawBullets();drawParticles();requestAnimationFrame(frame)}
function start(){running=true;paused=false;score=0;health=3;distance=0;scroll=0;vy=0;jumpY=0;duckTime=0;phase=0;invulnerable=0;shotCooldown=0;muzzleFlash=0;fireHeld=false;bullets.length=0;particles.length=0;ticks.forEach(t=>t.alive=true);obstacles.forEach(o=>o.hit=false);movement.left=false;movement.right=false;message.style.display='none';hud()}
function jump(){if(!running){start();return}if(!paused&&jumpY===0){vy=H*1.13;duckTime=0}}
function duck(){if(!running){start();return}if(!paused)duckTime=.7}
function pause(){if(!running)return;paused=!paused;message.textContent='IN PAUSA — TOCCA PER RIPRENDERE';message.style.display=paused?'block':'none'}
for(const [id,fn] of [['jump',jump],['duck',duck],['pause',pause]])document.getElementById(id).addEventListener('pointerdown',e=>{e.preventDefault();fn()});
for(const id of ['left','right']){const el=document.getElementById(id);el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);if(!running)start();movement[id]=true});for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,()=>movement[id]=false)}
const fireButton=document.getElementById('shoot');fireButton.addEventListener('pointerdown',e=>{e.preventDefault();fireHeld=true;fireButton.setPointerCapture(e.pointerId);shoot()});for(const event of ['pointerup','pointercancel','pointerleave','lostpointercapture'])fireButton.addEventListener(event,()=>fireHeld=false);
addEventListener('blur',()=>{movement.left=false;movement.right=false;fireHeld=false});
message.addEventListener('pointerdown',()=>{if(paused)pause();else start()});canvas.addEventListener('pointerdown',()=>{if(!running)start()});
addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a')movement.left=true;if(e.key==='ArrowRight'||e.key==='d')movement.right=true;if(e.key==='ArrowUp'||e.key===' ')jump();if(e.key==='ArrowDown')duck();if(e.key==='Escape')pause();if(e.key==='f'||e.key==='Control')shoot()});
addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='a')movement.left=false;if(e.key==='ArrowRight'||e.key==='d')movement.right=false});
for(const [selector,sprite] of [['.portrait-player',sprites.soldier[0]],['.portrait-target',sprites.tick[0]]]){const el=document.querySelector(selector);if(el){el.style.backgroundImage='url('+sprite.toDataURL()+')';el.style.backgroundSize='contain';el.style.backgroundPosition='center';el.style.imageRendering='pixelated'}}
requestAnimationFrame(frame);
