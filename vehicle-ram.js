// Pure swept world-space tank collisions. Callers own all score and effects.
export function vehicleRamContacts({
 occupied=false,hp=0,velocity=0,fromX=0,toX=0,H=0,
 troops=[],obstacles=[],covers=[]
}={}){
 if(!occupied||hp<=0||!Number.isFinite(H)||H<=0||
    !Number.isFinite(velocity)||Math.abs(velocity)<75||
    !Number.isFinite(fromX)||!Number.isFinite(toX)||Math.abs(toX-fromX)<.001)return [];
 const dir=Math.sign(velocity);
 // A retreating vehicle cannot crush something behind its rear tracks.
 if(Math.sign(toX-fromX)!==dir)return [];
 const frontBefore=fromX+dir*H*.21,frontAfter=toX+dir*H*.21;
 const margin=H*.055,lo=Math.min(frontBefore,frontAfter)-margin,hi=Math.max(frontBefore,frontAfter)+margin;
 const hits=[];
 const add=(items,kind,isActive)=>{
  for(const ref of items){
   if(!ref||!isActive(ref)||!Number.isFinite(ref.x))continue;
   if(ref.x>=lo&&ref.x<=hi)hits.push({kind,ref,x:ref.x,travel:Math.max(0,(ref.x-frontBefore)*dir)});
  }
 };
 add(troops,'troop',e=>e.alive);
 add(obstacles,'obstacle',e=>e.alive);
 add(covers,'cover',c=>c.hp>0);
 hits.sort((a,b)=>a.travel-b.travel);
 return hits;
}
