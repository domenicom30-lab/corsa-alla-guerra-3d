import {sprites,pixelBackdrop} from './pixel-art.js';
import {loadSpritePacks,spritePacksReady,drawRaster,drawRasterBackground,spritePackError} from './sprite-loader.js';
import {heroDimensions,troopDimensions,vehicleDimensions} from './arcade-proportions.js';
import {vehicleInteraction} from './vehicle-controls.js';
import {createArcadeCombatMoves} from './arcade-combat-moves.js';
import {grenadeThreat,drawGrenadeThreat} from './grenade-threat.js';
import {createGameInterface} from './game-interface.js';
import {prepareHeroFrames,drawHeroFrame} from './hero-animation.js';
import {createArcadeSpectacle} from './arcade-spectacle.js';
import {createBattleCasualties} from './battle-aftermath.js';
import {segmentHitsRect,rocketSplashDamage,drawRocketProjectile} from './arcade-arsenal.js';
import {nearestRectHit} from './collision-order.js';
import {createTroopWaves,resetTroopWaves,advanceTroopWaves,damageTroop,suppressTroop} from './enemy-director.js';
import {prepareTroopSprites,drawTroop,drawFallenTroop} from './troop-art.js';
import {STAGES,stageAt,drawStageBackdrop,drawStageMarker} from './stage-art.js';
// Protagonist animation is now supplied by mandatory pre-rendered PNG atlases.
import {loadArcadeArt,arcadeArt,paintArcadeBackground,drawArcadeSoldierFrame} from './arcade-art.js';
loadArcadeArt();
import {createArcadeSystems} from './arcade-mechanics.js';
import {loadSoldierFrames,drawSoldierFrame} from './soldier-frames.js';
loadSoldierFrames();
import {prepareEnemyFrames,drawEnemyFrame,prepareSentryFrames,drawSentryFrame} from './enemy-frames.js';
prepareEnemyFrames();prepareSentryFrames(); // Troop PNG sprites are mandatory at runtime.
import './style.css';
import {drawBattleAtmosphere,drawArcadeForeground,drawBossDeathCinematic,drawWarzoneParallax,drawArcadeStorm} from './arcade-cinematics.js';
// Side-scrolling 2D platform runner: fixed-size sprites, horizontal world, no depth projection.
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const message=document.getElementById('message'),stats=document.getElementById('stats');
let rasterLoaded=false,rasterError=null,missionSeconds=0,audioMuted=false,graphicsQuality='auto';
try{const setting=JSON.parse(localStorage.getItem('cag_2d_settings')||'{}');audioMuted=!!setting.muted;if(['auto','high','battery'].includes(setting.quality))graphicsQuality=setting.quality}catch(_){}
const gameMenu=createGameInterface({initialMuted:audioMuted,initialQuality:graphicsQuality,
 onPlay:()=>{if(gameMenu.mode==='error'){location.reload();return}if(paused)pause();else start()},
 onRestart:()=>{victoryRestartAt=0;continueUntil=0;start()},
 onAudio:muted=>{audioMuted=muted;if(audioEngine&&muted)audioEngine.suspend().catch(()=>{});if(audioEngine&&!muted)audioEngine.resume().catch(()=>{});saveSettings()},
 onQuality:value=>{graphicsQuality=value;resize();saveSettings()}});
function saveSettings(){try{localStorage.setItem('cag_2d_settings',JSON.stringify({muted:audioMuted,quality:graphicsQuality}))}catch(_){} }
loadSpritePacks().then(()=>{rasterLoaded=true;gameMenu.start();if(!running){message.textContent='MISSIONE 01 — TOCCA PER GIOCARE';message.style.display='none'}})
 .catch(error=>{rasterError=error;running=false;gameMenu.error(error.message);message.textContent='ERRORE SPRITE: '+error.message;message.style.display='none'});
let W=0,H=0,dpr=1,last=0,running=false,paused=false,score=0,health=3,distance=0;
let scroll=0,vy=0,jumpY=0,duckTime=0,landTime=0,phase=0,invulnerable=0,shotCooldown=0,muzzleFlash=0,fireHeld=false;
const movement={left:false,right:false};
let arcadeCredits=3,continueUntil=0,arcadeHitstop=0,bossBerserk=false,aimUp=false,duckHeld=false;
function showContinue(){
 running=false;fireHeld=false;clearTouchMovement();movement.left=false;movement.right=false;
 if(arcadeCredits>0){continueUntil=performance.now()+9000;message.textContent='CONTINUE? · '+arcadeCredits+' CREDITI · TOCCA PER CONTINUARE';}
 else{continueUntil=0;message.textContent='GAME OVER — TOCCA PER RIPROVARE'}
 message.style.display='block';
}
function continueArcade(){
 if(!continueUntil||performance.now()>continueUntil||arcadeCredits<=0)return false;
 arcadeCredits--;continueUntil=0;health=3;invulnerable=2;running=true;paused=false;
 message.style.display='none';gameMenu.playMode();last=0;hud();soundEffect('enter');return true;
}

let arcadeHighScore=0;
try{arcadeHighScore=Math.max(0,Number(localStorage.getItem('corsa_alla_guerra_hi')||0)||0)}catch(_){}
function saveArcadeHighScore(){
 if(score<=arcadeHighScore)return;
 arcadeHighScore=score;
 try{localStorage.setItem('corsa_alla_guerra_hi',String(arcadeHighScore))}catch(_){}
}
let facing=1;
let bossVictoryAwarded=false;
let bossDeathTime=-1;
let bossDeathX=0;
const VICTORY_RESTART_DELAY_MS=6000;
let victoryRestartAt=0;
let runCycle=0;
let horizontalSpeed=0;
let jumpHeld=false;
let recoil=0;
const ride={x:750,hp:100,maxHp:100,occupied:false,cooldown:0,flash:0,fireAnimation:0};
const combatMoves=createArcadeCombatMoves();
let audioEngine=null,noiseBuffer=null;
let missionBanner=0,bossAlertShown=false,stageIndex=0;

let musicStep=0,musicNext=0;
const bassLine=[110,110,123.47,130.81,98,98,110,130.81];
const melodyLine=[220,261.63,329.63,392,440,392,329.63,261.63];
function scheduleChipNote(frequency,wave,duration,volume,time){
 const osc=audioEngine.createOscillator(),gain=audioEngine.createGain();
 osc.type=wave;osc.frequency.setValueAtTime(frequency,time);
 gain.gain.setValueAtTime(volume,time);
 gain.gain.exponentialRampToValueAtTime(.001,time+duration);
 osc.connect(gain);gain.connect(audioEngine.destination);
 osc.start(time);osc.stop(time+duration+.01);
}
function updateArcadeMusic(){
 if(audioMuted||!audioEngine||audioEngine.state!=='running'||!running||paused||!visible){musicNext=0;return}
 const now=audioEngine.currentTime;
 if(!musicNext||musicNext<now-.4)musicNext=now+.04;
 let count=0;
 while(musicNext<now+.18&&count++<3){
  scheduleChipNote(bassLine[musicStep%8],'triangle',.17,.035,musicNext);
  if(musicStep%2===0)scheduleChipNote(melodyLine[(musicStep/2)%8],'square',.11,.022,musicNext);
  musicStep++;musicNext+=.18;
 }
}

function soundEffect(type){
 if(audioMuted)return;
 try{
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return;
  if(!audioEngine)audioEngine=new C();
  if(audioEngine.state==='suspended')audioEngine.resume().catch(()=>{});
  const oscillator=audioEngine.createOscillator(),gain=audioEngine.createGain(),now=audioEngine.currentTime;
  const configs={shoot:['square',520,115,.07,.075],cannon:['sawtooth',170,35,.3,.15],explosion:['triangle',110,25,.32,.18],enter:['sine',330,150,.13,.06]};
  const [wave,start,end,duration,volume]=configs[type]||configs.shoot;
  oscillator.type=wave;oscillator.frequency.setValueAtTime(start,now);
  oscillator.frequency.exponentialRampToValueAtTime(end,now+duration);
  gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
  oscillator.connect(gain);gain.connect(audioEngine.destination);
  oscillator.start(now);oscillator.stop(now+duration+.01);
  if(type!=='enter'){
   if(!noiseBuffer){noiseBuffer=audioEngine.createBuffer(1,16384,audioEngine.sampleRate);const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1}
   const noise=audioEngine.createBufferSource(),filter=audioEngine.createBiquadFilter(),envelope=audioEngine.createGain();
   const noiseDuration=type==='explosion'?.33:type==='cannon'?.25:.085;
   noise.buffer=noiseBuffer;noise.loop=true;noise.playbackRate.value=type==='shoot'?1.5:.85;
   filter.type=type==='shoot'?'highpass':'lowpass';filter.frequency.value=type==='shoot'?1300:type==='cannon'?600:350;
   envelope.gain.setValueAtTime(type==='shoot'?.055:.11,now);
   envelope.gain.exponentialRampToValueAtTime(.001,now+noiseDuration);
   noise.connect(filter);filter.connect(envelope);envelope.connect(audioEngine.destination);
   noise.start(now);noise.stop(now+noiseDuration+.005);
  }
 }catch(_){}
}
function currentVehicleInteraction(){return vehicleInteraction({
 running,paused,occupied:ride.occupied,hp:ride.hp,
 vehicleX:ride.x,playerX:scroll+playerX(),H
})}
function toggleRide(){
 const action=currentVehicleInteraction().action;
 if(action!=='enter'&&action!=='exit')return;
 ride.occupied=action==='enter';ride.cooldown=0;horizontalSpeed=0;
 if(ride.occupied){ride.x=scroll+playerX();jumpY=0;vy=0;landTime=0;duckHeld=false;duckTime=0}
 else{jumpY=Math.max(jumpY,H*.035);vy=H*.38}
 soundEffect('enter');hud();updateVehicleButton();
}
function drawRide(){
 const x=ride.x-scroll;if(x< -H*.55||x>W+H*.55)return;
 if(spritePacksReady()){
  const h=H*.29,w=h*400/250,animation=ride.fireAnimation>0?(ride.fireAnimation>.10?5:4):ride.occupied?1+Math.floor(runCycle*.9)%3:0;
  ctx.save();ctx.translate(x,ground());ctx.scale(facing,1);
  ctx.imageSmoothingEnabled=false;
  drawRaster(ctx,'vehicles','slug',animation,-w*.5,-h,w,h);
  if(ride.fireAnimation>0){
   // Muzzle flash is tied to the actual cannon recoil, not to driving animation.
   const alpha=Math.min(1,ride.fireAnimation*7);
   ctx.globalAlpha=alpha;ctx.fillStyle='#fff4ba';
   ctx.beginPath();ctx.moveTo(w*.43,-h*.47);ctx.lineTo(w*.54,-h*.43);
   ctx.lineTo(w*.43,-h*.38);ctx.closePath();ctx.fill();
   ctx.fillStyle='#f18b35';ctx.fillRect(w*.45,-h*.44,w*.07,h*.025);
   ctx.globalAlpha=1;
  }
  if(ride.hp<40){ctx.globalAlpha=.20+Math.sin(phase*.7)*.12;ctx.fillStyle='#352e29';ctx.fillRect(-w*.42,-h*.7,w*.82,h*.35)}
  ctx.restore();
  return;
 }
 const u=vehicleDimensions(H).h/19,t=ride.occupied?runCycle*3:0;
 ctx.save();ctx.translate(x,ground());ctx.imageSmoothingEnabled=false;
 const box=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x*u,y*u,w*u,h*u)};
 const dead=ride.hp<=0,steel=dead?'#443d39':'#525d4b',light=dead?'#66544a':'#89917a';
 // Armored tracked chassis, road wheels and animated track links.
 box(-20,-9,40,10,'#171d1c');box(-19,-8,38,8,'#30382f');
 for(let i=-17;i<=17;i+=4){box(i,-9,3,2,'#6c705e');box(i,-2,3,2,'#727865')}
 for(let i=-14;i<=14;i+=7){ctx.fillStyle='#151a19';ctx.beginPath();ctx.arc(i*u,-5*u,3.1*u,0,Math.PI*2);ctx.fill();ctx.fillStyle='#929581';ctx.beginPath();ctx.arc(i*u,-5*u,1.6*u,0,Math.PI*2);ctx.fill();box(i-1,-6,2,2,'#444e45')}
 for(let i=0;i<9;i++){const px=-18+((i*5+Math.floor(t))%37);box(px,-10,3,1,'#9b9b82')}
 box(-17,-17,34,10,'#202923');box(-15,-19,30,11,steel);box(-13,-18,25,2,light);
 box(-15,-11,30,2,'#29372d');box(-16,-15,4,5,'#39483b');
 for(let i=0;i<5;i++)box(-10+i*5,-14,2,3,'#333d33');
 // Sloped turret, commander hatch, heavy gun barrel and muzzle brake.
 ctx.fillStyle=steel;ctx.beginPath();ctx.moveTo(-11*u,-19*u);ctx.lineTo(-7*u,-25*u);ctx.lineTo(8*u,-25*u);ctx.lineTo(14*u,-19*u);ctx.closePath();ctx.fill();
 box(-5,-26,11,2,light);box(8,-22,23,4,'#252d29');box(12,-21,21,2,'#707969');box(29,-23,5,6,'#343d34');box(32,-22,2,4,'#a0a68e');
 box(-3,-28,10,3,'#242d28');box(-1,-29,6,1,'#a1a58e');box(-13,-20,4,2,'#a1a58e');
 if(ride.occupied&&!dead){box(-2,-32,6,5,'#b68c6a');box(-3,-34,8,3,'#333e34');box(2,-31,2,1,'#292d28')}
 if(dead){box(-13,-17,4,5,'#1d2020');box(4,-21,5,4,'#242323')}
 ctx.restore();
 if(!ride.occupied&&!dead&&Math.abs(ride.x-scroll-playerX())<H*.24){
 ctx.fillStyle='#ffe19a';ctx.font='bold '+Math.max(12,H*.022)+'px monospace';
 ctx.fillText('ENTRA ↓',x-H*.065,ground()-vehicleDimensions(H).h*34/19-H*.045)
}
}
const rideButton=document.getElementById('vehicle-toggle');
let vehicleButtonCache='';
function updateVehicleButton(){
 const state=currentVehicleInteraction();
 const key=state.action+':'+state.label+':'+state.visible;
 if(key===vehicleButtonCache)return;
 vehicleButtonCache=key;
 rideButton.hidden=!state.visible;
 rideButton.disabled=state.disabled;
 rideButton.textContent=state.label;
 rideButton.setAttribute('aria-label',state.label);
 rideButton.dataset.vehicleAction=state.action;
}
rideButton.addEventListener('pointerdown',e=>{e.preventDefault();if(!rideButton.disabled)toggleRide()});

// Lightweight arcade feedback: bounded brass casings, muzzle glows and transient hit flashes.
const casings=[];
let hitFlash=0;
function ejectCasing(){
 if(casings.length>=48)casings.shift();
 casings.push({x:playerX()-facing*H*.025,y:ground()-jumpY-H*.19,vx:-facing*H*(.12+Math.random()*.09),vy:-H*(.16+Math.random()*.08),life:1.15});
}
function drawCasings(){
 for(const c of casings){
  const w=Math.max(3,H*.010),h=Math.max(2,H*.004);
  ctx.save();ctx.translate(c.x,c.y);ctx.rotate((c.x+c.y)*.021);
  ctx.fillStyle='#271f1a';ctx.fillRect(-w*.5,-h*.5,w,h);
  ctx.fillStyle='#dfb965';ctx.fillRect(-w*.4,-h*.45,w*.8,h*.65);
  ctx.fillStyle='#fff2bd';ctx.fillRect(-w*.37,-h*.4,w*.25,h*.19);
  ctx.fillStyle='#82643b';ctx.fillRect(w*.3,-h*.5,w*.13,h);
  ctx.restore();
 }
}
function drawArcadeFlash(){
 if(hitFlash>0){ctx.save();ctx.globalAlpha=Math.min(.27,hitFlash*.75);ctx.fillStyle='#fff3cf';ctx.fillRect(0,0,W,H);ctx.restore()}
 if(muzzleFlash>0){ctx.save();ctx.globalAlpha=Math.min(.65,muzzleFlash*9);ctx.fillStyle='#ffd37a';ctx.beginPath();ctx.arc(playerX()+facing*H*(ride.occupied?.2:.13),ground()-jumpY-H*.18,H*(ride.occupied?.08:.035),0,Math.PI*2);ctx.fill();ctx.restore()}
}
const arcade=createArcadeSystems();
const spectacle=createArcadeSpectacle();
const aftermath=createBattleCasualties();
const bullets=[];
const particles=[];
const blastEffects=[];
const dustPuffs=[];
const enemyDebris=[];
const ticks=Array.from({length:25},(_,i)=>({x:1050+i*520,y:0,alive:true,phase:i*.7}));
const sentries=createTroopWaves();
const SPEED=250,GRAVITY=1900;
const MOVE_ACCELERATION=1050,MOVE_DECELERATION=1450;
const FALL_MULTIPLIER=2.5,LOW_JUMP_MULTIPLIER=2;
const MAX_PARTICLES=180;
let frameClock=0;
let visible=true;
document.addEventListener('visibilitychange',()=>{visible=!document.hidden;last=0;if(!visible){fireHeld=false;clearTouchMovement();movement.left=false;movement.right=false;duckHeld=false;if(running&&!paused){gameMenu.pause();paused=true;message.textContent='IN PAUSA — TOCCA PER RIPRENDERE';message.style.display='block'}}});
function resize(){W=innerWidth;H=innerHeight;const pixelBudget=graphicsQuality==='battery'?900000:graphicsQuality==='high'?3800000:2400000;dpr=Math.min(devicePixelRatio||1,graphicsQuality==='battery'?1.25:graphicsQuality==='high'?2.5:2,Math.sqrt(pixelBudget/Math.max(1,W*H)));canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function ground(){return H*.78}
function playerX(){return W*.22}
function isCrouching(){return duckHeld||duckTime>0||combatMoves.sliding}

function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
const backdrop=document.createElement('canvas');backdrop.width=960;backdrop.height=540;const bg=backdrop.getContext('2d');
function background(){
 ctx.imageSmoothingEnabled=false;
 if(!drawRasterBackground(ctx,stageAt(scroll),W,H,scroll,ground())){
  if(!paintArcadeBackground(ctx,W,H,scroll))pixelBackdrop(ctx,W,H,scroll);
  drawWarzoneParallax(ctx,W,H,scroll,ground());
  drawStageBackdrop(ctx,W,H,scroll,ground(),phase);
 }
 spectacle.drawBack(ctx,W,H,scroll,ground());
 // Stage-specific original scenery rather than the same repeated tower and crates.
 const props=['forestPost','ruinHouse','factoryMachinery','fortressGate'];
 for(let i=0;i<14;i++){
  const world=420+i*670,x=world-scroll;
  if(x<-H*.70||x>W+H*.65)continue;
  const zone=stageAt(world),name=props[zone];
  const h=H*(zone===0?.29:zone===1?.34:zone===2?.31:.38),w=h*480/320;
  // Keep first forest watchtower as a distinct landmark, not a repeated prop.
  if(i===0&&zone===0)ctx.drawImage(arcadeArt.tower||sprites.tower,x,ground()-H*.47,H*.27,H*.47);
  else drawRaster(ctx,'props',name,0,x-w*.5,ground()-h,w,h);
  // Smaller piles alternate without making every encounter geometrically identical.
  if(i%4===2)ctx.drawImage(arcadeArt.sandbags||sprites.sandbags,x+w*.14,ground()-H*.07,H*.12,H*.07);
 }
}
function drawPlayer(){
 const {h,w}=heroDimensions(H,isCrouching()),runFrame=jumpY>0?1:Math.floor(runCycle)%8;
 const x=playerX()-w*.5,y=ground()-jumpY-h;
 ctx.save();ctx.globalAlpha=.24*Math.max(.3,1-jumpY/H);ctx.fillStyle='#17150e';ctx.beginPath();ctx.ellipse(playerX(),ground()+H*.006,w*.4,H*.012,0,0,Math.PI*2);ctx.fill();ctx.restore();
 const moving=Math.abs(horizontalSpeed)>SPEED*.09;
 const footstepBob=moving&&jumpY===0&&!isCrouching()?Math.abs(Math.sin(runCycle*Math.PI)) * H*.006:0;
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(recoil>0)ctx.translate(-facing*recoil*H*.01,0);
 if(facing<0){ctx.translate(playerX()*2,0);ctx.scale(-1,1)}
 // Keep character readable while invulnerable: use a subtle outline, not transparency.
 if(invulnerable>0&&Math.floor(invulnerable*12)%2===0){ctx.shadowColor='#f8e2a1';ctx.shadowBlur=H*.014;}
 const sheet=arcadeArt.soldier;
 const pose=hitFlash>0?'hurt':combatMoves.slashActive?'melee':combatMoves.sliding?'slide':isCrouching()?(muzzleFlash>0||fireHeld?'duckFire':'duck'):aimUp?'aimUp':jumpY>0?'jump':landTime>0?'land':moving?(muzzleFlash>0||fireHeld?'runFire':'run'):muzzleFlash>0||fireHeld?'fire':'idle';
 const frame=pose==='slide'?Math.floor(phase*.9)%6:pose==='melee'?Math.floor(phase*.9)%5:pose==='land'?Math.min(3,Math.floor((.22-landTime)/.055)):pose==='run'||pose==='runFire'?runFrame:pose==='fire'||pose==='duckFire'?Math.floor(phase*.9)%4:pose==='idle'||pose==='aimUp'?Math.floor(phase*.2)%4:pose==='jump'?Math.min(2,Math.floor(Math.abs(vy)/Math.max(1,H))):Math.floor(phase*.3)%3;
 drawRaster(ctx,'hero',pose,frame,x,y-footstepBob,w,h);
 if(muzzleFlash>0){const mx=aimUp?x+w*.57:x+w*.95,my=aimUp?y+h*.08:y+h*.48,flash=H*(.032+.013*Math.min(1,muzzleFlash/.07));ctx.save();if(spritePacksReady())drawRaster(ctx,'fx','muzzle',Math.floor(phase*.9)%6,mx-H*.012,my-H*.048,H*.1,H*.08);if(aimUp){ctx.translate(mx,my);ctx.rotate(-Math.PI/2);ctx.translate(-mx,-my)}ctx.fillStyle='#fff6c8';ctx.fillRect(mx,my-H*.006,flash*.6,H*.012);ctx.fillStyle='#ffc34e';ctx.beginPath();ctx.moveTo(mx,my-H*.015);ctx.lineTo(mx+flash,my);ctx.lineTo(mx,my+H*.015);ctx.closePath();ctx.fill();ctx.fillStyle='#f08b27';ctx.fillRect(mx+flash*.7,my-H*.004,flash*.28,H*.008);for(let i=0;i<3;i++){const sparkX=mx+flash*(.55+i*.23),sparkY=my+(i-1)*H*.023;ctx.fillStyle=i===1?'#fff3a1':'#f5a83e';ctx.fillRect(sparkX,sparkY,Math.max(2,H*.005),Math.max(2,H*.005))}ctx.restore()}
 ctx.restore();
}
function drawCombatMoves(){
 if(!combatMoves.sliding&&!combatMoves.slashActive)return;
 ctx.save();
 if(combatMoves.sliding){
  const f=combatMoves.slideFraction,x=playerX(),y=ground()-H*.035;
  ctx.globalAlpha=Math.min(.8,f+.15);
  for(let i=0;i<4;i++){
   ctx.fillStyle=i%2?'#ded0a0':'#766f58';
   ctx.fillRect(x-facing*H*(.10+i*.045),y-H*(.007+(i%2)*.013),H*(.016+i*.004),H*.008);
  }
 }
 if(combatMoves.slashActive){
  const f=combatMoves.slashFraction,x=playerX()+facing*H*.095,y=ground()-jumpY-H*.13;
  ctx.translate(x,y);ctx.scale(facing,1);
  ctx.globalAlpha=Math.min(1,(1-f)*2.3);
  ctx.lineWidth=Math.max(3,H*.008);ctx.strokeStyle='#fff3cd';
  ctx.beginPath();ctx.arc(0,0,H*.11,-1.1,1.35);ctx.stroke();
  ctx.lineWidth=Math.max(2,H*.004);ctx.strokeStyle='#ffbb62';
  ctx.beginPath();ctx.arc(0,0,H*.125,-.9,1.15);ctx.stroke();
 }
 ctx.restore();
}
function slide(){
 if(!running){start();return}
 if(paused||ride.occupied)return;
 if(combatMoves.startSlide(Number(movement.right)-Number(movement.left)||facing,jumpY===0,ride.occupied)){
  duckTime=0;duckHeld=false;shotCooldown=Math.max(shotCooldown,.11);
  soundEffect('enter');
 }
}
function drawTicks(){
 for(const t of ticks){if(!t.alive)continue;const x=t.x-scroll,y=ground()-H*.065+Math.sin(phase*1.7+t.phase)*H*.006,w=H*.095,h=H*.078;
 if(x<-w||x>W+w)continue;ctx.imageSmoothingEnabled=false;ctx.save();ctx.globalAlpha=.25;ctx.fillStyle='#201910';ctx.beginPath();ctx.ellipse(x,ground()+H*.006,w*.48,H*.009,0,0,Math.PI*2);ctx.fill();ctx.restore();drawEnemyFrame(ctx,Math.floor(phase*1.4+t.phase)%8,x-w*.5,y-h*.5,w,h);
 }
}
function drawSentries(){
 for(const e of sentries){
  if(!e.alive)continue;
  const x=e.x-scroll;if(x<-H*.48||x>W+H*.48)continue;
  const facingPlayer=e.x>scroll+playerX()?-1:1;
  const {h,w}=troopDimensions(H,e.type,e.stance==='crouch'||e.dodgeTime>0);
  ctx.save();ctx.translate(x,0);
  if(facingPlayer<0)ctx.scale(-1,1);
  if(e.flinch>0){ctx.shadowColor='#fff4ca';ctx.shadowBlur=H*.015}
  if(e.dodgeTime>0){ctx.translate(0,H*.018);ctx.rotate(Math.sin(e.walk*1.4)*.06)}
   const enemyPose=e.flinch>0?'Hurt':(e.stance==='crouch'||e.suppressed>0||e.dodgeTime>0)?'Crouch':(e.fireFlash>0||e.windup>0||e.meleeWindup>0||e.meleeFlash>0)?(e.type==='grenadier'?'Throw':'Fire'):'';
   const enemyFrame=enemyPose==='Hurt'
     ?Math.min(3,Math.floor(Math.max(0,.20-e.flinch)/.05))
     :enemyPose==='Crouch'
       ?Math.floor(phase*.48+e.phase)%4
       :enemyPose==='Fire'||enemyPose==='Throw'
         ?(e.fireFlash>0||e.meleeFlash>0?3:e.meleeWindup>0?Math.min(2,Math.floor((1-e.meleeWindup/.28)*3)):Math.min(2,Math.floor((1-e.windup/(e.type==='grenadier'?.58:e.type==='heavy'?.46:.29))*3)))
         :Math.floor(e.walk+(e.vx?0:phase*.25)+e.phase)%8;
   drawRaster(ctx,'enemies',e.type+enemyPose,enemyFrame,-w*.5,ground()-h,w,h);
  ctx.restore();
  if(e.suppressed>0){
   ctx.save();ctx.globalAlpha=Math.min(.85,e.suppressed*1.8);
   ctx.fillStyle='#f4d38c';ctx.font='bold '+Math.max(11,H*.019)+'px monospace';
   ctx.fillText('↓',x-H*.012,ground()-h-H*.018);
   ctx.restore();
  }
  if(e.meleeWindup>0){
   // Threat indicator grows during the brief close-quarters windup.
   const readiness=1-e.meleeWindup/.28;
   ctx.save();ctx.fillStyle='#260f14';
   ctx.fillRect(x-H*.024,ground()-h-H*.066,H*.048,H*.044);
   ctx.fillStyle=readiness>.6?'#ffb75a':'#ffe2af';
   ctx.font='900 '+Math.max(13,H*.027)+'px system-ui';
   ctx.textAlign='center';ctx.fillText('!',x,ground()-h-H*.03);
   ctx.restore();
  }
  if(e.windup>0){
   if(e.type==='grenadier'){
    const threat=grenadeThreat(x,ground(),H,facingPlayer);
    drawGrenadeThreat(ctx,threat,H,e.windup,phase,W);
   }
   const p=Math.min(1,e.windup/(e.type==='grenadier'?.58:e.type==='heavy'?.46:.29));
   ctx.save();ctx.globalAlpha=.65+Math.sin(phase*.65)*.3;
   ctx.fillStyle='#211d1b';ctx.fillRect(x-H*.030,ground()-h-H*.034,H*.06,H*.014);
   ctx.fillStyle=e.type==='heavy'?'#fa8443':'#ffe5a3';
   ctx.fillRect(x-H*.028,ground()-h-H*.031,H*.056*(1-p),H*.009);
   ctx.restore();
  }
  if(e.fireFlash>0){const flash=H*(.038+e.fireFlash*.09),mx=x+facingPlayer*w*.33,my=ground()-h*.49;
   ctx.save();ctx.globalAlpha=Math.min(1,e.fireFlash*10);
   ctx.translate(mx,my);if(facingPlayer<0)ctx.scale(-1,1);
   drawRaster(ctx,'fx','muzzle',Math.floor(phase*.66)%6,0,-flash*.5,flash*1.7,flash);
   ctx.restore()
  }
  if(e.maxHp>1&&e.hp>0&&e.hp<e.maxHp){
   ctx.fillStyle='#232c2a';ctx.fillRect(x-H*.029,ground()-h-H*.047,H*.058,H*.006);
   ctx.fillStyle='#d6b374';ctx.fillRect(x-H*.029,ground()-h-H*.047,H*.058*e.hp/e.maxHp,H*.006);
  }
 }
}
function drawBullets(){
 for(const b of bullets){
  if(b.kind==='rocket'){drawRocketProjectile(ctx,b,H,phase);continue}
  const dir=Math.sign(b.vx)||1;
  const len=Math.max(12,H*.032),tail=b.x-dir*len*.9,thick=Math.max(3,H*.006);
  ctx.fillStyle=b.kind==='heavy'?'#245e7b':'#8c4b2c';
  ctx.fillRect(tail-dir*len*.45,b.y+thick*.2,len*.55,thick*.65);
  ctx.fillStyle=b.kind==='heavy'?'#a9e9ff':'#ffeeb0';
  ctx.fillRect(b.x-(dir<0?len:0),b.y,len,thick);
  ctx.fillStyle=b.kind==='heavy'?'#e7ffff':'#fff8d1';
  ctx.fillRect(b.x-dir*len*.18,b.y,Math.max(3,len*.3),Math.max(2,thick*.55));
  ctx.fillStyle='#e87d28';
  ctx.fillRect(b.x-dir*5-(dir<0?len*.45:0),b.y+1,Math.max(5,H*.012),Math.max(2,H*.004));
 }
}
function burst(x,y){spectacle.explosion(x,y,.7);blastEffects.push({x,y,life:.48,maxLife:.48});if(blastEffects.length>16)blastEffects.shift();for(let i=0;i<13;i++){const angle=i*Math.PI*2/13;if(particles.length>=MAX_PARTICLES)particles.shift();particles.push({x,y,vx:Math.cos(angle)*(80+i*9),vy:Math.sin(angle)*(80+i*7)-60,life:.38+i*.012,color:i%3===0?'#ffdc6b':i%3===1?'#ee5828':'#aa181b'})}}
function drawBlastEffects(){for(const e of blastEffects){const progress=1-e.life/e.maxLife;if(spritePacksReady()){const width=H*(.20+progress*.23);drawRaster(ctx,'fx','explosion',Math.min(9,Math.floor(progress*10)),e.x-width*.5,e.y-width*.5,width,width);continue;}const radius=H*(.025+progress*.18);ctx.save();ctx.imageSmoothingEnabled=false;const frame=Math.min(7,Math.floor(progress*8));const core=H*(.028+Math.sin(Math.PI*progress)*.095);if(frame<6){for(let i=0;i<8;i++){const a=i*Math.PI/4+frame*.17,r=core*(.65+(i%3)*.22),size=Math.max(2,H*.016*(1-progress));ctx.fillStyle=i%3===0?'#fff2a0':i%3===1?'#ffb13e':'#e95127';ctx.fillRect(Math.round(e.x+Math.cos(a)*r),Math.round(e.y+Math.sin(a)*r),Math.ceil(size),Math.ceil(size))}ctx.fillStyle=frame<2?'#fff8c6':frame<4?'#ffcf65':'#e46b35';ctx.fillRect(Math.round(e.x-core*.5),Math.round(e.y-core*.5),Math.ceil(core),Math.ceil(core))}ctx.globalAlpha=Math.max(0,1-progress);ctx.strokeStyle=progress<.45?'#fff4a3':'#ff7a30';ctx.lineWidth=Math.max(3,H*.013*(1-progress*.6));ctx.beginPath();ctx.arc(e.x,e.y,radius,0,Math.PI*2);ctx.stroke();for(let i=0;i<10;i++){const angle=i*Math.PI/5+progress*.45;const dist=radius*(.65+(i%3)*.16);const size=Math.max(3,H*.016*(1-progress));ctx.fillStyle=i%3===0?'#fff4a3':i%3===1?'#ffae43':'#de4228';ctx.fillRect(e.x+Math.cos(angle)*dist-size/2,e.y+Math.sin(angle)*dist-size/2,size,size)}ctx.restore()}}
function shatterEnemy(x,y){const colors=['#c94e37','#7c2829','#e29b60','#3b2426'];for(let i=0;i<12;i++){const a=i*Math.PI/6;enemyDebris.push({x,y,vx:Math.cos(a)*(55+i*9),vy:Math.sin(a)*(45+i*7)-H*.22,life:.45+(i%4)*.09,size:Math.max(3,H*.008+(i%3)*2),color:colors[i%4]})}if(enemyDebris.length>120)enemyDebris.splice(0,enemyDebris.length-120)}
function drawEnemyDebris(){for(const p of enemyDebris){ctx.save();ctx.globalAlpha=Math.min(1,p.life*2.5);ctx.translate(Math.round(p.x),Math.round(p.y));ctx.rotate((p.x+p.y)*.012);ctx.fillStyle=p.color;ctx.fillRect(-p.size*.5,-p.size*.5,p.size,p.size*.7);ctx.fillStyle='#e9ad70';ctx.fillRect(-p.size*.2,-p.size*.35,Math.max(2,p.size*.35),Math.max(2,p.size*.2));ctx.restore()}}
function drawDust(){for(const p of dustPuffs){ctx.save();ctx.globalAlpha=Math.max(0,p.life/.34)*.52;ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y),Math.max(2,p.size),Math.max(2,p.size*.55));ctx.fillStyle='#d7c6a2';ctx.globalAlpha=Math.max(0,p.life/.34)*.3;ctx.fillRect(Math.round(p.x+p.size*.2),Math.round(p.y-p.size*.25),Math.max(2,p.size*.45),Math.max(2,p.size*.35));ctx.restore()}}
function drawParticles(){for(const p of particles){const size=Math.max(2,H*.007*Math.min(1,p.life/.2));ctx.globalAlpha=Math.min(1,Math.max(0,p.life/.18));ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y),size,size)}ctx.globalAlpha=1}
function shoot(){if(!running){start()}if(!running||paused||shotCooldown>0)return;const worldX=scroll+playerX();const troop=ride.occupied?null:sentries.find(e=>e.alive&&Math.sign(e.x-worldX)===facing&&Math.abs(e.x-worldX)<H*.16);if(troop){combatMoves.slash();shotCooldown=.3;const result=damageTroop(troop,2);spectacle.impact(troop.x-scroll,ground()-H*.14,result.killed?result.points:0);if(result.killed){score+=arcade.kill()+result.points;aftermath.defeated(troop.type,troop.x-scroll,ground(),H,facing,1.4);shatterEnemy(troop.x-scroll,ground()-H*.14);burst(troop.x-scroll,ground()-H*.14)}else aftermath.impact(troop.x-scroll,ground()-H*.14,H,troop.type==='heavy');return}const nearby=ride.occupied?null:arcade.melee(worldX,facing,H,ticks);if(nearby){combatMoves.slash();shotCooldown=.32;score+=arcade.kill();shatterEnemy(nearby.x-scroll,ground()-H*.07);burst(nearby.x-scroll,ground()-H*.07);return}shotCooldown=ride.occupied?.42:arcade.weapon==='rocket'?.55:arcade.weapon==='heavy'?.09:.17;spectacle.shot(playerX()+facing*H*(ride.occupied?.25:.18),ground()-jumpY-H*(ride.occupied?.15:.145),facing,ride.occupied);soundEffect(ride.occupied?'cannon':'shoot');muzzleFlash=.07;recoil=1;if(!ride.occupied)ejectCasing();if(ride.occupied){ride.fireAnimation=.24;bullets.push({x:playerX()+facing*H*.22,y:ground()-H*.16,vx:aimUp?0:facing*Math.max(600,W*.85),vy:aimUp?-Math.max(600,W*.85):0,damage:5,life:1.7,kind:'heavy'});arcade.screenShake=Math.min(12,arcade.screenShake+5)}else{const shots=arcade.fire(playerX()+facing*H*.12,ground()-jumpY-H*(isCrouching()?.075:.145),facing,Math.max(550,W*.8));if(aimUp)for(const shot of shots){shot.vy=-Math.abs(shot.vx);shot.vx=0}bullets.push(...shots)}if(bullets.length>120)bullets.splice(0,bullets.length-120)}
function grenade(){if(!running){start()}if(running&&!paused)arcade.throwGrenade(playerX()+facing*H*.08,ground()-jumpY-H*.2,facing,H)}
function damage(){if(invulnerable>0||!running)return;hitFlash=.2;arcade.screenShake=Math.max(arcade.screenShake,7);invulnerable=1.25;if(ride.occupied&&ride.hp>0){ride.hp=Math.max(0,ride.hp-20);if(ride.hp===0){ride.occupied=false;jumpY=H*.07;vy=H*.42;explosion(playerX(),ground()-H*.14,H*.16)}hud();return}health--;if(health<=0)showContinue()}
function defeatBoss(){if(bossVictoryAwarded)return;bossVictoryAwarded=true;bossDeathTime=0;bossDeathX=arcade.boss.x-scroll;arcade.boss.defeated=true;arcade.boss.active=false;score+=3000;const bossScreenX=arcade.boss.x-scroll;for(let i=0;i<5;i++){burst(bossScreenX+Math.cos(i*Math.PI*2/5)*H*.16,ground()-H*(.24+Math.sin(i*Math.PI*2/5)*.12))}for(let i=0;i<4;i++){shatterEnemy(bossScreenX+(i-1.5)*H*.11,ground()-H*(.18+(i%2)*.12))}arcade.screenShake=Math.max(arcade.screenShake,18);message.textContent='BOSS SCONFITTO — RAGGIUNGI IL TRAGUARDO';message.style.display='block';setTimeout(()=>{if(running&&!paused)message.style.display='none'},1800)}
function explosion(x,y,radius,hostile=false){hitFlash=Math.max(hitFlash,.09);soundEffect('explosion');burst(x,y);if(hostile)return;for(const c of arcade.covers)if(c.hp>0&&Math.abs(c.x-scroll-x)<radius)c.hp=Math.max(0,c.hp-50);for(const e of sentries){if(!e.alive||Math.abs(e.x-scroll-x)>radius)continue;const result=damageTroop(e,rocketSplashDamage(Math.abs(e.x-scroll-x),radius,5));if(result.killed){score+=arcade.kill()+result.points;aftermath.defeated(e.type,e.x-scroll,ground(),H,Math.sign(e.x-scroll-x)||1,2.5);shatterEnemy(e.x-scroll,ground()-H*.14);spectacle.impact(e.x-scroll,ground()-H*.14,result.points)}else aftermath.impact(e.x-scroll,ground()-H*.14,H,e.type==='heavy')}for(const t of ticks){if(t.alive&&Math.abs(t.x-scroll-x)<radius){t.alive=false;score+=arcade.kill();shatterEnemy(t.x-scroll,ground()-H*.07)}}if(arcade.boss.active&&!arcade.boss.defeated&&Math.abs(arcade.boss.x-scroll-x)<radius+H*.2){arcade.boss.hp-=5;arcadeHitstop=3;if(arcade.boss.hp<=0)defeatBoss()}}
function hud(){updateVehicleButton();saveArcadeHighScore();document.getElementById('points').textContent='PUNTI '+score+' · BEST '+arcadeHighScore+' · C '+arcadeCredits;document.getElementById('hearts').innerHTML=Array.from({length:3},(_,i)=>'<span class="heart '+(i>=health?'heart-lost':'')+'">♥</span>').join('');stats.textContent='Z'+(stageAt(scroll)+1)+' · '+Math.max(0,200-Math.floor(distance))+'m · '+arcade.weapon.toUpperCase()+(Number.isFinite(arcade.ammo)?' '+arcade.ammo:'')+' · BOMBE '+arcade.grenadeCount+(arcade.combo>1?' · COMBO x'+arcade.combo:'')+(arcade.boss.active&&!arcade.boss.defeated?' · BOSS '+Math.max(0,Math.ceil(arcade.boss.hp/arcade.boss.maxHp*100))+'%':'')}
function update(dt){
 if(!running||paused)return;
 combatMoves.step(dt);
 missionSeconds+=dt;
 hitFlash=Math.max(0,hitFlash-dt);
 for(let i=casings.length-1;i>=0;i--){const c=casings[i];c.vy+=H*.8*dt;c.x+=c.vx*dt;c.y=Math.min(ground()-H*.007,c.y+c.vy*dt);c.vx*=Math.max(0,1-dt*2);c.life-=dt;if(c.life<=0)casings.splice(i,1)}
 const direction=Number(movement.right)-Number(movement.left);
 const slideDirection=combatMoves.sliding?combatMoves.slidingDir:direction;
 const targetSpeed=(ride.occupied?SPEED*.68:SPEED*combatMoves.slideSpeedFactor)*slideDirection;
 const changeRate=slideDirection!==0?MOVE_ACCELERATION*1.35:MOVE_DECELERATION;
 const deltaSpeed=targetSpeed-horizontalSpeed;
 horizontalSpeed+=Math.sign(deltaSpeed)*Math.min(Math.abs(deltaSpeed),changeRate*dt);
 const advance=horizontalSpeed*dt;
 const previousScroll=scroll;
 scroll=Math.max(0,Math.min(10000,scroll+advance));if(ride.occupied){ride.x=scroll+playerX();ride.cooldown=Math.max(0,ride.cooldown-dt)}ride.fireAnimation=Math.max(0,ride.fireAnimation-dt);
 if(Math.abs(horizontalSpeed)>SPEED*.09){const oldStep=Math.floor(runCycle);runCycle+=Math.abs(scroll-previousScroll)/Math.max(1,H)*7;if(jumpY===0&&Math.floor(runCycle)!==oldStep&&Math.floor(runCycle)%2===0){dustPuffs.push({x:playerX()-facing*H*.045,y:ground()-H*.008,life:.34,size:H*.018,color:'#b8a47b'});if(dustPuffs.length>35)dustPuffs.shift()}}
 const cameraDelta=scroll-previousScroll;spectacle.step(dt,cameraDelta);aftermath.step(dt,cameraDelta,ground(),H);distance=scroll/50;
 const nextStage=stageAt(scroll);if(nextStage!==stageIndex){stageIndex=nextStage;missionBanner=3;arcade.screenShake=Math.max(arcade.screenShake,3)}
 missionBanner=Math.max(0,missionBanner-dt);
 if(arcade.boss.active&&!bossAlertShown){bossAlertShown=true;missionBanner=3;}phase+=dt*15;if(arcade.boss.active&&!bossBerserk&&arcade.boss.hp<=arcade.boss.maxHp*.4){bossBerserk=true;arcade.screenShake=Math.max(arcade.screenShake,12);message.textContent='BOSS BERSERK!';message.style.display='block';setTimeout(()=>{if(running&&!paused)message.style.display='none'},1300)}if(bossDeathTime>=0){bossDeathTime+=dt;bossDeathX-=cameraDelta;if(bossDeathTime>2.6)bossDeathTime=-1;}if(direction!==0&&!combatMoves.sliding)facing=direction;
 const collected=arcade.collect(scroll+playerX(),jumpY,ground(),H);if(collected==='health')health=Math.min(3,health+1);
 const rescued=arcade.rescue(scroll+playerX(),jumpY,H);if(rescued){health=Math.min(3,health+rescued);score+=rescued*500;burst(playerX(),ground()-H*.18)}
 const troopEvents=advanceTroopWaves(sentries,dt,scroll,scroll+playerX(),playerX(),H,arcade.enemyShots);
  for(const event of troopEvents){if(event.type==='contact'&&jumpY<H*.08&&!combatMoves.sliding)damage();else if(event.type==='fire'||event.type==='heavyFire')spectacle.shot(event.x,event.y,Math.sign(playerX()-event.x),event.type==='heavyFire')}
 arcade.step(dt,scroll,playerX(),ground(),H,()=>damage(),explosion,cameraDelta,{jumpY,crouching:isCrouching()});
 if(!running){hud();return}
 shotCooldown=Math.max(0,shotCooldown-dt);muzzleFlash=Math.max(0,muzzleFlash-dt);recoil=Math.max(0,recoil-dt*12);if(fireHeld&&shotCooldown===0)shoot();
 for(let i=enemyDebris.length-1;i>=0;i--){const p=enemyDebris[i];p.x+=p.vx*dt-cameraDelta;p.y+=p.vy*dt;p.vy+=H*1.5*dt;p.life-=dt;if(p.life<=0)enemyDebris.splice(i,1)}
 for(let i=dustPuffs.length-1;i>=0;i--){const p=dustPuffs[i];p.x-=cameraDelta;p.y-=dt*H*.025;p.size+=dt*H*.065;p.life-=dt;if(p.life<=0)dustPuffs.splice(i,1)}
 for(let i=blastEffects.length-1;i>=0;i--){const e=blastEffects[i];e.x-=cameraDelta;e.life-=dt;if(e.life<=0)blastEffects.splice(i,1)}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt-cameraDelta;p.y+=p.vy*dt;p.vy+=400*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1)}
 // Swept hitboxes keep high-speed rounds consistent even during low-FPS mobile frames.
 for(let i=bullets.length-1;i>=0;i--){
  const b=bullets[i],oldX=b.x,oldY=b.y,rocket=b.kind==='rocket';
  b.x+=b.vx*dt-cameraDelta;b.y+=b.vy*dt;b.life-=dt;
  // Resolve by distance along the travelled path, not by object-array order.
  // Move previous camera-space position to the new camera before comparison.
  const targets=[];
  for(const c of arcade.covers)if(c.hp>0)targets.push({
    kind:'cover',ref:c,x:c.x-scroll,y:ground()-H*.065,w:H*.087,h:H*.082
  });
  for(const e of sentries)if(e.alive)targets.push({
    kind:'troop',ref:e,x:e.x-scroll,y:ground()-H*(e.stance==='crouch'?.087:.145),
    w:H*.078,h:H*(e.stance==='crouch'?.070:.15)
  });
  for(const t of ticks)if(t.alive)targets.push({
    kind:'obstacle',ref:t,x:t.x-scroll,y:ground()-H*.055,w:H*.055,h:H*.09
  });
  if(arcade.boss.active&&!arcade.boss.defeated)targets.push({
    kind:'boss',ref:arcade.boss,x:arcade.boss.x-scroll,y:ground()-H*.30,w:H*.27,h:H*.25
  });
  const contact=nearestRectHit(oldX-cameraDelta,oldY,b.x,b.y,targets);
  let hit=!!contact;
  if(hit){
   b.x=contact.x;b.y=contact.y;
   const target=contact.item.ref;
   if(contact.item.kind==='cover'){
    if(!rocket)arcade.hitCover(target.x,Math.max(ground()-H*.13,Math.min(ground(),b.y)),ground(),H,Math.max(10,b.damage*12));
    spectacle.impact(b.x,b.y,0);
   }else if(contact.item.kind==='troop'&&!rocket){
    const result=damageTroop(target,b.damage);
    spectacle.impact(target.x-scroll,ground()-H*.16,result.killed?result.points:0);
    if(result.killed){
     score+=arcade.kill()+result.points;
     aftermath.defeated(target.type,target.x-scroll,ground(),H,Math.sign(b.vx)||1,1);
     shatterEnemy(target.x-scroll,ground()-H*.15);burst(target.x-scroll,ground()-H*.16);
    }else{aftermath.impact(target.x-scroll,ground()-H*.16,H,target.type==='heavy');arcadeHitstop=Math.max(arcadeHitstop,1)}
   }else if(contact.item.kind==='obstacle'&&!rocket){
    target.alive=false;score+=arcade.kill();
    spectacle.impact(target.x-scroll,ground()-H*.08,120);
    shatterEnemy(target.x-scroll,ground()-H*.07);burst(target.x-scroll,ground()-H*.07);
   }else if(contact.item.kind==='boss'&&!rocket){
    arcade.boss.hp-=b.damage;burst(b.x,b.y);
    if(arcade.boss.hp<=0)defeatBoss();
   }
  }
  // Near-miss fire suppresses active opponents without counting as a direct hit.
  // Only bullets that actually cross an opponent's X position may trigger cover.
  if(!hit&&!rocket){
   for(const e of sentries){
    if(!e.alive)continue;
    const sx=e.x-scroll;
    if(sx<Math.min(oldX-cameraDelta,b.x)-H*.055||sx>Math.max(oldX-cameraDelta,b.x)+H*.055)continue;
    if(suppressTroop(e,(oldY+b.y)*.5,ground(),H,Math.sign(b.vx)||1)){
     dustPuffs.push({x:sx,y:ground()-H*.18,life:.20,size:H*.008,color:'#d9cb97'});
     if(dustPuffs.length>35)dustPuffs.shift();
    }
   }
  }
  if(hit&&rocket){
   // Blast originates at the actual first contact point.
   explosion(b.x,b.y,H*.36);
   arcade.screenShake=Math.max(arcade.screenShake,10);
   arcadeHitstop=Math.max(arcadeHitstop,2);
  }
  if(rocket&&b.life>0&&!hit){
   b.trailClock=(b.trailClock||0)+dt;
   if(b.trailClock>=.075){
    b.trailClock-=.075;
    spectacle.shot(b.x-Math.sign(b.vx)*H*.025,b.y,-Math.sign(b.vx),false);
   }
  }
  if(hit||b.life<=0||b.x>W+40||b.x< -40)bullets.splice(i,1);
 }
 for(const t of ticks){const x=t.x-scroll;if(t.alive&&invulnerable===0&&Math.abs(x-playerX())<H*.075&&jumpY<H*.09){t.alive=false;damage();if(!running){hud();return}}}
 if(duckTime>0)duckTime=Math.max(0,duckTime-dt);
 landTime=Math.max(0,landTime-dt);
 if(invulnerable>0)invulnerable=Math.max(0,invulnerable-dt);
 if(jumpY>0||vy>0){jumpY+=vy*dt;const gravityScale=vy<0?FALL_MULTIPLIER:!jumpHeld?LOW_JUMP_MULTIPLIER:1;vy-=GRAVITY*gravityScale*dt;if(jumpY<=0){if(vy<0)landTime=.22;jumpY=0;vy=0}}
 if(distance>=200&&arcade.boss.defeated){victoryRestartAt=performance.now()+VICTORY_RESTART_DELAY_MS;saveArcadeHighScore();gameMenu.victory({score,record:arcadeHighScore,rescued:arcade.prisoners.filter(p=>p.rescued).length,seconds:missionSeconds});running=false;fireHeld=false;clearTouchMovement();movement.left=false;movement.right=false;shotCooldown=0;last=0;message.textContent='MISSIONE COMPIUTA!\nCOMANDANTE SCONFITTO';message.classList.add('victory-message');message.style.display='block';document.getElementById('victory-credit').style.display='block'}hud();
}
function drawBossHealthBar(){if(!arcade.boss.active||arcade.boss.defeated)return;const width=Math.min(W*.52,360),height=Math.max(10,H*.023),x=(W-width)/2,y=Math.max(14,H*.075),ratio=Math.max(0,Math.min(1,arcade.boss.hp/arcade.boss.maxHp));ctx.save();ctx.fillStyle='#171b1b';ctx.fillRect(x-5,y-5,width+10,height+10);ctx.fillStyle='#483a32';ctx.fillRect(x,y,width,height);ctx.fillStyle=ratio>.35?'#d94d35':'#f0a33e';ctx.fillRect(x,y,width*ratio,height);ctx.fillStyle='#f7e8b9';ctx.fillRect(x,y,width*ratio,Math.max(2,height*.22));ctx.strokeStyle='#f4d7a0';ctx.lineWidth=2;ctx.strokeRect(x,y,width,height);if(bossBerserk){ctx.fillStyle='#ff5b43';ctx.font='bold '+Math.max(13,H*.027)+'px monospace';ctx.textAlign='center';ctx.fillText('IRON COMMANDER · BERSERK',W/2,y+height+24)}ctx.restore()}
function drawMissionBanner(){if(missionBanner<=0)return;ctx.save();if(spritePacksReady()){const tw=Math.min(W*.64,H*1.03);drawRaster(ctx,'ui','title',0,(W-tw)*.5,H*.19,tw,H*.15)}const a=Math.min(1,missionBanner,Math.max(0,(3-missionBanner)*2));ctx.globalAlpha=a;ctx.textAlign='center';const size=Math.max(18,H*.049);ctx.font='900 '+size+'px Impact,system-ui,sans-serif';ctx.lineWidth=Math.max(4,size*.16);ctx.strokeStyle='#161c1b';const text=arcade.boss.active&&!arcade.boss.defeated?'BOSS IN ARRIVO!':stageIndex===0?'MISSIONE 01 · AVANTI!':STAGES[stageIndex].name;ctx.strokeText(text,W*.5,H*.35);ctx.fillStyle='#ffe39a';ctx.fillText(text,W*.5,H*.35);ctx.restore()}
function frame(t){if(gameMenu.mode==='victory'&&t>=victoryRestartAt)gameMenu.allowReplay();if(continueUntil){if(t>=continueUntil){continueUntil=0;message.textContent='GAME OVER — TOCCA PER RIPROVARE'}else message.textContent='CONTINUE? · '+arcadeCredits+' CREDITI · '+Math.ceil((continueUntil-t)/1000)+' · TOCCA PER CONTINUARE'}updateArcadeMusic();updateVehicleButton();if(!visible){last=t;requestAnimationFrame(frame);return}if(last&&t-last<1000/65){requestAnimationFrame(frame);return}const dt=Math.min(last?(t-last)/1000:0,.05);last=t;if(arcadeHitstop>0)arcadeHitstop--;else update(dt);ctx.save();if(arcade.screenShake>0){const shake=arcade.screenShake;ctx.translate(Math.sin(phase*3.1)*shake*.5,Math.cos(phase*4.3)*shake*.35)}background();drawBattleAtmosphere(ctx,W,H,scroll,phase,ground());drawArcadeStorm(ctx,W,H,phase*.015,scroll>2900);drawTicks();aftermath.draw(ctx,W,H,ground(),drawFallenTroop);drawSentries();arcade.draw(ctx,scroll,ground(),H,phase);drawStageMarker(ctx,W,H,scroll,ground());drawDust();drawRide();if(!ride.occupied){drawPlayer();drawCombatMoves()}drawBullets();drawCasings();drawBlastEffects();drawEnemyDebris();drawParticles();drawArcadeForeground(ctx,W,H,scroll,ground(),phase);spectacle.drawFront(ctx,W,H,scroll,ground());if(bossDeathTime>=0)drawBossDeathCinematic(ctx,W,H,ground(),bossDeathTime,bossDeathX);ctx.restore();drawArcadeFlash();drawBossHealthBar();spectacle.drawOverlay(ctx,W,H,arcade.combo);drawMissionBanner();requestAnimationFrame(frame)}
function start(){if(!rasterLoaded){message.textContent=rasterError?'ERRORE SPRITE: '+rasterError.message:'CARICAMENTO SPRITE...';message.style.display='block';return}if(continueArcade())return;if(victoryRestartAt&&performance.now()<victoryRestartAt)return;victoryRestartAt=0;missionSeconds=0;landTime=0;gameMenu.playMode();document.getElementById('victory-credit').style.display='none';musicStep=0;musicNext=0;message.classList.remove('victory-message');running=true;paused=false;arcadeCredits=3;continueUntil=0;bossBerserk=false;bossAlertShown=false;stageIndex=0;missionBanner=2.5;aimUp=false;score=0;health=3;distance=0;scroll=0;facing=1;bossVictoryAwarded=false;bossDeathTime=-1;bossDeathX=0;arcade.reset();Object.assign(ride,{x:750,hp:100,occupied:false,cooldown:0,flash:0,fireAnimation:0});vy=0;jumpY=0;horizontalSpeed=0;jumpHeld=false;duckTime=0;phase=0;runCycle=0;invulnerable=0;shotCooldown=0;muzzleFlash=0;recoil=0;fireHeld=false;bullets.length=0;casings.length=0;hitFlash=0;particles.length=0;blastEffects.length=0;dustPuffs.length=0;enemyDebris.length=0;spectacle.reset();aftermath.reset();combatMoves.reset();duckHeld=false;ticks.forEach(t=>t.alive=true);resetTroopWaves(sentries);clearTouchMovement();movement.left=false;movement.right=false;last=0;message.style.display='none';hud();soundEffect('enter')}
function jump(){if(!running){start()}if(!paused&&!ride.occupied&&!combatMoves.sliding&&jumpY===0){vy=Math.sqrt(2*GRAVITY*H*.23);landTime=0;jumpHeld=true;duckTime=0;duckHeld=false}}
function duck(){if(!running){start()}if(!paused)duckTime=.7}
function pause(){if(!running)return;paused=!paused;last=0;if(paused)gameMenu.pause();else gameMenu.playMode();if(paused){fireHeld=false;clearTouchMovement();movement.left=false;movement.right=false}if(paused){jumpHeld=false;aimUp=false;duckHeld=false}message.textContent='IN PAUSA — TOCCA PER RIPRENDERE';message.style.display=paused?'block':'none'}
for(const [id,fn] of [['jump',jump],['duck',duck],['grenade',grenade],['slide',slide],['pause',pause]])document.getElementById(id).addEventListener('pointerdown',e=>{e.preventDefault();fn()});
const duckButton=document.getElementById('duck');
duckButton.addEventListener('pointerdown',e=>{e.preventDefault();duckButton.setPointerCapture(e.pointerId);duckHeld=true});
for(const type of ['pointerup','pointercancel','lostpointercapture'])duckButton.addEventListener(type,()=>{duckHeld=false;duckTime=0});
// Holding jump extends the arc; releasing early cuts the upward velocity on touch devices.
const jumpButton=document.getElementById('jump');jumpButton.addEventListener('pointerdown',e=>{e.preventDefault();jumpButton.setPointerCapture(e.pointerId);jumpHeld=true});for(const event of ['pointerup','pointercancel','lostpointercapture'])jumpButton.addEventListener(event,()=>{jumpHeld=false});
const activeMovementPointers={left:new Set(),right:new Set()};
function clearTouchMovement(){activeMovementPointers.left.clear();activeMovementPointers.right.clear();movement.left=false;movement.right=false}
for(const id of ['left','right']){const el=document.getElementById(id);const pointers=activeMovementPointers[id];el.addEventListener('pointerdown',e=>{e.preventDefault();if(!running)start();el.setPointerCapture(e.pointerId);pointers.add(e.pointerId);movement[id]=true});for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,e=>{pointers.delete(e.pointerId);movement[id]=pointers.size>0})}
const aimButton=document.createElement('button');aimButton.type='button';aimButton.id='aim-up';aimButton.textContent='↑ MIRA';aimButton.setAttribute('aria-label','Mira verso alto');Object.assign(aimButton.style,{position:'fixed',right:'12px',top:'57%',zIndex:'20',padding:'12px',background:'#253b43',color:'#fff',border:'2px solid #ffe49a',borderRadius:'12px',touchAction:'none',fontWeight:'bold'});document.body.appendChild(aimButton);aimButton.addEventListener('pointerdown',e=>{e.preventDefault();aimButton.setPointerCapture(e.pointerId);aimUp=true;aimButton.style.background='#526e5c'});for(const type of ['pointerup','pointercancel','lostpointercapture'])aimButton.addEventListener(type,()=>{aimUp=false;aimButton.style.background='#253b43'});const fireButton=document.getElementById('shoot');fireButton.addEventListener('pointerdown',e=>{e.preventDefault();if(!running)start();fireHeld=true;fireButton.setPointerCapture(e.pointerId);shoot()});for(const event of ['pointerup','pointercancel','lostpointercapture'])fireButton.addEventListener(event,()=>fireHeld=false);
addEventListener('blur',()=>{clearTouchMovement();movement.left=false;movement.right=false;fireHeld=false;jumpHeld=false;aimUp=false;duckHeld=false;if(running&&!paused){paused=true;gameMenu.pause();message.textContent='IN PAUSA — TOCCA PER RIPRENDERE';message.style.display='block'}});
message.addEventListener('pointerdown',()=>{if(paused)pause();else start()});canvas.addEventListener('pointerdown',()=>{if(!running)start()});
addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.repeat){if(!running)start();else if(paused)pause()}if(e.key==='ArrowLeft'||e.key==='a'){if(!running)start();movement.left=true;}if(e.key==='ArrowRight'||e.key==='d'){if(!running)start();movement.right=true;}if(e.key==='w'||e.key==='W')aimUp=true;if(e.key==='ArrowUp'||e.key===' '){e.preventDefault();jumpHeld=true;if(!e.repeat)jump();}if(e.key==='ArrowDown'){duckHeld=true;duck()}if((e.key==='e'||e.key==='E')&&!e.repeat)toggleRide();if(e.key==='Shift'&&!e.repeat)slide();if(e.key==='Escape')pause();if((e.key==='f'||e.key==='j'||e.key==='J'||e.key==='Control')&&!e.repeat)shoot();if((e.key==='g'||e.key==='k'||e.key==='K')&&!e.repeat)grenade()});
addEventListener('keyup',e=>{if(e.key==='w'||e.key==='W')aimUp=false;if(e.key==='ArrowDown'){duckHeld=false;duckTime=0}if(e.key==='ArrowUp'||e.key===' ')jumpHeld=false;if(e.key==='ArrowLeft'||e.key==='a'){movement.left=false}if(e.key==='ArrowRight'||e.key==='d'){movement.right=false}});
for(const [selector,sprite] of [['.portrait-player',sprites.soldier[0]],['.portrait-target',sprites.tick[0]]]){const el=document.querySelector(selector);if(el){const image=selector==='.portrait-player'?'./assets/2d/soldier-back.png':'./assets/2d/reference-scene.webp';el.style.backgroundImage='url('+image+')';el.style.backgroundSize=selector==='.portrait-player'?'cover':'950% auto';el.style.backgroundPosition=selector==='.portrait-player'?'center 12%':'50% 22%';el.style.imageRendering='auto'}}
requestAnimationFrame(frame);

