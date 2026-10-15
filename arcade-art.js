// Optional high-detail transparent sprite sheets. Original procedural art is only a fallback.
// The files are independent PNG/WebP images, never a flattened screenshot.
export const arcadeArt={};
const files={
 soldier:'soldier-run.svg',tick:'red-tick.png',crate:'crate.png',
 sandbags:'sandbags.png',tower:'watchtower.png',
 sky:'sky.svg',mountains:'mountains.svg',forest:'forest.svg',foreground:'foreground.svg'
};
export async function loadArcadeArt(){
 const jobs=Object.entries(files).map(([key,name])=>new Promise(resolve=>{
  const image=new Image();image.onload=()=>{arcadeArt[key]=image;resolve(true)};
  image.onerror=()=>resolve(false);image.src='./assets/arcade/'+name;
 }));
 return Promise.all(jobs);
}
function tile(g,img,offset,w,h,baseY,ratio){
 const height=h*ratio,width=img.width*(height/img.height),x=-((offset%width)+width)%width;
 for(let px=x;px<w;px+=width)g.drawImage(img,px,baseY,width,height);
}
export function paintArcadeBackground(g,w,h,scroll){
 if(!arcadeArt.sky||!arcadeArt.mountains||!arcadeArt.forest||!arcadeArt.foreground)return false;
 g.clearRect(0,0,w,h);
 tile(g,arcadeArt.sky,scroll*.03,w,h,0,1);
 tile(g,arcadeArt.mountains,scroll*.12,w,h,h*.13,.65);
 tile(g,arcadeArt.forest,scroll*.32,w,h,h*.18,.66);
 tile(g,arcadeArt.foreground,scroll,w,h,h*.72,.28);
 return true;
}
