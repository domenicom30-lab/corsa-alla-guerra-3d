import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {rasterAssetManifest as manifest,rasterAssetCount,
 loadSpritePacks,spritePacksReady,spritePackStatus,spritePackError,
 drawRaster,drawRasterBackground,disposeSpritePacks} from '../sprite-loader.js';

const specs=[];
for(const category of ['hero','enemies','boss','fx','ui','props'])
 for(const [name,count] of Object.entries(manifest[category]))
  specs.push({category,name,count,size:category==='ui'?manifest.frameSizes.ui[name]:manifest.frameSizes[category]});
for(const scene of manifest.backgrounds)for(const layer of ['far','near'])
 specs.push({category:'backgrounds',name:scene+'-'+layer,count:1,size:manifest.frameSizes.backgrounds});
assert.equal(rasterAssetCount,specs.length);
assert.ok(rasterAssetCount>=33,'Full original raster pack must contain gameplay and scenery');
let totalBytes=0;
for(const {category,name,count,size} of specs){
 const path='public/assets/sprites/'+category+'/'+name+'.png';
 assert.ok(existsSync(path),'Mandatory raster resource missing: '+path);
 const bytes=readFileSync(path);
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',path+' must be a PNG');
 assert.equal(bytes.readUInt32BE(16),size[0]*count,path+' atlas frame width');
 assert.equal(bytes.readUInt32BE(20),size[1],path+' atlas frame height');
 assert.ok(statSync(path).size>900,path+' must be real art, not a blank tiny stub');
 totalBytes+=bytes.length;
}
assert.ok(totalBytes>100000,'Raster archive contains artwork');
assert.deepEqual(JSON.parse(readFileSync('public/assets/sprites/manifest.json','utf8')),manifest);
const expected=new Map(specs.map(x=>[x.category+'/'+x.name,x]));
let created=0;
const createImage=()=>{
 created++;
 let src='';
 return {
  onload:null,onerror:null,naturalWidth:0,naturalHeight:0,
  set src(value){
   src=value;
   const key=value.replace('./assets/sprites/','').replace('.png','');
   const m=expected.get(key);
   if(!m)return this.onerror?.();
   this.naturalWidth=m.size[0]*m.count;this.naturalHeight=m.size[1];
   this.onload?.();
  },get src(){return src}
 };
};
disposeSpritePacks();
assert.equal(spritePacksReady(),false);
await loadSpritePacks(createImage);
assert.equal(spritePacksReady(),true);
assert.equal(created,specs.length);
assert.equal(spritePackStatus().count,specs.length);
let drawArgs=[],smooth=false;
const ctx={imageSmoothingEnabled:true,drawImage(...args){drawArgs.push(args)},
 save(){},restore(){},fillRect(){}};
assert.equal(drawRaster(ctx,'hero','run',7,15,25,110,105),true);
assert.equal(drawArgs[0][1],7*manifest.frameSizes.hero[0]);
assert.equal(drawArgs[0][3],manifest.frameSizes.hero[0]);
assert.equal(drawArgs[0][4],manifest.frameSizes.hero[1]);
assert.equal(ctx.imageSmoothingEnabled,false);
assert.equal(drawRaster(ctx,'hero','missing',0,0,0,10,10),false);
assert.equal(drawRasterBackground(ctx,2,860,390,4500,300),true);
assert.ok(drawArgs.length>2,'Parallax draws real PNG background images');
disposeSpritePacks();
assert.equal(spritePackStatus().count,0);
await assert.rejects(loadSpritePacks(()=>({
 onload:null,onerror:null,
 set src(value){this.onerror?.()}
})),/Sprite obbligatorio mancante/);
assert.equal(spritePacksReady(),false);
assert.ok(spritePackError());
disposeSpritePacks();
const main=readFileSync('main.js','utf8'),
 boss=readFileSync('arcade-mechanics.js','utf8'),
 effects=readFileSync('arcade-spectacle.js','utf8');
for(const token of [
 'loadSpritePacks()', "drawRaster(ctx,'hero',pose,frame",
 "drawRaster(ctx,'enemies',e.type",
 'drawRasterBackground(ctx,stageAt(scroll)',
 'if(!rasterLoaded){',
 "drawRaster(ctx,'fx','explosion'",
 "drawRaster(ctx,'ui','title'"
])assert.ok(main.includes(token),token);
assert.ok(boss.includes("drawRaster(ctx,'boss','commander'"));
assert.ok(effects.includes("drawRaster(ctx,'fx','smoke'"));
assert.ok(!main.includes("if(!drawHeroFrame("),'Characters must not fall back to code-painted placeholders');
assert.ok(!main.includes("if(!drawTroop("),'Troops must not use generated runtime sprite fallback');
console.log('PASS: '+specs.length+' mandatory original PNG sheets, atlas dimensions, pure 2D sprite loader and strict missing-asset failure ('+(totalBytes/1048576).toFixed(2)+' MiB)');
