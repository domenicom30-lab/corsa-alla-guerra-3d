// Original arcade run-and-gun systems: weapon pickups, grenades, enemy volleys, boss.
export function createArcadeSystems(){
 const pickups=Array.from({length:8},(_,i)=>({x:1400+i*2100,type:i%3===0?'spread':i%3===1?'heavy':'health',taken:false}));
 const grenades=[],enemyShots=[];
 const boss={x:9600,hp:28,maxHp:28,active:false,defeated:false,cooldown:1.3};
 let weapon='normal',ammo=Infinity,grenadeCount=8,combo=0,comboTimer=0,screenShake=0;
 const reset=()=>{weapon='normal';ammo=Infinity;grenadeCount=8;combo=0;comboTimer=0;screenShake=0;grenades.length=0;enemyShots.length=0;pickups.forEach(p=>p.taken=false);Object.assign(boss,{hp:28,active:false,defeated:false,cooldown:1.3})};
 const collect=(worldX,jump,ground,H)=>{let reward=null;for(const p of pickups){if(p.taken||Math.abs(p.x-worldX)>H*.12||jump>H*.18)continue;p.taken=true;reward=p.type;if(p.type==='health'){}else{weapon=p.type;ammo=p.type==='spread'?100:160}}return reward};
 const fire=(x,y,direction,speed)=>{if(ammo<=0){weapon='normal';ammo=Infinity}const pattern=weapon==='spread'?[-.14,0,.14]:[0];const shots=pattern.map(a=>({x,y,vx:direction*speed,vy:a*speed,damage:weapon==='heavy'?2:1,life:1.8,kind:weapon}));if(Number.isFinite(ammo)){ammo--;if(ammo<=0){weapon='normal';ammo=Infinity}}return shots};
 const throwGrenade=(x,y,direction,H)=>{if(grenadeCount<=0)return false;grenadeCount--;grenades.push({x,y,vx:direction*H*1.2,vy:-H*.9,fuse:.9,life:1.5});return true};
 const kill=()=>{combo++;comboTimer=3;screenShake=Math.min(12,screenShake+3);return 100+Math.min(combo,15)*20};
 const step=(dt,scroll,playerX,ground,H,onDamage,onExplosion,cameraDelta=0)=>{
  comboTimer-=dt;if(comboTimer<=0)combo=0;screenShake=Math.max(0,screenShake-dt*28);
  if(!boss.defeated&&scroll+playerX>boss.x-H*1.6)boss.active=true;
  if(boss.active&&!boss.defeated){boss.cooldown-=dt;if(boss.cooldown<=0){boss.cooldown=1.1;for(let i=-1;i<=1;i++)enemyShots.push({x:boss.x-scroll-H*.14,y:ground-H*.23,vx:-H*(.65+i*.1),vy:i*H*.23,life:3})}}
  for(let i=enemyShots.length-1;i>=0;i--){const b=enemyShots[i];b.x+=b.vx*dt-cameraDelta;b.y+=b.vy*dt;b.life-=dt;if(Math.abs(b.x-playerX)<H*.065&&Math.abs(b.y-(ground-H*.18))<H*.16){onDamage();enemyShots.splice(i,1)}else if(b.life<=0)enemyShots.splice(i,1)}
  for(let i=grenades.length-1;i>=0;i--){const g=grenades[i];g.x+=g.vx*dt-cameraDelta;g.y+=g.vy*dt;g.vy+=H*2.4*dt;g.fuse-=dt;if(g.y>ground-H*.02){g.y=ground-H*.02;g.vy*=-.35;g.vx*=.8}if(g.fuse<=0){onExplosion(g.x,g.y,H*.35);screenShake=14;grenades.splice(i,1)}}
 };
 const draw=(ctx,scroll,ground,H,phase)=>{
  for(const p of pickups){if(p.taken)continue;const x=p.x-scroll;if(x< -80||x>ctx.canvas.width+80)continue;const y=ground-H*.18+Math.sin(phase*.12)*H*.013;ctx.save();ctx.translate(x,y);ctx.fillStyle=p.type==='health'?'#c63e42':p.type==='spread'?'#d9b64e':'#6cba96';ctx.fillRect(-H*.035,-H*.035,H*.07,H*.07);ctx.strokeStyle='#fff5d4';ctx.lineWidth=2;ctx.strokeRect(-H*.035,-H*.035,H*.07,H*.07);ctx.fillStyle='#171d19';ctx.font='bold '+Math.max(11,H*.042)+'px monospace';ctx.textAlign='center';ctx.fillText(p.type==='health'?'+':p.type==='spread'?'S':'H',0,H*.015);ctx.restore()}
  for(const g of grenades){ctx.fillStyle='#313e30';ctx.beginPath();ctx.arc(g.x,g.y,H*.02,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e2c06d';ctx.fillRect(g.x-2,g.y-H*.03,4,5)}
  for(const b of enemyShots){ctx.fillStyle='#ff5d3d';ctx.fillRect(b.x-5,b.y-3,10,6)}
  if(boss.active&&!boss.defeated){const x=boss.x-scroll;ctx.save();ctx.translate(x,ground);ctx.fillStyle='#252f2d';ctx.fillRect(-H*.25,-H*.32,H*.5,H*.29);ctx.fillStyle='#5b6856';ctx.fillRect(-H*.22,-H*.39,H*.43,H*.13);ctx.fillStyle='#a39a6d';ctx.fillRect(-H*.12,-H*.46,H*.24,H*.1);ctx.fillStyle='#222';ctx.fillRect(-H*.15,-H*.12,H*.3,H*.1);for(const dx of [-.16,.14]){ctx.fillStyle='#111';ctx.beginPath();ctx.arc(H*dx,-H*.03,H*.075,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#181b1b';ctx.fillRect(-H*.36,-H*.29,H*.32,H*.055);ctx.fillStyle='#541e1e';ctx.fillRect(-H*.24,-H*.55,H*.48,H*.022);ctx.fillStyle='#e54d32';ctx.fillRect(-H*.24,-H*.55,H*.48*boss.hp/boss.maxHp,H*.022);ctx.restore()}
 };
 return {pickups,grenades,enemyShots,boss,reset,collect,fire,throwGrenade,kill,step,draw,get weapon(){return weapon},get ammo(){return ammo},get grenadeCount(){return grenadeCount},get combo(){return combo},get screenShake(){return screenShake}};
}
