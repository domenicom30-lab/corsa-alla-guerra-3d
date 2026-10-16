// Shared arcade visual proportions, tuned for Samsung landscape.
// PNG atlases include approximately 24% empty vertical margins.
// Never use these visual dimensions as physics/hitbox constants.
const size=(height,factor)=>Math.max(1,height)*factor;
export const SPRITE_FRAME_RATIO=240/210;
export function heroDimensions(H,crouching=false){
 const h=size(H,crouching?.165:.218);
 return {h,w:h*SPRITE_FRAME_RATIO};
}
export function troopDimensions(H,kind='rifleman',crouching=false){
 const h=size(H,crouching?.165:kind==='heavy'?.248:kind==='grenadier'?.222:kind==='assault'?.220:.208);
 return {h,w:h*SPRITE_FRAME_RATIO};
}
export function vehicleDimensions(H,boss=false){
 // The drivable vehicle uses hand-drawn units from y=-34 to ground, not all 19 units!
 const h=size(H,boss?.405:.145);
 return {h,w:h*(boss?340/240:1.55)};
}
export function activeBodyRatio(sourceHeight=210,top=35,bottom=194){
 return (bottom-top)/sourceHeight;
}
