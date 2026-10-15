// Original independent 2D backdrops and pose-specific animation sheets.
export const arcadeArt={};
const files={
 soldier:'soldier-run.svg',soldier_idle:'soldier-idle.svg',soldier_run:'soldier-run.svg',
 soldier_jump:'soldier-jump.svg',soldier_fire:'soldier-fire.svg',soldier_duck:'soldier-duck.svg',
 tick:'red-tick.svg',crate:'../2d/crate.png',sandbags:'../2d/sandbags.png',tower:'watchtower.png',
 sky:'sky.svg',mountains:'mountains.svg',forest:'forest.svg',foreground:'foreground.svg',
 forestPhoto:'../2d/forest-background.webp'
};
export async function loadArcadeArt(){
 return Promise.all(Object.entries(files).map(([key,name])=>new Promise(resolve=>{
  const image=new Image();
  image.onload=()=>{if(image.naturalWidth>0&&image.naturalHeight>0)arcadeArt[key]=image;resolve(true)};
  image.onerror=()=>resolve(false);
  image.src='./assets/arcade/'+name;
 })));
}
function tile(g,img,offset,w,h,baseY,ratio){
 const height=h*ratio,width=Math.max(1,img.width*(height/img.height));
 const x=-((offset%width)+width)%width;
 for(let px=x;px<w;px+=width)g.drawImage(img,px,baseY,width,height);
}
export function paintArcadeBackground(g,w,h,scroll){
 if(!arcadeArt.sky||!arcadeArt.mountains||!arcadeArt.forest||!arcadeArt.foreground)return false;
 g.clearRect(0,0,w,h);
 tile(g,arcadeArt.sky,scroll*.03,w,h,0,1);
 if(arcadeArt.forestPhoto){
  g.save();g.globalAlpha=.14;
  tile(g,arcadeArt.forestPhoto,scroll*.08,w,h,h*.20,.56);
  g.restore();
 }
 tile(g,arcadeArt.mountains,scroll*.12,w,h,h*.13,.65);
 tile(g,arcadeArt.forest,scroll*.32,w,h,h*.18,.66);
 tile(g,arcadeArt.foreground,scroll,w,h,h*.72,.28);
 return true;
}
// Sprite sheets are actual shipped assets; generated pixel figures remain a fallback.
const poses={
 idle:['soldier_idle',1],run:['soldier_run',8],jump:['soldier_jump',1],
 fire:['soldier_fire',4],duck:['soldier_duck',1]
};
export function drawArcadeSoldierFrame(ctx,pose,frame,x,y,w,h){
 const [asset,count]=poses[pose]||poses.idle;
 const sheet=arcadeArt[asset];
 if(!sheet||!sheet.naturalWidth)return false;
 const tileWidth=sheet.naturalWidth/count,sourceFrame=Math.abs(Math.floor(frame))%count;
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(sheet,sourceFrame*tileWidth,0,tileWidth,sheet.naturalHeight,x,y,w,h);
 return true;
}
