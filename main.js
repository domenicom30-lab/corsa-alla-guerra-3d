import {sprites,pixelBackdrop} from './pixel-art.js';
import {loadArcadeArt,arcadeArt,paintArcadeBackground} from './arcade-art.js';
loadArcadeArt();
import {createArcadeSystems} from './arcade-mechanics.js';
import {loadSoldierFrames,drawSoldierFrame} from './soldier-frames.js';
loadSoldierFrames();
import {prepareEnemyFrames,drawEnemyFrame} from './enemy-frames.js';
prepareEnemyFrames();
import './style.css';
// Side-scrolling 2D platform runner: fixed-size sprites, horizontal world, no depth projection.
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const message=document.getElementById('message'),stats=document.getElementById('stats');
let W=0,H=0,dpr=1,last=0,running=false,paused=false,score=0,health=3,distance=0;
let scroll=0,vy=0,jumpY=0,duckTime=0,phase=0,invulnerable=0,shotCooldown=0,muzzleFlash=0,fireHeld=false;
const movement={left:false,right:false};
let facing=1;
let bossVictoryAwarded=false;
let runCycle=0;
let recoil=0;
const arcade=createArcadeSystems();
const bullets=[];
const particles=[];
const blastEffects=[];
const dustPuffs=[];
const enemyDebris=[];
const ticks=Array.from({length:25},(_,i)=>({x:1050+i*520,y:0,alive:true,phase:i*.7}));
const SPEED=250,GRAVITY=1900;
const MAX_PARTICLES=180;
let frameClock=0;
let visible=true;
document.addEventListener('visibilitychange',()=>{visible=!document.hidden;last=0;if(!visible){fireHeld=false;clearTouchMovement();if(running&&!paused){paused=true;message.textContent='IN PAUSA — TOCCA PER RIPRENDERE';message.style.display='block'}}});
function resize(){W=innerWidth;H=innerHeight;const pixelBudget=2400000;dpr=Math.min(devicePixelRatio||1,2,Math.sqrt(pixelBudget/Math.max(1,W*H)));canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function ground(){return H*.78}
function playerX(){return W*.22}
const obstacles=Array.from({length:32},(_,i)=>({x:750+i*420+(i%3)*100,type:i%3,hit:false}));
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
const backdrop=document.createElement('canvas');backdrop.width=960;backdrop.height=540;const bg=backdrop.getContext('2d');
function background(){
 bg.imageSmoothingEnabled=false;if(!paintArcadeBackground(bg,960,540,scroll*960/Math.max(W,1)))pixelBackdrop(bg,960,540,scroll*960/Math.max(W,1));
 ctx.imageSmoothingEnabled=false;ctx.drawImage(backdrop,0,0,W,H);
 // Detailed modular scenery, on the same horizontal plane.
 for(let i=0;i<14;i++){const x=420+i*670-scroll;if(x<-240||x>W+240)continue;
 const type=i%3;if(type===0)ctx.drawImage(arcadeArt.tower||sprites.tower,x,ground()-H*.49,H*.27,H*.49);
 else if(type===1){ctx.drawImage(arcadeArt.sandbags||sprites.sandbags,x,ground()-H*.12,H*.22,H*.12);ctx.drawImage(arcadeArt.crate||sprites.crate,x+H*.17,ground()-H*.16,H*.16,H*.16)}
 else {ctx.drawImage(arcadeArt.crate||sprites.crate,x,ground()-H*.15,H*.15,H*.15);ctx.drawImage(arcadeArt.crate||sprites.crate,x+H*.12,ground()-H*.15,H*.15,H*.15)}
 }
}
function drawPlayer(){
 const h=H*(duckTime>0?.145:.255),w=h*72/88,runFrame=jumpY>0?1:Math.floor(runCycle)%8;
 const x=playerX()-w*.5,y=ground()-jumpY-h;
 ctx.save();ctx.globalAlpha=.24*Math.max(.3,1-jumpY/H);ctx.fillStyle='#17150e';ctx.beginPath();ctx.ellipse(playerX(),ground()+H*.006,w*.4,H*.012,0,0,Math.PI*2);ctx.fill();ctx.restore();
 const moving=Math.abs(Number(movement.right)-Number(movement.left))>0;
 const footstepBob=moving&&jumpY===0&&duckTime===0?Math.abs(Math.sin(runCycle*Math.PI)) * H*.006:0;
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(recoil>0)ctx.translate(-facing*recoil*H*.01,0);
 if(facing<0){ctx.translate(playerX()*2,0);ctx.scale(-1,1)}
 // Keep character readable while invulnerable: use a subtle outline, not transparency.
 if(invulnerable>0&&Math.floor(invulnerable*12)%2===0){ctx.shadowColor='#f8e2a1';ctx.shadowBlur=H*.014;}
 const sheet=arcadeArt.soldier;
 const pose=jumpY>0?'jump':duckTime>0?'duck':muzzleFlash>0||fireHeld?'fire':Math.abs(Number(movement.right)-Number(movement.left))>0?'run':'idle';
 const frame=pose==='run'?runFrame:pose==='fire'?Math.floor(phase*.9)%4:pose==='idle'?Math.floor(phase*.2)%4:pose==='jump'?Math.min(2,Math.floor(Math.abs(vy)/Math.max(1,H))):Math.floor(phase*.3)%3;
 drawSoldierFrame(ctx,pose,frame,x,y-footstepBob,w,h);
 if(muzzleFlash>0){const mx=x+w*.95,my=y+h*.48,flash=H*(.032+.013*Math.min(1,muzzleFlash/.07));ctx.fillStyle='#fff6c8';ctx.fillRect(mx,my-H*.006,flash*.6,H*.012);ctx.fillStyle='#ffc34e';ctx.beginPath();ctx.moveTo(mx,my-H*.015);ctx.lineTo(mx+flash,my);ctx.lineTo(mx,my+H*.015);ctx.closePath();ctx.fill();ctx.fillStyle='#f08b27';ctx.fillRect(mx+flash*.7,my-H*.004,flash*.28,H*.008);for(let i=0;i<3;i++){const sparkX=mx+flash*(.55+i*.23),sparkY=my+(i-1)*H*.023;ctx.fillStyle=i===1?'#fff3a1':'#f5a83e';ctx.fillRect(sparkX,sparkY,Math.max(2,H*.005),Math.max(2,H*.005))}}
 ctx.restore();
}
function drawObstacles(){
 for(const o of obstacles){const x=o.x-scroll,w=H*.13,h=H*.14;if(x<-w||x>W+w)continue;
 const sprite=o.type===0?(arcadeArt.sandbags||sprites.sandbags):(arcadeArt.crate||sprites.crate);ctx.drawImage(sprite,x,ground()-h,w,h);
 }
}
function drawTicks(){
 for(const t of ticks){if(!t.alive)continue;const x=t.x-scroll,y=ground()-H*.065+Math.sin(phase*1.7+t.phase)*H*.006,w=H*.095,h=H*.078;
 if(x<-w||x>W+w)continue;ctx.imageSmoothingEnabled=false;const sheet=arcadeArt.tick;const frame=Math.floor(phase*.9+t.phase)%4;drawEnemyFrame(ctx,Math.floor(phase*1.4+t.phase)%8,x-w*.5,y-h*.5,w,h);
 }
}
function drawBullets(){for(const b of bullets){const dir=Math.sign(b.vx)||1;const len=Math.max(12,H*.032);ctx.fillStyle=b.kind==='heavy'?'#a9e9ff':'#ffeeb0';ctx.fillRect(b.x-(dir<0?len:0),b.y,len,Math.max(3,H*.006));ctx.fillStyle='#e87d28';ctx.fillRect(b.x-dir*5-(dir<0?len*.45:0),b.y+1,Math.max(5,H*.012),Math.max(2,H*.004))}}
function burst(x,y){blastEffects.push({x,y,life:.48,maxLife:.48});if(blastEffects.length>16)blastEffects.shift();for(let i=0;i<13;i++){const angle=i*Math.PI*2/13;if(particles.length>=MAX_PARTICLES)particles.shift();particles.push({x,y,vx:Math.cos(angle)*(80+i*9),vy:Math.sin(angle)*(80+i*7)-60,life:.38+i*.012,color:i%3===0?'#ffdc6b':i%3===1?'#ee5828':'#aa181b'})}}
function drawBlastEffects(){for(const e of blastEffects){const progress=1-e.life/e.maxLife;const radius=H*(.025+progress*.18);ctx.save();ctx.imageSmoothingEnabled=false;const frame=Math.min(7,Math.floor(progress*8));const core=H*(.028+Math.sin(Math.PI*progress)*.095);if(frame<6){for(let i=0;i<8;i++){const a=i*Math.PI/4+frame*.17,r=core*(.65+(i%3)*.22),size=Math.max(2,H*.016*(1-progress));ctx.fillStyle=i%3===0?'#fff2a0':i%3===1?'#ffb13e':'#e95127';ctx.fillRect(Math.round(e.x+Math.cos(a)*r),Math.round(e.y+Math.sin(a)*r),Math.ceil(size),Math.ceil(size))}ctx.fillStyle=frame<2?'#fff8c6':frame<4?'#ffcf65':'#e46b35';ctx.fillRect(Math.round(e.x-core*.5),Math.round(e.y-core*.5),Math.ceil(core),Math.ceil(core))}ctx.globalAlpha=Math.max(0,1-progress);ctx.strokeStyle=progress<.45?'#fff4a3':'#ff7a30';ctx.lineWidth=Math.max(3,H*.013*(1-progress*.6));ctx.beginPath();ctx.arc(e.x,e.y,radius,0,Math.PI*2);ctx.stroke();for(let i=0;i<10;i++){const angle=i*Math.PI/5+progress*.45;const dist=radius*(.65+(i%3)*.16);const size=Math.max(3,H*.016*(1-progress));ctx.fillStyle=i%3===0?'#fff4a3':i%3===1?'#ffae43':'#de4228';ctx.fillRect(e.x+Math.cos(angle)*dist-size/2,e.y+Math.sin(angle)*dist-size/2,size,size)}ctx.restore()}}
function shatterEnemy(x,y){const colors=['#c94e37','#7c2829','#e29b60','#3b2426'];for(let i=0;i<12;i++){const a=i*Math.PI/6;enemyDebris.push({x,y,vx:Math.cos(a)*(55+i*9),vy:Math.sin(a)*(45+i*7)-H*.22,life:.45+(i%4)*.09,size:Math.max(3,H*.008+(i%3)*2),color:colors[i%4]})}if(enemyDebris.length>120)enemyDebris.splice(0,enemyDebris.length-120)}
function drawEnemyDebris(){for(const p of enemyDebris){ctx.save();ctx.globalAlpha=Math.min(1,p.life*2.5);ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);ctx.restore()}}
function drawDust(){for(const p of dustPuffs){ctx.save();ctx.globalAlpha=Math.max(0,p.life/.34)*.52;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size*.55);ctx.restore()}}
function drawParticles(){for(const p of particles){ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,Math.max(3,H*.007),Math.max(3,H*.007))}}
function shoot(){if(!running){start()}if(paused||shotCooldown>0)return;shotCooldown=arcade.weapon==='heavy'?.09:.17;muzzleFlash=.07;recoil=1;bullets.push(...arcade.fire(playerX()+facing*H*.12,ground()-jumpY-H*(duckTime>0?.12:.21),facing,Math.max(550,W*.8)));if(bullets.length>120)bullets.splice(0,bullets.length-120)}
function grenade(){if(!running){start()}if(!paused)arcade.throwGrenade(playerX()+facing*H*.08,ground()-jumpY-H*.2,facing,H)}
function damage(){if(invulnerable>0||!running)return;health--;invulnerable=1.25;if(health<=0){running=false;fireHeld=false;movement.left=false;movement.right=false;message.textContent='PARTITA TERMINATA — TOCCA PER RIPROVARE';message.style.display='block'}}
function defeatBoss(){if(bossVictoryAwarded)return;bossVictoryAwarded=true;arcade.boss.defeated=true;arcade.boss.active=false;score+=3000;burst(arcade.boss.x-scroll,ground()-H*.25);message.textContent='BOSS SCONFITTO — RAGGIUNGI IL TRAGUARDO';message.style.display='block';setTimeout(()=>{if(running&&!paused)message.style.display='none'},1800)}
function explosion(x,y,radius){burst(x,y);for(const t of ticks){if(t.alive&&Math.abs(t.x-scroll-x)<radius){t.alive=false;score+=arcade.kill();shatterEnemy(t.x-scroll,ground()-H*.07)}}if(arcade.boss.active&&!arcade.boss.defeated&&Math.abs(arcade.boss.x-scroll-x)<radius+H*.2){arcade.boss.hp-=5;if(arcade.boss.hp<=0)defeatBoss()}}
function hud(){document.getElementById('points').textContent='PUNTI: '+score;document.getElementById('hearts').innerHTML=Array.from({length:3},(_,i)=>'<span class="heart '+(i>=health?'heart-lost':'')+'">♥</span>').join('');stats.textContent='TRAGUARDO: '+Math.max(0,200-Math.floor(distance))+' m · '+arcade.weapon.toUpperCase()+' · BOMBE '+arcade.grenadeCount+(arcade.combo>1?' · COMBO x'+arcade.combo:'')}
function update(dt){
 if(!running||paused)return;
 const direction=Number(movement.right)-Number(movement.left);
 const advance=SPEED*dt*direction;
 const previousScroll=scroll;
 scroll=Math.max(0,Math.min(10000,scroll+advance));
 if(direction!==0){const oldStep=Math.floor(runCycle);runCycle+=Math.abs(scroll-previousScroll)/Math.max(1,H)*7;if(jumpY===0&&Math.floor(runCycle)!==oldStep&&Math.floor(runCycle)%2===0){dustPuffs.push({x:playerX()-facing*H*.045,y:ground()-H*.008,life:.34,size:H*.018,color:'#b8a47b'});if(dustPuffs.length>35)dustPuffs.shift()}}
 const cameraDelta=scroll-previousScroll;distance=scroll/50;phase+=dt*15;if(direction!==0)facing=direction;
 const collected=arcade.collect(scroll+playerX(),jumpY,ground(),H);if(collected==='health')health=Math.min(3,health+1);
 arcade.step(dt,scroll,playerX(),ground(),H,damage,explosion,cameraDelta);
 if(!running){hud();return}
 shotCooldown=Math.max(0,shotCooldown-dt);muzzleFlash=Math.max(0,muzzleFlash-dt);recoil=Math.max(0,recoil-dt*12);if(fireHeld&&shotCooldown===0)shoot();
 for(let i=enemyDebris.length-1;i>=0;i--){const p=enemyDebris[i];p.x+=p.vx*dt-cameraDelta;p.y+=p.vy*dt;p.vy+=H*1.5*dt;p.life-=dt;if(p.life<=0)enemyDebris.splice(i,1)}
 for(let i=dustPuffs.length-1;i>=0;i--){const p=dustPuffs[i];p.x-=cameraDelta;p.y-=dt*H*.025;p.size+=dt*H*.065;p.life-=dt;if(p.life<=0)dustPuffs.splice(i,1)}
 for(let i=blastEffects.length-1;i>=0;i--){const e=blastEffects[i];e.x-=cameraDelta;e.life-=dt;if(e.life<=0)blastEffects.splice(i,1)}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt-cameraDelta;p.y+=p.vy*dt;p.vy+=400*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1)}
 for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.vx*dt-cameraDelta;b.y+=b.vy*dt;b.life-=dt;let hit=false;for(const t of ticks){const x=t.x-scroll;if(t.alive&&Math.abs(b.x-x)<H*.055&&Math.abs(b.y-(ground()-H*.055))<H*.145){t.alive=false;score+=arcade.kill();shatterEnemy(x,ground()-H*.07);burst(x,ground()-H*.07);hit=true;break}}if(!hit&&arcade.boss.active&&!arcade.boss.defeated&&Math.abs(b.x-(arcade.boss.x-scroll))<H*.27&&Math.abs(b.y-(ground()-H*.3))<H*.25){arcade.boss.hp-=b.damage;hit=true;burst(b.x,b.y);if(arcade.boss.hp<=0)defeatBoss()}if(hit||b.life<=0||b.x>W+40||b.x< -40)bullets.splice(i,1)}
 for(const t of ticks){const x=t.x-scroll;if(t.alive&&invulnerable===0&&Math.abs(x-playerX())<H*.075&&jumpY<H*.09){t.alive=false;damage();if(!running){hud();return}}}
 if(duckTime>0)duckTime=Math.max(0,duckTime-dt);
 if(invulnerable>0)invulnerable=Math.max(0,invulnerable-dt);
 if(jumpY>0||vy>0){jumpY+=vy*dt;vy-=GRAVITY*dt;if(jumpY<=0){jumpY=0;vy=0}}
 for(const o of obstacles){const x=o.x-scroll,w=H*.13;if(!o.hit&&x<playerX()+H*.05&&x+w>playerX()-H*.05){o.hit=true;if(jumpY<H*.12&&invulnerable===0){damage();if(!running){hud();return}}else if(jumpY>=H*.12)score+=20}}
 if(distance>=200&&arcade.boss.defeated){running=false;fireHeld=false;movement.left=false;movement.right=false;message.textContent='MISSIONE COMPLETATA — TOCCA PER RIPROVARE';message.style.display='block'}hud();
}
function frame(t){if(!visible){last=t;requestAnimationFrame(frame);return}if(last&&t-last<1000/65){requestAnimationFrame(frame);return}const dt=Math.min(last?(t-last)/1000:0,.05);last=t;update(dt);ctx.save();if(arcade.screenShake>0){const shake=arcade.screenShake;ctx.translate(Math.sin(phase*3.1)*shake*.5,Math.cos(phase*4.3)*shake*.35)}background();drawObstacles();drawTicks();arcade.draw(ctx,scroll,ground(),H,phase);drawDust();drawPlayer();drawBullets();drawBlastEffects();drawEnemyDebris();drawParticles();ctx.restore();requestAnimationFrame(frame)}
function start(){running=true;paused=false;score=0;health=3;distance=0;scroll=0;facing=1;bossVictoryAwarded=false;arcade.reset();vy=0;jumpY=0;duckTime=0;phase=0;runCycle=0;invulnerable=0;shotCooldown=0;muzzleFlash=0;recoil=0;fireHeld=false;bullets.length=0;particles.length=0;blastEffects.length=0;dustPuffs.length=0;enemyDebris.length=0;ticks.forEach(t=>t.alive=true);obstacles.forEach(o=>o.hit=false);clearTouchMovement();message.style.display='none';hud()}
function jump(){if(!running){start()}if(!paused&&jumpY===0){vy=Math.sqrt(2*GRAVITY*H*.23);duckTime=0}}
function duck(){if(!running){start()}if(!paused)duckTime=.7}
function pause(){if(!running)return;paused=!paused;message.textContent='IN PAUSA — TOCCA PER RIPRENDERE';message.style.display=paused?'block':'none'}
for(const [id,fn] of [['jump',jump],['duck',duck],['grenade',grenade],['pause',pause]])document.getElementById(id).addEventListener('pointerdown',e=>{e.preventDefault();fn()});
const activeMovementPointers={left:new Set(),right:new Set()};
function clearTouchMovement(){activeMovementPointers.left.clear();activeMovementPointers.right.clear();movement.left=false;movement.right=false}
for(const id of ['left','right']){const el=document.getElementById(id);const pointers=activeMovementPointers[id];el.addEventListener('pointerdown',e=>{e.preventDefault();if(!running)start();el.setPointerCapture(e.pointerId);pointers.add(e.pointerId);movement[id]=true});for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,e=>{pointers.delete(e.pointerId);movement[id]=pointers.size>0})}
const fireButton=document.getElementById('shoot');fireButton.addEventListener('pointerdown',e=>{e.preventDefault();if(!running)start();fireHeld=true;fireButton.setPointerCapture(e.pointerId);shoot()});for(const event of ['pointerup','pointercancel','lostpointercapture'])fireButton.addEventListener(event,()=>fireHeld=false);
addEventListener('blur',()=>{clearTouchMovement();fireHeld=false;if(running&&!paused){paused=true;message.textContent='IN PAUSA — TOCCA PER RIPRENDERE';message.style.display='block'}});
message.addEventListener('pointerdown',()=>{if(paused)pause();else start()});canvas.addEventListener('pointerdown',()=>{if(!running)start()});
addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a'){if(!running)start();movement.left=true;}if(e.key==='ArrowRight'||e.key==='d'){if(!running)start();movement.right=true;}if(e.key==='ArrowUp'||e.key===' '){e.preventDefault();if(!e.repeat)jump();}if(e.key==='ArrowDown')duck();if(e.key==='Escape')pause();if((e.key==='f'||e.key==='Control')&&!e.repeat)shoot();if(e.key==='g'&&!e.repeat)grenade()});
addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='a')movement.left=false;if(e.key==='ArrowRight'||e.key==='d')movement.right=false});
for(const [selector,sprite] of [['.portrait-player',sprites.soldier[0]],['.portrait-target',sprites.tick[0]]]){const el=document.querySelector(selector);if(el){el.style.backgroundImage='url('+sprite.toDataURL()+')';el.style.backgroundSize='contain';el.style.backgroundPosition='center';el.style.imageRendering='pixelated'}}
requestAnimationFrame(frame);

