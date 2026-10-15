// Shared visual proportions for an original compact arcade run-and-gun cast.
// Proportions are independent of gameplay hitboxes: no damage balance changes.
const size=(height,factor)=>Math.max(1,height)*factor;
export const SPRITE_FRAME_RATIO=240/210;
export function heroDimensions(H,crouching=false){
 const h=size(H,crouching?.265:.375);
 return {h,w:h*SPRITE_FRAME_RATIO};
}
export function troopDimensions(H,kind='rifleman',crouching=false){
 const h=size(H,crouching?.255:kind==='heavy'?.395:kind==='grenadier'?.355:.342);
 return {h,w:h*SPRITE_FRAME_RATIO};
}
export function vehicleDimensions(H,boss=false){
 const h=size(H,boss?.54:.335);
 return {h,w:h*(boss?340/240:1.55)};
}
export function activeBodyRatio(sourceHeight=210,top=35,bottom=194){
 return (bottom-top)/sourceHeight;
}
