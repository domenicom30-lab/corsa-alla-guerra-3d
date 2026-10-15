// Original arcade run-and-gun systems: weapon pickups, grenades, enemy volleys, boss.
export function createArcadeSystems(){
 const pickups=Array.from({length:8},(_,i)=>({x:1400+i*2100,type:i%3===0?'spread':i%3===1?'heavy':'health',taken:false}));
 const grenades=[],enemyShots=[];
 const covers=[2350,5750,8850].map(x=>({x,hp:100}));
 const prisoners=[1750,4850,7950].map(x=>({x,rescued:false}));
 const boss={x:9600,hp:28,maxHp:28,active:false,defeated:false,cooldown:1.3,velocity:0,turretAngle:0,recoil:0,treadDistance:0};
 let weapon='normal',ammo=Infinity,grenadeCount=8,combo=0,comboTimer=0,screenShake=0;
 const reset=()=>{weapon='normal';ammo=Infinity;grenadeCount=8;combo=0;comboTimer=0;screenShake=0;grenades.length=0;enemyShots.length=0;pickups.forEach(p=>p.taken=false);covers.forEach(c=>c.hp=100);prisoners.forEach(p=>p.rescued=false);Object.assign(boss,{hp:28,active:false,defeated:false,cooldown:1.3,velocity:0,turretAngle:0,recoil:0,treadDistance:0})};
 const collect=(worldX,jump,ground,H)=>{let reward=null;for(const p of pickups){if(p.taken||Math.abs(p.x-worldX)>H*.12||jump>H*.18)continue;p.taken=true;reward=p.type;if(p.type==='health'){}else{weapon=p.type;ammo=p.type==='spread'?100:160}}return reward};
 const rescue=(worldX,jump,H)=>{let n=0;for(const p of prisoners)if(!p.rescued&&Math.abs(p.x-worldX)<H*.12&&jump<H*.2){p.rescued=true;n++}return n};
 const fire=(x,y,direction,speed)=>{if(ammo<=0){weapon='normal';ammo=Infinity}const pattern=weapon==='spread'?[-.14,0,.14]:[0];const shots=pattern.map(a=>({x,y,vx:direction*speed,vy:a*speed,damage:weapon==='heavy'?2:1,life:1.8,kind:weapon}));if(Number.isFinite(ammo)){ammo--;if(ammo<=0){weapon='normal';ammo=Infinity}}return shots};
 const throwGrenade=(x,y,direction,H)=>{if(grenadeCount<=0)return false;grenadeCount--;grenades.push({x,y,vx:direction*H*1.2,vy:-H*.9,fuse:.9,life:1.5});return true};
 const kill=()=>{combo++;comboTimer=3;screenShake=Math.min(12,screenShake+3);return 100+Math.min(combo,15)*20};
 const step=(dt,scroll,playerX,ground,H,onDamage,onExplosion,cameraDelta=0)=>{
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
    boss.cooldown=3;boss.recoil=1;screenShake=Math.min(12,screenShake+6);
    const dirX=Math.cos(boss.turretAngle),dirY=Math.sin(boss.turretAngle);
    enemyShots.push({x:boss.x-scroll+dirX*H*.43,y:turretY+dirY*H*.43,vx:dirX*H*.85,vy:dirY*H*.85,life:3});
    boss.velocity-=dirX*H*.045;
   }
   }
  }
  for(let i=enemyShots.length-1;i>=0;i--){const b=enemyShots[i];b.x+=b.vx*dt-cameraDelta;b.y+=b.vy*dt;b.life-=dt;if(Math.abs(b.x-playerX)<H*.065&&Math.abs(b.y-(ground-H*.18))<H*.16){onDamage();enemyShots.splice(i,1)}else if(b.life<=0)enemyShots.splice(i,1)}
  for(let i=grenades.length-1;i>=0;i--){const g=grenades[i];g.x+=g.vx*dt-cameraDelta;g.y+=g.vy*dt;g.vy+=H*2.4*dt;g.fuse-=dt;if(g.y>ground-H*.02){g.y=ground-H*.02;g.vy*=-.35;g.vx*=.8}if(g.fuse<=0){for(const c of covers)if(Math.abs(c.x-(scroll+g.x))<H*.4)c.hp=Math.max(0,c.hp-50);onExplosion(g.x,g.y,H*.35);screenShake=14;grenades.splice(i,1)}}
 };
 const draw=(ctx,scroll,ground,H,phase)=>{
  for(const c of covers){if(c.hp<=0)continue;const x=c.x-scroll;if(x< -H*.2||x>ctx.canvas.width+H*.2)continue;ctx.fillStyle=c.hp>50?'#796548':'#56483a';ctx.fillRect(x-H*.08,ground-H*.13,H*.16,H*.13);ctx.strokeStyle='#bca77c';for(let row=0;row<3;row++)ctx.strokeRect(x-H*.08,ground-H*(.13-row*.04),H*.16,H*.04)}
  for(const p of prisoners){if(p.rescued)continue;const x=p.x-scroll;if(x< -H*.2||x>ctx.canvas.width+H*.2)continue;ctx.fillStyle='#c4ad6d';ctx.fillRect(x-H*.03,ground-H*.13,H*.06,H*.1);ctx.fillStyle='#e3bb8c';ctx.fillRect(x-H*.03,ground-H*.17,H*.06,H*.05)}
  for(const p of pickups){if(p.taken)continue;const x=p.x-scroll;if(x< -80||x>(ctx.canvas.clientWidth||ctx.canvas.width)+80)continue;const y=ground-H*.18+Math.sin(phase*.12)*H*.013;ctx.save();ctx.translate(x,y);ctx.fillStyle=p.type==='health'?'#c63e42':p.type==='spread'?'#d9b64e':'#6cba96';ctx.fillRect(-H*.035,-H*.035,H*.07,H*.07);ctx.strokeStyle='#fff5d4';ctx.lineWidth=2;ctx.strokeRect(-H*.035,-H*.035,H*.07,H*.07);ctx.fillStyle='#171d19';ctx.font='bold '+Math.max(11,H*.042)+'px monospace';ctx.textAlign='center';ctx.fillText(p.type==='health'?'+':p.type==='spread'?'S':'H',0,H*.015);ctx.restore()}
  for(const g of grenades){ctx.fillStyle='#313e30';ctx.beginPath();ctx.arc(g.x,g.y,H*.02,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e2c06d';ctx.fillRect(g.x-2,g.y-H*.03,4,5)}
  for(const b of enemyShots){ctx.fillStyle='#ff5d3d';ctx.fillRect(b.x-5,b.y-3,10,6)}
  if(boss.active&&!boss.defeated){
   const x=boss.x-scroll,unit=H*.01;
   const viewportWidth=ctx.canvas?.clientWidth||ctx.canvas?.width||Infinity;
   if(x<-H*.55||x>viewportWidth+H*.55)return;
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
   ctx.restore();
  }
 };
 return {pickups,grenades,enemyShots,covers,prisoners,boss,reset,collect,rescue,fire,throwGrenade,kill,step,draw,get weapon(){return weapon},get ammo(){return ammo},get grenadeCount(){return grenadeCount},get combo(){return combo},get screenShake(){return screenShake},set screenShake(value){screenShake=Number.isFinite(value)?Math.max(0,value):0}};
}
