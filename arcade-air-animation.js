// Eight original authored airborne sprite keys, linked to physical jump trajectory.
// Positive vy = ascent. No screen-time, FPS or global animation phase dependency.
export const AIRBORNE_FRAMES=8;
export function airborneFrame(jumpY,vy,H){
 if(![jumpY,vy,H].every(Number.isFinite)||H<=0||jumpY<=0)return 0;
 const position=Math.max(0,Math.min(1,jumpY/(H*.23)));
 if(vy>0)return Math.max(0,Math.min(3,Math.floor(position*4)));
 return Math.max(4,Math.min(7,4+Math.floor((1-position)*4)));
}
export function airbornePose(jumpY,fireHeld,muzzleFlash){
 return jumpY>0?(fireHeld||muzzleFlash>0?'jumpFire':'jump'):null;
}
