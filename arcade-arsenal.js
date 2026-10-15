// Original 2D projectile visuals and swept collision helpers.
// Pure collision math can be regression-tested without browser or GPU.
export function segmentOverlapsX(previous,current,target,radius){
 if(![previous,current,target,radius].every(Number.isFinite)||radius<0)return false;
 return Math.min(previous,current)-radius<=target&&Math.max(previous,current)+radius>=target;
}
export function segmentHitsRect(x0,y0,x1,y1,cx,cy,halfWidth,halfHeight){
 if(![x0,y0,x1,y1,cx,cy,halfWidth,halfHeight].every(Number.isFinite))return false;
 if(halfWidth<0||halfHeight<0)return false;
 // Slab intersection: avoids high-speed bullets tunnelling across small enemies.
 const dx=x1-x0,dy=y1-y0;let tMin=0,tMax=1;
 for(const [pos,velocity,min,max] of [[x0,dx,cx-halfWidth,cx+halfWidth],[y0,dy,cy-halfHeight,cy+halfHeight]]){
  if(Math.abs(velocity)<1e-9){if(pos<min||pos>max)return false}
  else{
   let t1=(min-pos)/velocity,t2=(max-pos)/velocity;
   if(t1>t2)[t1,t2]=[t2,t1];
   tMin=Math.max(tMin,t1);tMax=Math.min(tMax,t2);
   if(tMin>tMax)return false;
  }
 }
 return true;
}
export function rocketSplashDamage(distance,radius,maxDamage=5){
 if(!Number.isFinite(distance)||!Number.isFinite(radius)||radius<=0)return 0;
 if(distance>radius)return 0;
 return Math.max(1,Math.ceil(maxDamage*(1-distance/radius)));
}
export function drawRocketProjectile(ctx,bullet,H,phase=0){
 const dir=bullet.vx<0?-1:1;
 const x=bullet.x,y=bullet.y,unit=Math.max(1,H*.008);
 ctx.save();ctx.translate(x,y);
 if(Math.abs(bullet.vy||0)>Math.abs(bullet.vx||0)*1.2)ctx.rotate(bullet.vy<0?-Math.PI/2:Math.PI/2);
 else ctx.scale(dir,1);
 ctx.imageSmoothingEnabled=false;
 const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x*unit,y*unit,w*unit,h*unit)};
 // Low-cost flame animation, layered plume and exhaust rings.
 for(let i=0;i<4;i++){
  const size=(4-i)*unit*(.65+.16*Math.sin(phase*.6+i));
  ctx.globalAlpha=Math.max(.1,.38-i*.08);
  ctx.fillStyle=i%2?'#e26c30':'#ffe0a0';
  ctx.fillRect((-13-i*3)*unit,-size*.5,(4+i)*unit,size);
 }
 ctx.globalAlpha=1;
 rect(-11,-3,16,6,'#1a2523');
 rect(-10,-2,14,4,'#65716c');
 rect(-7,-2,10,1,'#c5c8b2');
 rect(4,-3,4,6,'#30383a');
 rect(6,-2,3,4,'#d89b4c');
 rect(-7,-5,4,2,'#404d43');rect(-7,3,4,2,'#404d43');
 rect(-11,-4,3,8,'#3b493c');
 ctx.fillStyle='#fff0b3';ctx.fillRect(8*unit,-unit,3*unit,2*unit);
 ctx.restore();
}
export function drawRocketPickup(ctx,x,y,size){
 ctx.save();ctx.translate(x,y);ctx.imageSmoothingEnabled=false;
 const u=size/36;
 ctx.fillStyle='#111e25';ctx.fillRect(-17*u,-17*u,34*u,34*u);
 ctx.fillStyle='#a84d32';ctx.fillRect(-15*u,-15*u,30*u,30*u);
 ctx.fillStyle='#e4af6b';ctx.fillRect(-14*u,-14*u,28*u,3*u);
 ctx.fillStyle='#f7dd94';ctx.fillRect(-14*u,12*u,28*u,3*u);
 ctx.fillStyle='#222e2f';ctx.fillRect(-12*u,-5*u,21*u,10*u);
 ctx.fillStyle='#9ba8a0';ctx.fillRect(-7*u,-3*u,14*u,6*u);
 ctx.fillStyle='#f1cf79';ctx.fillRect(8*u,-5*u,4*u,10*u);
 ctx.fillStyle='#262e2c';ctx.fillRect(-12*u,-8*u,5*u,16*u);
 ctx.restore();
}
