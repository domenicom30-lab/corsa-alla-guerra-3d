// Deterministic first contact on a 2D segment, with bounds kept in world order.
export function firstRectHit(x0,y0,x1,y1,rect){
 if(!rect||![x0,y0,x1,y1,rect.x,rect.y,rect.w,rect.h].every(Number.isFinite)||rect.w<0||rect.h<0)return null;
 const dx=x1-x0,dy=y1-y0;
 let start=0,end=1;
 for(const [p,v,a,b] of [[x0,dx,rect.x-rect.w,rect.x+rect.w],[y0,dy,rect.y-rect.h,rect.y+rect.h]]){
  if(Math.abs(v)<1e-9){if(p<a||p>b)return null;continue;}
  const t1=(a-p)/v,t2=(b-p)/v;
  start=Math.max(start,Math.min(t1,t2));end=Math.min(end,Math.max(t1,t2));
  if(start>end)return null;
 }
 return start>=0&&start<=1?start:null;
}
export function nearestRectHit(x0,y0,x1,y1,items){
 if(!Array.isArray(items))return null;
 let result=null;
 for(const item of items){
  const t=firstRectHit(x0,y0,x1,y1,item);
  if(t===null)continue;
  if(!result||t<result.t-1e-9)result={item,t,x:x0+(x1-x0)*t,y:y0+(y1-y0)*t};
 }
 return result;
}
