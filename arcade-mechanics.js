// Original arcade run-and-gun systems: weapon pickups, grenades, enemy volleys, boss.
import {drawRocketPickup} from './arcade-arsenal.js';
import {drawRaster,spritePacksReady} from './sprite-loader.js';
export function createArcadeSystems(){
 const pickups=Array.from({length:12},(_,i)=>({x:1400+i*715,type:['spread','heavy','rocket','health'][i%4],taken:false}));
 const grenades=[],enemyShots=[],airBombs=[],airDrops=[];
 const plane={x:-200,active:false,timer:10,dropTimer:0,passes:0};
 const covers=[2350,5750,8850].map(x=>({x,hp:100}));
 const prisoners=[1750,4850,7950].map(x=>({x,rescued:false}));
 const boss={x:9600,hp:28,maxHp:28,active:false,defeated:false,cooldown:1.3,velocity:0,turretAngle:0,recoil:0,treadDistance:0};
 let weapon='normal',ammo=Infinity,grenadeCount=8,combo=0,comboTimer=0,screenShake=0;
 const reset=()=>{weapon='normal';ammo=Infinity;grenadeCount=8;combo=0;comboTimer=0;screenShake=0;grenades.length=0;enemyShots.length=0;airBombs.length=0;airDrops.length=0;Object.assign(plane,{x:-200,active:false,timer:10,dropTimer:0,passes:0});pickups.forEach(p=>p.taken=false);covers.forEach(c=>c.hp=100);prisoners.forEach(p=>p.rescued=false);Object.assign(boss,{hp:28,active:false,defeated:false,cooldown:1.3,velocity:0,turretAngle:0,recoil:0,treadDistance:0})};
 const collect=(worldX,jump,ground,H)=>{let reward=null;for(const p of pickups){if(p.taken||Math.abs(p.x-worldX)>H*.12||jump>H*.18)continue;p.taken=true;reward=p.type;if(p.type==='health'){}else{weapon=p.type;ammo=p.type==='rocket'?35:p.type==='spread'?100:160}}return reward};
 const rescue=(worldX,jump,H)=>{let n=0;for(const p of prisoners)if(!p.rescued&&Math.abs(p.x-worldX)<H*.12&&jump<H*.2){p.rescued=true;n++}return n};
 const hitCover=(worldX,y,ground,H,damage=10)=>{if(y<ground-H*.15||y>ground+H*.02)return false;for(const c of covers){if(c.hp>0&&Math.abs(c.x-worldX)<H*.09){c.hp=Math.max(0,c.hp-damage);return true}}return false};
 const melee=(worldX,direction,H,enemies)=>{for(const e of enemies){if(e.alive&&Math.sign(e.x-worldX)===direction&&Math.abs(e.x-worldX)<H*.16){e.alive=false;return e}}return null};
 const fire=(x,y,direction,speed)=>{
   if(ammo<=0){weapon='normal';ammo=Infinity}
   const activeWeapon=weapon;
   const pattern=activeWeapon==='spread'?[-.14,0,.14]:[0];
   const shots=pattern.map(a=>({
    x,y,vx:direction*speed*(activeWeapon==='rocket'?.78:1),vy:a*speed,
    damage:activeWeapon==='rocket'?5:activeWeapon==='heavy'?2:1,
    life:activeWeapon==='rocket'?1.85:1.8,
    kind:activeWeapon
   }));
   if(Number.isFinite(ammo)){ammo--;if(ammo<=0){weapon='normal';ammo=Infinity}}
   return shots;
  };
 const throwGrenade=(x,y,direction,H)=>{if(grenadeCount<=0)return false;grenadeCount--;grenades.push({x,y,vx:direction*H*1.2,vy:-H*.9,fuse:.9,life:1.5});return true};
 const kill=()=>{combo++;comboTimer=3;screenShake=Math.min(12,screenShake+3);return 100+Math.min(combo,15)*20};
 const step=(dt,scroll,playerX,ground,H,onDamage,onExplosion,cameraDelta=0,playerState={})=>{
   const jumping=Math.max(0,playerState.jumpY||0),crouching=!!playerState.crouching;
   const playerCenterY=ground-H*(crouching?.07:.18)-jumping;
   const verticalRadius=H*(crouching?.065:.16);
  plane.timer-=dt;if(!plane.active&&plane.timer<=0){plane.active=true;plane.x=-H*.3;plane.dropTimer=0;plane.timer=14;plane.passes++}
  if(plane.active){plane.x+=H*1.15*dt;plane.dropTimer+=dt;if(plane.dropTimer>=.75){plane.dropTimer=0;if(plane.x>0&&plane.x<H*2.5){if(plane.passes%2===0&&airDrops.length===0)airDrops.push({x:plane.x,y:H*.12});else airBombs.push({x:plane.x,y:H*.12,vy:0})}}if(plane.x>H*3.8)plane.active=false}
  for(let i=airBombs.length-1;i>=0;i--){const b=airBombs[i];b.vy+=H*1.2*dt;b.y+=b.vy*dt;if(b.y>=ground){if(Math.abs(b.x-playerX)<H*.12&&jumping<H*.10)onDamage();onExplosion(b.x,ground,H*.14);airBombs.splice(i,1)}}
  for(let i=airDrops.length-1;i>=0;i--){const d=airDrops[i];d.y=Math.min(ground-H*.07,d.y+H*.18*dt);if(Math.abs(d.x-playerX)<H*.12&&d.y>=ground-H*.15){weapon='heavy';ammo=100;airDrops.splice(i,1)}}
  comboTimer-=dt;if(comboTimer<=0)combo=0;screenShake=Math.max(0,screenShake-dt*28);
  if(!boss.defeated&&scroll+playerX>boss.x-H*1.6)boss.active=true;
  if(boss.active&&!boss.defeated){
   // Heavy tracked vehicle: slow approach, braking distance and damped recoil.
   const targetWorldX=scroll+playerX,dx=targetWorldX-boss.x;
   // Do not simulate pursuit or cannon fire when the player has left the boss encounter.
   const encounterVisible=Math.abs(dx)<H*2.5;
   if(!encounterVisible){boss.velocity=0;boss.cooldown=Math.max(boss.cooldown,0.5);}
   if(encounterVisible){
   const stopDistance=H*.85,maxSpeed=H*.28;
   const desiredVelocity=Math.abs(dx)>stopDistance?Math.sign(dx)*maxSpeed:0;
   const acceleration=H*.55,braking=H*.9;
   const delta=desiredVelocity-boss.velocity;
   boss.velocity+=Math.sign(delta)*Math.min(Math.abs(delta),(desiredVelocity?acceleration:braking)*dt);
   boss.x+=boss.velocity*dt;boss.treadDistance+=Math.abs(boss.velocity)*dt;
   const turretY=ground-H*.41,aimY=ground-H*.18;
   const desiredAngle=Math.atan2(aimY-turretY,targetWorldX-boss.x);
   let diff=Math.atan2(Math.sin(desiredAngle-boss.turretAngle),Math.cos(desiredAngle-boss.turretAngle));
   const turnStep=Math.PI/4*dt;
   boss.turretAngle+=Math.sign(diff)*Math.min(Math.abs(diff),turnStep);
   boss.recoil=Math.max(0,boss.recoil-dt*3.5);
   boss.cooldown-=dt;
   if(boss.cooldown<=0&&Math.abs(dx)<H*2.5&&enemyShots.length<=21){
    boss.cooldown=boss.hp<boss.maxHp*.3?1.12:boss.hp<boss.maxHp*.67?1.75:3;boss.recoil=1;screenShake=Math.min(12,screenShake+6);
    const dirX=Math.cos(boss.turretAngle),dirY=Math.sin(boss.turretAngle);
    for(const spread of (boss.hp<boss.maxHp*.3?[-.23,-.1,0,.1,.23]:boss.hp<boss.maxHp*.67?[-.16,0,.16]:[0])){const angle=boss.turretAngle+spread;enemyShots.push({x:boss.x-scroll+Math.cos(angle)*H*.43,y:turretY+Math.sin(angle)*H*.43,vx:Math.cos(angle)*H*.85,vy:Math.sin(angle)*H*.85,life:3})}
    boss.velocity-=dirX*H*.045;
   }
   }
  }
  for(let i=enemyShots.length-1;i>=0;i--){
    const b=enemyShots[i];b.x+=b.vx*dt-cameraDelta;b.y+=b.vy*dt;
    b.vy+=(b.gravity||0)*dt;b.life-=dt;
    if(hitCover(scroll+b.x,b.y,ground,H,b.kind==='grenade'?30:10)){
      if(b.kind==='grenade')onExplosion(b.x,b.y,H*.16,true);
      enemyShots.splice(i,1);continue;
    }
    if(b.kind==='grenade'&&(b.y>=ground-H*.03||b.life<=0)){
      if(Math.abs(b.x-playerX)<H*.22&&jumping<H*.11)onDamage();
      onExplosion(b.x,Math.min(b.y,ground-H*.03),H*.19,true);
      enemyShots.splice(i,1);continue;
    }
    if(Math.abs(b.x-playerX)<H*.065&&Math.abs(b.y-playerCenterY)<verticalRadius){
      onDamage();enemyShots.splice(i,1);
    }else if(b.life<=0)enemyShots.splice(i,1);
   }
  for(let i=grenades.length-1;i>=0;i--){const g=grenades[i];g.x+=g.vx*dt-cameraDelta;g.y+=g.vy*dt;g.vy+=H*2.4*dt;g.fuse-=dt;if(g.y>ground-H*.02){g.y=ground-H*.02;g.vy*=-.35;g.vx*=.8}if(g.fuse<=0){for(const c of covers)if(Math.abs(c.x-(scroll+g.x))<H*.4)c.hp=Math.max(0,c.hp-50);onExplosion(g.x,g.y,H*.35);screenShake=14;grenades.splice(i,1)}}
 };
 const draw=(ctx,scroll,ground,H,phase)=>{
  for(const c of covers){if(c.hp<=0)continue;const x=c.x-scroll;if(x< -H*.2||x>ctx.canvas.width+H*.2)continue;ctx.fillStyle=c.hp>50?'#796548':'#56483a';ctx.fillRect(x-H*.08,ground-H*.13,H*.16,H*.13);ctx.strokeStyle='#bca77c';for(let row=0;row<3;row++)ctx.strokeRect(x-H*.08,ground-H*(.13-row*.04),H*.16,H*.04)}
  for(const p of prisoners){if(p.rescued)continue;const x=p.x-scroll;if(x< -H*.2||x>ctx.canvas.width+H*.2)continue;ctx.fillStyle='#c4ad6d';ctx.fillRect(x-H*.03,ground-H*.13,H*.06,H*.1);ctx.fillStyle='#e3bb8c';ctx.fillRect(x-H*.03,ground-H*.17,H*.06,H*.05)}
  if(plane.active){ctx.fillStyle='#343a39';ctx.fillRect(plane.x, H*.09,H*.22,H*.038);ctx.fillRect(plane.x+H*.07,H*.065,H*.06,H*.09);ctx.fillStyle='#c24e37';ctx.fillRect(plane.x+H*.2,H*.1,H*.03,H*.02)}
  for(const b of airBombs){ctx.fillStyle='#292e2b';ctx.fillRect(b.x-H*.012,b.y-H*.017,H*.024,H*.034)}
  for(const d of airDrops){ctx.fillStyle='#eee3c5';ctx.beginPath();ctx.arc(d.x,d.y-H*.06,H*.065,Math.PI,0);ctx.fill();ctx.fillStyle='#a57a43';ctx.fillRect(d.x-H*.03,d.y-H*.03,H*.06,H*.06)}
  for(const p of pickups){if(p.taken)continue;const x=p.x-scroll;if(x< -80||x>(ctx.canvas.clientWidth||ctx.canvas.width)+80)continue;const y=ground-H*.18+Math.sin(phase*.12)*H*.013;if(p.type==='rocket'){drawRocketPickup(ctx,x,y,H*.07);continue}ctx.save();ctx.translate(x,y);ctx.fillStyle=p.type==='health'?'#c63e42':p.type==='spread'?'#d9b64e':'#6cba96';ctx.fillRect(-H*.035,-H*.035,H*.07,H*.07);ctx.strokeStyle='#fff5d4';ctx.lineWidth=2;ctx.strokeRect(-H*.035,-H*.035,H*.07,H*.07);ctx.fillStyle='#171d19';ctx.font='bold '+Math.max(11,H*.042)+'px monospace';ctx.textAlign='center';ctx.fillText(p.type==='health'?'+':p.type==='spread'?'S':'H',0,H*.015);ctx.restore()}
  for(const g of grenades){ctx.fillStyle='#313e30';ctx.beginPath();ctx.arc(g.x,g.y,H*.02,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e2c06d';ctx.fillRect(g.x-2,g.y-H*.03,4,5)}
  for(const b of enemyShots){
     if(b.kind==='grenade'){
       ctx.fillStyle='#2e3a2f';ctx.beginPath();ctx.arc(b.x,b.y,H*.019,0,Math.PI*2);ctx.fill();
       ctx.fillStyle='#ffd67b';ctx.fillRect(b.x-2,b.y-H*.022,4,4);
     }else{
       ctx.fillStyle='#ba442f';ctx.fillRect(b.x-13,b.y-3,15,6);
       ctx.fillStyle='#fff3af';ctx.fillRect(b.x-3,b.y-2,11,4);
     }
   }
  if(boss.active&&!boss.defeated){
   const x=boss.x-scroll,unit=H*.01;
   const viewportWidth=ctx.canvas?.clientWidth||ctx.canvas?.width||Infinity;
   if(x<-H*.55||x>viewportWidth+H*.55)return;
   if(spritePacksReady()){drawRaster(ctx,'boss','commander',Math.floor(phase*.5)%6,x-H*.355,ground-H*.5,H*.71,H*.5);return}
   const treadFrame=Math.floor(boss.treadDistance/Math.max(1,H*.035))%4;
   ctx.save();ctx.translate(x,ground);
   // Original armored crawler: layered pixel-like hull, track links and turret.
   ctx.fillStyle='#161c1b';ctx.fillRect(-29*unit,-17*unit,58*unit,15*unit);
   ctx.fillStyle='#394039';ctx.fillRect(-27*unit,-19*unit,54*unit,12*unit);
   for(let i=-24;i<=24;i+=6){
    ctx.fillStyle=(Math.floor((i+24)/6)+treadFrame)%2===0?'#737765':'#272e2a';
    ctx.fillRect(i*unit,-9*unit,5*unit,6*unit);
    ctx.fillStyle='#131a19';ctx.fillRect((i+1)*unit,-8*unit,3*unit,4*unit);
   }
   for(const dx of [-19,-9,1,11,21]){
    ctx.fillStyle='#151b19';ctx.beginPath();ctx.arc(dx*unit,-8*unit,6*unit,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#8b8a71';ctx.beginPath();ctx.arc(dx*unit,-8*unit,3.3*unit,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#313d35';ctx.fillRect((dx-1+treadFrame%2)*unit,-9*unit,2*unit,2*unit);
   }
   ctx.fillStyle='#242f2b';ctx.fillRect(-24*unit,-31*unit,49*unit,17*unit);
   ctx.fillStyle='#65725b';ctx.fillRect(-23*unit,-34*unit,46*unit,9*unit);
   ctx.fillStyle='#849078';ctx.fillRect(-18*unit,-32*unit,28*unit,3*unit);
   ctx.fillStyle='#4b5a4a';ctx.fillRect(-18*unit,-26*unit,38*unit,6*unit);
   for(let i=-16;i<20;i+=9){ctx.fillStyle='#a7a58b';ctx.fillRect(i*unit,-26*unit,2*unit,2*unit)}
   ctx.fillStyle='#1d2927';ctx.fillRect(-9*unit,-42*unit,30*unit,12*unit);
   ctx.fillStyle='#77816c';ctx.fillRect(-6*unit,-45*unit,22*unit,7*unit);
   ctx.fillStyle='#adb092';ctx.fillRect(-4*unit,-44*unit,15*unit,2*unit);
   // Mechanically aimed cannon with a visible recoil stroke.
   ctx.save();ctx.translate(-5*unit,-41*unit);ctx.rotate(boss.turretAngle);
   ctx.fillStyle='#303b32';ctx.fillRect(0,-3*unit,(39-boss.recoil*6)*unit,6*unit);
   ctx.fillStyle='#8a8f7a';ctx.fillRect(0,-2*unit,(37-boss.recoil*6)*unit,2*unit);
   ctx.fillStyle='#111a18';ctx.fillRect((35-boss.recoil*6)*unit,-5*unit,5*unit,10*unit);
   ctx.restore();
   ctx.fillStyle='#e2bd6a';ctx.fillRect(17*unit,-28*unit,4*unit,4*unit);
   ctx.fillStyle=Math.floor(phase*.7)%2===0?'#f6bd65':'#ad4838';ctx.fillRect(13*unit,-40*unit,4*unit,3*unit);
   ctx.fillStyle='#151b1b';ctx.fillRect(-25*unit,-52*unit,50*unit,3*unit);
   ctx.fillStyle='#d95236';ctx.fillRect(-24*unit,-51*unit,48*unit*Math.max(0,boss.hp/boss.maxHp),2*unit);
   // Destruction stages: animated armor scars, exhaust smoke, sparks and ricochets.
   const damage=1-Math.max(0,boss.hp)/boss.maxHp;
   const t=phase*.21;
   if(damage>.18){
    const scars=Math.ceil(damage*11);
    for(let i=0;i<scars;i++){
     const sx=(-17+(i*17)%38)*unit,sy=(-30+(i*7)%19)*unit;
     ctx.fillStyle=i%2?'#1b2522':'#252e27';ctx.fillRect(sx,sy,(3+i%3)*unit,(2+i%2)*unit);
     ctx.fillStyle='#b58c55';ctx.fillRect(sx+unit,sy,unit,unit);
    }
   }
   if(damage>.4){
    for(let i=0;i<5;i++){
     const drift=(t*11+i*9)%33;
     const smokeX=(12+i*2)*unit+Math.sin(t+i)*5*unit;
     const smokeY=(-45-drift)*unit;
     ctx.globalAlpha=Math.max(.08,.55-drift/60);
     ctx.fillStyle=i%2?'#363a34':'#575950';
     ctx.fillRect(smokeX,smokeY,(6+i%3*3)*unit,(5+i%2*4)*unit);
    }
    ctx.globalAlpha=1;
   }
   if(damage>.72){
    for(let i=0;i<8;i++){
     const sparkTime=(t*4+i*.37)%1;
     const px=(-9+(i*11)%29)*unit+sparkTime*(i%2?9:-8)*unit;
     const py=(-27+(i*5)%17)*unit-sparkTime*18*unit;
     ctx.fillStyle=i%3?'#ff9b3d':'#fff2a5';
     ctx.fillRect(px,py,(1+i%2)*unit,2*unit);
    }
    ctx.fillStyle=Math.floor(t*9)%2?'#f1b36d':'#9b392b';
    ctx.fillRect(-11*unit,-31*unit,6*unit,3*unit);
   }
   // Animated metal panel rivets and articulated armor for a denser silhouette.
   ctx.fillStyle='#1b2523';
   for(const [px,py] of [[-20,-32],[-12,-32],[10,-32],[20,-23],[-19,-23],[6,-23]]){
    ctx.fillRect(px*unit,py*unit,2*unit,2*unit);
    ctx.fillStyle='#c5b995';ctx.fillRect(px*unit,py*unit,unit,unit);
    ctx.fillStyle='#1b2523';
   }
   ctx.fillStyle='#202a27';ctx.fillRect(-13*unit,-42*unit,8*unit,4*unit);
   ctx.fillStyle='#a3ae96';ctx.fillRect(-12*unit,-42*unit,5*unit,unit);
   // Original painted armor: chamfers, rivets, welded seams and live track arches.
   ctx.save();
   ctx.strokeStyle='#171d1b';ctx.lineWidth=2.8*unit;
   ctx.fillStyle='#536551';ctx.beginPath();
   ctx.moveTo(-25*unit,-29*unit);ctx.lineTo(-16*unit,-36*unit);
   ctx.lineTo(19*unit,-34*unit);ctx.lineTo(27*unit,-24*unit);
   ctx.lineTo(23*unit,-20*unit);ctx.lineTo(-23*unit,-21*unit);
   ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#91a080';ctx.beginPath();
   ctx.moveTo(-18*unit,-34*unit);ctx.lineTo(18*unit,-32*unit);
   ctx.lineTo(22*unit,-29*unit);ctx.lineTo(-21*unit,-29*unit);ctx.fill();
   ctx.fillStyle='#384b41';ctx.fillRect(-18*unit,-24*unit,36*unit,3*unit);
   ctx.fillStyle='#202c29';ctx.fillRect(7*unit,-35*unit,9*unit,14*unit);
   ctx.fillStyle='#9aaa8b';ctx.fillRect(9*unit,-32*unit,3*unit,7*unit);
   for(const dx of [-19,-9,1,11,21]){
    ctx.strokeStyle='#171e1c';ctx.lineWidth=2.5*unit;ctx.beginPath();
    ctx.arc(dx*unit,-8*unit,6.8*unit,Math.PI,0);ctx.stroke();
    ctx.strokeStyle='#b0b098';ctx.lineWidth=unit;ctx.beginPath();
    ctx.arc(dx*unit,-8*unit,4.5*unit,Math.PI*.10,Math.PI*.9);ctx.stroke();
    ctx.fillStyle='#d2bf91';ctx.fillRect((dx-1)*unit,-9*unit,2*unit,2*unit);
   }
   ctx.fillStyle='#252f2b';ctx.beginPath();
   ctx.ellipse(1*unit,-43*unit,7*unit,2.5*unit,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#a1a88b';ctx.fillRect(-4*unit,-45*unit,9*unit,unit);
   // Amber pre-fire signal gives players a readable dodge window.
   if(boss.cooldown>0&&boss.cooldown<.6){
    const pulse=.55+.35*Math.sin(phase*2.4);
    ctx.globalAlpha=pulse;ctx.fillStyle='#ffb65d';
    ctx.fillRect(32*unit,-45*unit,5*unit,5*unit);
    ctx.fillStyle='#fff3ab';ctx.fillRect(34*unit,-43*unit,2*unit,2*unit);
    ctx.globalAlpha=1;
   }
   for(const [rx,ry] of [[-18,-26],[-7,-25],[5,-25],[17,-26]]){
    ctx.fillStyle='#202a29';ctx.fillRect(rx*unit,ry*unit,2.7*unit,2.7*unit);
    ctx.fillStyle='#d0c59d';ctx.fillRect(rx*unit,ry*unit,unit,unit);
   }
   ctx.restore();
   ctx.restore();
  }
 };
 return {pickups,grenades,enemyShots,airBombs,airDrops,plane,covers,prisoners,boss,reset,collect,rescue,hitCover,melee,fire,throwGrenade,kill,step,draw,get weapon(){return weapon},get ammo(){return ammo},get grenadeCount(){return grenadeCount},get combo(){return combo},get screenShake(){return screenShake},set screenShake(value){screenShake=Number.isFinite(value)?Math.max(0,value):0}};
}
