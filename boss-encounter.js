// Original three-phase armored boss encounter for Corsa alla Guerra 2D.
// Deterministic world-independent ground shocks; no runtime assets or timers.
import {nearestRectHit} from './collision-order.js';

export function bossPhase(boss){
 if(!boss||!Number.isFinite(boss.hp)||!Number.isFinite(boss.maxHp)||boss.maxHp<=0)return 1;
 const ratio=Math.max(0,boss.hp)/boss.maxHp;
 return ratio<=.34?3:ratio<=.67?2:1;
}

export function createBossEncounter(){
 const state={cooldown:3.8,windup:0,pending:0,pendingDelay:0,
  direction:-1,waves:[],attacks:0};
 const reset=()=>{
  state.cooldown=3.8;state.windup=0;state.pending=0;state.pendingDelay=0;
  state.direction=-1;state.waves.length=0;state.attacks=0;
 };
 function wave(boss,scroll,H,dir){
  if(state.waves.length>=5)return;
  state.waves.push({x:boss.x-scroll+dir*H*.3,vx:dir*H*1.65,life:1.7,
   radius:H*.12,phase:0});
 }
 function step(dt,{
  boss,scroll=0,playerX=0,playerWorldX=scroll+playerX,ground=0,H=0,
  cameraDelta=0,jumpY=0,sliding=false,occupied=false,covers=[],
  onDamage=()=>{},onImpact=()=>{}
 }={}){
  if(!Number.isFinite(dt)||dt<=0||!Number.isFinite(H)||H<=0)return;
  if(!boss?.active||boss.defeated||boss.hp<=0){
   state.windup=0;state.pending=0;state.waves.length=0;return;
  }
  const phase=bossPhase(boss);
  const near=Math.abs(boss.x-playerWorldX)<H*2.4;
  // Freeze activation out of range. Existing waves continue to expire safely.
  if(phase===1||!near){
   state.windup=0;state.pending=0;state.cooldown=Math.max(.5,state.cooldown);
  }else{
   if(state.pending>0){
    state.pendingDelay-=dt;
    if(state.pendingDelay<=0){
     wave(boss,scroll,H,state.direction);state.pending=0;
    }
   }
   if(state.windup>0){
    state.windup=Math.max(0,state.windup-dt);
    if(state.windup===0){
     wave(boss,scroll,H,state.direction);state.attacks++;
     if(phase===3){state.pending=1;state.pendingDelay=.31;}
     state.cooldown=phase===3?2.85:4.2;
    }
   }else if(state.pending===0){
    state.cooldown=Math.max(0,state.cooldown-dt);
    if(state.cooldown===0){
     state.direction=Math.sign(playerWorldX-boss.x)||-1;
     state.windup=phase===3?.64:.9;
    }
   }
  }
  for(let i=state.waves.length-1;i>=0;i--){
   const shock=state.waves[i],previous=shock.x-cameraDelta;
   shock.x=previous+shock.vx*dt;shock.phase+=dt;shock.life-=dt;
   const targets=[];
   for(const cover of covers)if(cover.hp>0)targets.push({
    kind:'cover',ref:cover,x:cover.x-scroll,y:ground-H*.06,w:H*.10,h:H*.075
   });
   // Both the jump and slide are deliberate evasive actions. The armored
   // vehicle is immune to low-profile ground shockwaves, not to cannon fire.
   if(jumpY<H*.105&&!sliding&&!occupied){
    targets.push({kind:'player',x:playerX,y:ground-H*.06,w:H*.055,h:H*.08});
   }
   const hit=nearestRectHit(previous,ground-H*.06,shock.x,ground-H*.06,targets);
   if(hit){
    if(hit.item.kind==='player')onDamage();
    else hit.item.ref.hp=Math.max(0,hit.item.ref.hp-45);
    onImpact(hit.x,ground-H*.045,hit.item.kind);
    state.waves.splice(i,1);
   }else if(shock.life<=0||shock.x< -H*.3||shock.x>H*10){
    state.waves.splice(i,1);
   }
  }
 }
 function draw(ctx,boss,scroll,ground,H,phaseClock){
  if(!boss?.active||boss.defeated||H<=0)return;
  ctx.save();
  const bx=boss.x-scroll;
  if(state.windup>0){
   const total=bossPhase(boss)===3?.64:.9;
   const ratio=Math.max(0,Math.min(1,1-state.windup/total));
   ctx.globalAlpha=.45+Math.sin(phaseClock*1.8)*.18;
   ctx.strokeStyle=ratio>.7?'#ff6543':'#ffda7f';
   ctx.lineWidth=Math.max(2,H*.009);
   ctx.beginPath();ctx.ellipse(bx,ground-H*.012,H*(.16+.20*ratio),H*.036,0,0,Math.PI*2);ctx.stroke();
   ctx.globalAlpha=1;
   ctx.font='900 '+Math.max(12,H*.034)+'px system-ui,sans-serif';
   ctx.textAlign='center';ctx.lineWidth=Math.max(3,H*.008);
   ctx.strokeStyle='#161c1a';ctx.strokeText('ONDA D\'URTO!',bx,ground-H*.52);
   ctx.fillStyle='#ffcd70';ctx.fillText('ONDA D\'URTO!',bx,ground-H*.52);
  }
  for(const shock of state.waves){
   const x=shock.x,r=shock.radius,fade=Math.max(0,Math.min(1,shock.life/.4));
   ctx.globalAlpha=fade;
   ctx.fillStyle='#e9a34e';ctx.fillRect(x-r*.70,ground-H*.019,r*1.4,H*.019);
   for(const scale of [1,.66,.34]){
    ctx.strokeStyle=scale===1?'#f5e9b6':scale===.66?'#f6a954':'#b9492d';
    ctx.lineWidth=Math.max(2,H*.009*scale);
    ctx.beginPath();ctx.ellipse(x,ground-H*.012,r*scale,H*(.10*scale),0,Math.PI,Math.PI*2);ctx.stroke();
   }
   ctx.fillStyle='#fff2cb';
   ctx.fillRect(x-r*.12,ground-H*.12-Math.sin(shock.phase*22)*H*.01,r*.24,H*.012);
  }
  ctx.restore();
 }
 return {state,reset,step,draw};
}
