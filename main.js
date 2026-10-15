import './style.css';
// Side-scrolling 2D platform runner: fixed-size sprites, horizontal world, no depth projection.
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const message=document.getElementById('message'),stats=document.getElementById('stats');
let W=0,H=0,dpr=1,last=0,running=false,paused=false,score=0,health=3,distance=0;
let scroll=0,vy=0,jumpY=0,duckTime=0,phase=0,invulnerable=0,shotCooldown=0,muzzleFlash=0,fireHeld=false;
const bullets=[];
const ticks=Array.from({length:25},(_,i)=>({x:1050+i*520,y:0,alive:true,phase:i*.7}));
const SPEED=250,GRAVITY=1900;
const paths={forest:'./assets/2d/forest-background.webp',sandbags:'./assets/2d/sandbags.png'};
const images={};
for(const [key,url] of Object.entries(paths)){const img=new Image();img.onload=()=>images[key]=img;img.src=url;}
function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function ground(){return H*.78}
function playerX(){return W*.22}
const obstacles=Array.from({length:32},(_,i)=>({x:750+i*420+(i%3)*100,type:i%3,hit:false}));
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function background(){
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#8e9d9d');sky.addColorStop(.55,'#b5b6a6');sky.addColorStop(1,'#515d4b');rect(0,0,W,H,sky);
 const img=images.forest;
 if(img){ctx.save();ctx.globalAlpha=.55;const sh=H*.74,sw=img.width/img.height*sh,offset=(scroll*.1)%sw;for(let x=-offset-sw;x<W+sw;x+=sw)ctx.drawImage(img,x,0,sw,sh);ctx.restore();}
 for(let layer=0;layer<2;layer++){const shift=scroll*(layer?.34:.17),base=ground()-H*(layer?.16:.29),step=layer?135:180;for(let i=Math.floor(shift/step)-2;i<Math.ceil((shift+W)/step)+2;i++){const x=i*step-shift;ctx.fillStyle=layer?'#36493d':'#607267';ctx.beginPath();ctx.moveTo(x,base-H*(layer?.19:.28));ctx.lineTo(x-46,base);ctx.lineTo(x+46,base);ctx.fill();ctx.fillRect(x-5,base,10,ground()-base);}}
 rect(0,ground(),W,H-ground(),'#49463b');rect(0,ground(),W,9,'#7d8062');
 for(let i=Math.floor(scroll/90)-1;i<Math.ceil((scroll+W)/90)+1;i++){const x=i*90-scroll;rect(x,ground()+H*.12,47,3,'#77705c');}
}
function drawPlayer(){
 const x=playerX(),floor=ground()-jumpY,bob=running&&!paused&&jumpY===0?Math.abs(Math.sin(phase))*3:0;
 const height=H*(duckTime>0?.20:.34),width=height*.44;
 ctx.save();ctx.translate(x,floor-bob);if(invulnerable>0&&Math.floor(invulnerable*12)%2===0)ctx.globalAlpha=.35;
 const stride=jumpY>0?0:Math.sin(phase)*height*.12;
 // Side profile, animated separate limbs, equipment and helmet.
 ctx.strokeStyle='#1b2521';ctx.lineWidth=width*.18;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(-width*.10,-height*.34);ctx.lineTo(-width*.19+stride,0);ctx.moveTo(width*.08,-height*.34);ctx.lineTo(width*.13-stride,0);ctx.stroke();
 ctx.fillStyle='#303b32';ctx.fillRect(-width*.28,-height*.78,width*.56,height*.48);
 ctx.fillStyle='#202b26';ctx.fillRect(-width*.42,-height*.67,width*.2,height*.29);
 ctx.strokeStyle='#26342b';ctx.lineWidth=width*.13;ctx.beginPath();ctx.moveTo(width*.17,-height*.69);ctx.lineTo(width*.40+stride*.25,-height*.46);ctx.stroke();
 ctx.fillStyle='#a18d73';ctx.fillRect(width*.03,-height*.95,width*.25,height*.18);
 ctx.fillStyle='#28362d';ctx.beginPath();ctx.ellipse(width*.09,-height*.97,width*.32,height*.12,0,Math.PI,Math.PI*2);ctx.fill();
 ctx.fillStyle='#202a24';ctx.fillRect(-width*.33,-height*.58,width*.18,height*.22);
 // Side-view rifle held in front of the soldier.
 ctx.fillStyle='#292b27';ctx.fillRect(width*.22,-height*.64,width*.78,height*.075);
 ctx.fillStyle='#a08355';ctx.fillRect(width*.18,-height*.60,width*.28,height*.11);
 ctx.fillStyle='#181e1c';ctx.fillRect(width*.94,-height*.655,width*.18,height*.045);
 if(muzzleFlash>0){ctx.fillStyle='#ffd56d';ctx.beginPath();ctx.moveTo(width*1.15,-height*.62);ctx.lineTo(width*1.46,-height*.75);ctx.lineTo(width*1.39,-height*.62);ctx.lineTo(width*1.5,-height*.53);ctx.closePath();ctx.fill()}
 ctx.restore();
}
function drawObstacles(){
 for(const o of obstacles){const x=o.x-scroll,w=H*.13,h=H*.14;if(x<-w||x>W+w)continue;
 if(o.type===0&&images.sandbags){ctx.drawImage(images.sandbags,x,ground()-h,w,h)}else{
 rect(x,ground()-h,w,h,o.type===1?'#5e4833':'#6c6550');
 ctx.strokeStyle='#ac8d64';ctx.lineWidth=4;ctx.strokeRect(x,ground()-h,w,h);
 ctx.beginPath();ctx.moveTo(x,ground()-h);ctx.lineTo(x+w,ground());ctx.moveTo(x+w,ground()-h);ctx.lineTo(x,ground());ctx.stroke();
 }
 }
}
function drawTicks(){
 for(const t of ticks){if(!t.alive)continue;const x=t.x-scroll,y=ground()-H*.055+Math.sin(phase*1.7+t.phase)*H*.006,r=H*.045;if(x<-r||x>W+r)continue;
 ctx.save();ctx.translate(x,y);ctx.strokeStyle='#3d1114';ctx.lineWidth=Math.max(2,r*.13);ctx.lineCap='round';
 for(let i=0;i<4;i++){const yy=(i-1.5)*r*.32;ctx.beginPath();ctx.moveTo(-r*.4,yy);ctx.lineTo(-r*.85,yy-r*.3);ctx.moveTo(r*.4,yy);ctx.lineTo(r*.85,yy-r*.3);ctx.stroke()}
 ctx.fillStyle='#9f151c';ctx.beginPath();ctx.ellipse(0,0,r*.52,r*.7,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#dc3633';ctx.beginPath();ctx.ellipse(-r*.14,-r*.19,r*.23,r*.33,-.4,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#f7c9a7';ctx.beginPath();ctx.arc(-r*.18,-r*.43,r*.09,0,Math.PI*2);ctx.arc(r*.18,-r*.43,r*.09,0,Math.PI*2);ctx.fill();ctx.restore();
 }
}
function drawBullets(){ctx.fillStyle='#ffdf75';for(const b of bullets){ctx.fillRect(b.x,b.y,Math.max(10,H*.022),Math.max(3,H*.006))}}
function shoot(){if(!running){start();return}if(paused||shotCooldown>0)return;shotCooldown=.17;muzzleFlash=.07;bullets.push({x:playerX()+H*.12,y:ground()-jumpY-H*(duckTime>0?.12:.21),speed:Math.max(550,W*.8)})}
function hud(){document.getElementById('points').textContent='PUNTI: '+score;document.getElementById('hearts').innerHTML=Array.from({length:3},(_,i)=>'<span class="heart '+(i>=health?'heart-lost':'')+'">♥</span>').join('');stats.textContent='TRAGUARDO: '+Math.max(0,200-Math.floor(distance))+' m'}
function update(dt){
 if(!running||paused)return;
 scroll+=SPEED*dt;distance+=dt*5;phase+=dt*15;
 shotCooldown=Math.max(0,shotCooldown-dt);muzzleFlash=Math.max(0,muzzleFlash-dt);if(fireHeld&&shotCooldown===0)shoot();
 for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.speed*dt;let hit=false;for(const t of ticks){const x=t.x-scroll;if(t.alive&&Math.abs(b.x-x)<H*.055&&Math.abs(b.y-(ground()-H*.055))<H*.095){t.alive=false;score+=100;hit=true;break}}if(hit||b.x>W+40)bullets.splice(i,1)}
 for(const t of ticks){const x=t.x-scroll;if(t.alive&&invulnerable===0&&Math.abs(x-playerX())<H*.075&&jumpY<H*.09){t.alive=false;health--;invulnerable=1.2;if(health<=0){running=false;message.textContent='PARTITA TERMINATA — TOCCA PER RIPROVARE';message.style.display='block'}}}
 if(duckTime>0)duckTime=Math.max(0,duckTime-dt);
 if(invulnerable>0)invulnerable=Math.max(0,invulnerable-dt);
 if(jumpY>0||vy>0){jumpY+=vy*dt;vy-=GRAVITY*dt;if(jumpY<=0){jumpY=0;vy=0}}
 for(const o of obstacles){const x=o.x-scroll,w=H*.13;if(!o.hit&&x<playerX()+H*.05&&x+w>playerX()-H*.05){o.hit=true;if(jumpY<H*.12&&invulnerable===0){health--;invulnerable=1.1;if(health<=0){running=false;message.textContent='PARTITA TERMINATA — TOCCA PER RIPROVARE';message.style.display='block'}}else score+=20}}
 if(distance>=200){running=false;message.textContent='MISSIONE COMPLETATA — TOCCA PER RIPROVARE';message.style.display='block'}hud();
}
function frame(t){const dt=Math.min((t-last)/1000||0,.05);last=t;update(dt);background();drawObstacles();drawTicks();drawPlayer();drawBullets();requestAnimationFrame(frame)}
function start(){running=true;paused=false;score=0;health=3;distance=0;scroll=0;vy=0;jumpY=0;duckTime=0;phase=0;invulnerable=0;shotCooldown=0;muzzleFlash=0;fireHeld=false;bullets.length=0;ticks.forEach(t=>t.alive=true);obstacles.forEach(o=>o.hit=false);message.style.display='none';hud()}
function jump(){if(!running){start();return}if(!paused&&jumpY===0){vy=H*1.13;duckTime=0}}
function duck(){if(!running){start();return}if(!paused)duckTime=.7}
function move(direction){if(!running){start();return}if(!paused){scroll=Math.max(0,scroll+direction*H*.17);distance=Math.max(0,distance+direction*.4)}}
function pause(){if(!running)return;paused=!paused;message.textContent='IN PAUSA — TOCCA PER RIPRENDERE';message.style.display=paused?'block':'none'}
for(const [id,fn] of [['left',()=>move(-1)],['right',()=>move(1)],['jump',jump],['duck',duck],['pause',pause]])document.getElementById(id).addEventListener('pointerdown',e=>{e.preventDefault();fn()});
const fireButton=document.getElementById('shoot');fireButton.addEventListener('pointerdown',e=>{e.preventDefault();fireHeld=true;shoot()});for(const event of ['pointerup','pointercancel','pointerleave'])fireButton.addEventListener(event,()=>fireHeld=false);
message.addEventListener('pointerdown',()=>{if(paused)pause();else start()});canvas.addEventListener('pointerdown',()=>{if(!running)start()});
addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a')move(-1);if(e.key==='ArrowRight'||e.key==='d')move(1);if(e.key==='ArrowUp'||e.key===' ')jump();if(e.key==='ArrowDown')duck();if(e.key==='Escape')pause();if(e.key==='f'||e.key==='Control')shoot()});
requestAnimationFrame(frame);
