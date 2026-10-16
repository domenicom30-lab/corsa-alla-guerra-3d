// Projectile trajectory preview for grenadiers. Works without browser APIs.
// Values match enemy-director.js; an explicit signature keeps them unit-testable.
export function grenadeThreat(originX,ground,H,direction){
 if(!Number.isFinite(originX)||!Number.isFinite(ground)||!(H>0)||!Number.isFinite(direction))return null;
 const dir=Math.sign(direction)||1;
 const x=originX+dir*H*.075;
 const y=ground-H*.18;
 const vx=dir*H*.5;
 const vy=-H*.78;
 const gravity=H*1.55;
 const d=vy*vy+2*gravity*(ground-H*.03-y);
 if(d<0)return null;
 const flightTime=(-vy+Math.sqrt(d))/gravity;
 return {x,y,vx,vy,gravity,flightTime,landingX:x+vx*flightTime,landingY:ground-H*.03};
}
export function grenadeThreatPoint(threat,fraction){
 const t=threat.flightTime*Math.min(1,Math.max(0,fraction));
 return {x:threat.x+threat.vx*t,y:threat.y+threat.vy*t+.5*threat.gravity*t*t};
}
export function drawGrenadeThreat(ctx,threat,H,windup,phase,viewportWidth){
 if(!threat||!(windup>0))return false;
 ctx.save();
 const pulse=.53+.29*Math.sin(phase*.18);
 ctx.imageSmoothingEnabled=false;
 // Dashed, world-anchored ballistic guide, not an always-on intrusive overlay.
 for(let i=1;i<=12;i++){
  const p=grenadeThreatPoint(threat,i/13);
  if(p.x<-H*.1||p.x>viewportWidth+H*.1)continue;
  const f=i/13;
  ctx.globalAlpha=(.16+.44*f)*pulse;
  ctx.fillStyle=i%3===0?'#f9dc9e':'#fa9453';
  const sz=Math.max(2,H*(.0028+.002*f));
  ctx.fillRect(p.x-sz*.5,p.y-sz*.5,sz,sz);
 }
 const hit=threat.landingX;
 if(hit>-H*.08&&hit<viewportWidth+H*.08){
  const sz=H*.045,opacity=Math.min(1,(1-windup/.65)*1.2+.3);
  ctx.globalAlpha=opacity*(.7+.3*Math.sin(phase*.21));
  ctx.strokeStyle='#ffb76a';ctx.lineWidth=Math.max(2,H*.004);
  ctx.beginPath();ctx.ellipse(hit,threat.landingY,sz,sz*.22,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#ffe2ab';
  ctx.fillRect(hit-sz*.12,threat.landingY-sz*.12,sz*.24,sz*.24);
 }
 ctx.restore();return true;
}
