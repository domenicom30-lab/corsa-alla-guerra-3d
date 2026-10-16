// Mandatory pre-rendered PNG sprite atlases, verified by CI and loaded once.
// Source originals are generated offline; runtime only blits raster image rectangles.
import manifest from './sprite-manifest.json' with { type: 'json' };
const SHEET_ROOT='./assets/sprites/';
let state='idle',failure=null,loadPromise=null;
const images=new Map();
const dimensions=manifest.frameSizes;
const names=[];
for(const group of ['hero','enemies','boss','vehicles','fx','ui','props']){
 for(const [name,frames] of Object.entries(manifest[group]))names.push({
  key:group+'/'+name,url:SHEET_ROOT+group+'/'+name+'.png',frames,
  dimensions:group==='ui'?dimensions.ui[name]:dimensions[group]
 });
}
for(const theme of manifest.backgrounds)for(const layer of ['far','near'])
 names.push({key:'backgrounds/'+theme+'-'+layer,url:SHEET_ROOT+'backgrounds/'+theme+'-'+layer+'.png',
 frames:1,dimensions:dimensions.backgrounds});
export const rasterAssetManifest=Object.freeze(manifest);
export const rasterAssetCount=names.length;
export function loadSpritePacks(createImage=()=>new Image()){
 if(state==='ready')return Promise.resolve(true);
 if(state==='loading')return loadPromise;
 state='loading';failure=null;
 loadPromise=Promise.all(names.map(entry=>new Promise((resolve,reject)=>{
  const image=createImage();
  image.onload=()=>{
   const [fw,fh]=entry.dimensions;
   if(image.naturalWidth!==fw*entry.frames||image.naturalHeight!==fh)
     return reject(new Error(entry.key+' dimensioni non valide'));
   images.set(entry.key,image);resolve(entry.key);
  };
  image.onerror=()=>reject(new Error('Sprite obbligatorio mancante: '+entry.url));
  image.src=entry.url;
 }))).then(()=>{state='ready';return true}).catch(err=>{
  state='error';failure=err;images.clear();throw err;
 });
 return loadPromise;
}
export const spritePacksReady=()=>state==='ready';
export const spritePackError=()=>failure;
export function drawRaster(ctx,group,name,frame,x,y,w,h){
 const img=images.get(group+'/'+name),count=manifest[group]?.[name];
 if(!img||!count||!(w>0&&h>0))return false;
 const [sw,sh]=group==='ui'?dimensions.ui[name]:dimensions[group];
 const index=Math.abs(Math.floor(frame||0))%count;
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(img,index*sw,0,sw,sh,x,y,w,h);
 return true;
}
export function drawRasterBackground(ctx,stage,W,H,scroll,ground){
 if(state!=='ready')return false;
 const name=manifest.backgrounds[stage]||manifest.backgrounds[0];
 const far=images.get('backgrounds/'+name+'-far'),near=images.get('backgrounds/'+name+'-near');
 if(!far||!near)return false;
 const imgWidth=H*1400/540;
 const tile=(img,parallax)=>{const x0=-((scroll*parallax%imgWidth)+imgWidth)%imgWidth;
  for(let x=x0-imgWidth;x<W+imgWidth;x+=imgWidth)ctx.drawImage(img,x,0,imgWidth,ground+H*.08)};
 ctx.save();ctx.imageSmoothingEnabled=false;
 tile(far,.10);tile(near,.32);
 ctx.restore();
 // Grounded pixel-art forest floor; drawn after parallax to avoid a black empty band.
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.fillStyle=name==='forest'?'#393b2e':name==='village'?'#51473a':name==='industrial'?'#404340':'#444841';
 ctx.fillRect(0,ground,W,Math.max(0,H-ground));
 ctx.fillStyle=name==='forest'?'#718269':'#979383';ctx.fillRect(0,ground,W,H*.010);
 ctx.fillStyle='#262e29';ctx.fillRect(0,ground+H*.012,W,H*.024);
 const stride=H*.073,start=Math.floor(scroll/stride);
 for(let i=-1;i<Math.ceil(W/stride)+2;i++){
   const world=i+start,px=i*stride-scroll%stride,n=Math.abs(Math.sin(world*13.391)*9983)%1;
   const depth=H*(.032+n*.19);
   ctx.fillStyle=world%3===0?'#897b5f':'#252c28';
   ctx.fillRect(px,ground+depth,H*(.008+n*.01),H*(.003+n*.005));
   if(world%4===0){ctx.fillStyle='#647b52';ctx.fillRect(px+H*.016,ground-H*.012,H*.006,H*.017)}
 }
 ctx.restore();return true;
}
export function disposeSpritePacks(){images.clear();state='idle';failure=null;loadPromise=null}
export function spritePackStatus(){return {state,count:images.size,total:names.length,error:failure?.message||null}}
