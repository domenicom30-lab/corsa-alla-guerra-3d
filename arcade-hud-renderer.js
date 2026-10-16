// Text-only HUD diffing: never rebuild DOM panels in every 60 FPS frame.
// The renderer is deliberately independent of document and browser APIs so
// mobile regressions can be tested headlessly.
export function createHudRenderer({points,hearts,stats,armorHud,armorFill,armorLabel}){
 const old={points:null,hearts:null,stats:null,armorVisible:null,armorPct:null,armorText:null,armorCritical:null};
 const writes={points:0,hearts:0,stats:0,armor:0};
 function update({score,best,credits,health,stage,remaining,weapon,ammo,grenades,combo,bossHealth,vehicle,vehicleHp,vehicleMaxHp}){
  const pointString='PUNTI '+Math.max(0,score)+' · BEST '+Math.max(0,best)+' · C '+Math.max(0,credits);
  if(pointString!==old.points){points.textContent=pointString;old.points=pointString;writes.points++}
  const hp=Math.max(0,Math.min(3,Math.floor(health)));
  if(hp!==old.hearts){
   hearts.innerHTML=Array.from({length:3},(_,i)=>'<span class="heart '+(i>=hp?'heart-lost':'')+'">♥</span>').join('');
   old.hearts=hp;writes.hearts++;
  }
  const ammoText=Number.isFinite(ammo)?' '+Math.max(0,Math.floor(ammo)):'';
  const statString='Z'+(stage+1)+' · '+Math.max(0,Math.floor(remaining))+'m · '+String(weapon||'pistol').toUpperCase()+ammoText+
   ' · BOMBE '+Math.max(0,grenades)+(combo>1?' · COMBO x'+combo:'')+
   (bossHealth===null?'':' · BOSS '+Math.max(0,Math.ceil(bossHealth))+'%');
  if(statString!==old.stats){stats.textContent=statString;old.stats=statString;writes.stats++}
  const visible=Boolean(vehicle);
  if(visible!==old.armorVisible){armorHud.hidden=!visible;old.armorVisible=visible;writes.armor++}
  if(visible){
   const pct=Math.max(0,Math.min(100,(vehicleHp/Math.max(1,vehicleMaxHp))*100));
   const rounded=Math.ceil(pct),label='CORAZZA '+rounded+'%',critical=pct<=30;
   if(rounded!==old.armorPct){armorFill.style.width=pct+'%';old.armorPct=rounded;writes.armor++}
   if(label!==old.armorText){armorLabel.textContent=label;old.armorText=label;writes.armor++}
   if(critical!==old.armorCritical){armorHud.classList.toggle('critical',critical);old.armorCritical=critical;writes.armor++}
  }
 }
 return {update,stats:()=>({...writes})};
}
