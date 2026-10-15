// Original procedural pixel-art sprites: transparent layers, no baked-in gameplay.
const P=4;
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function draw(w,h,paint){const c=canvas(w,h),g=c.getContext('2d');g.imageSmoothingEnabled=false;paint(g);return c}
function box(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)}
function poly(g,points,c){g.fillStyle=c;g.beginPath();g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.closePath();g.fill()}
function ellipse(g,x,y,rx,ry,c){g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill()}
function seed(n){const v=Math.sin(n*91.173+19.87)*43758.5453;return v-Math.floor(v)}
export const sprites={
 soldier:Array.from({length:6},(_,frame)=>draw(72,88,g=>{
  const stride=[0,6,10,3,-5,-9][frame],arm=[-3,-1,1,3,1,-2][frame];
  ellipse(g,34,83,24,4,'#171a18aa');
  // Separate animated boots, legs and trousers.
  poly(g,[[23,56],[35,56],[33+stride,75],[29+stride,82],[20+stride,80],[20,67]],'#242b20');
  poly(g,[[35,56],[46,56],[44-stride,75],[50-stride,81],[39-stride,83],[32,67]],'#485438');
  box(g,18+stride,79,16,5,'#191d19');box(g,38-stride,79,17,5,'#1b1e1a');
  box(g,22,29,25,31,'#343d2c');box(g,24,32,17,21,'#65714a');box(g,23,47,24,5,'#292b21');
  box(g,17,31,8,24,'#4a4b30');box(g,16,34,5,17,'#77734c');
  box(g,39,33,8,18,'#586244');box(g,43,39+arm,17,6,'#a38863');
  box(g,28,17,15,15,'#a68a66');box(g,38,21,5,5,'#b99d76');box(g,42,23,2,2,'#222820');
  box(g,24,14,24,9,'#333f30');box(g,21,20,30,5,'#1c271f');box(g,26,15,16,3,'#768263');
  box(g,29,25,12,2,'#54452e');
  box(g,47,38+arm,20,5,'#292b29');box(g,55,36+arm,12,2,'#131818');box(g,48,42+arm,10,3,'#876442');
  box(g,54,43+arm,4,7,'#37372d');
  box(g,19,39,6,3,'#9b855e');
 })),
 tick:Array.from({length:4},(_,frame)=>draw(52,40,g=>{
  const a=frame%2?3:0;
  for(let i=0;i<4;i++){const y=14+i*5;box(g,3,y+a*(i%2),13,3,'#351315');box(g,37,y-a*(i%2),12,3,'#351315');box(g,4,y+4+a*(i%2),5,3,'#511519');box(g,44,y+4-a*(i%2),5,3,'#511519')}
  ellipse(g,26,20,18,15,'#340e13');ellipse(g,26,18,15,13,'#a7111d');ellipse(g,22,13,9,7,'#df302c');
  box(g,16,9,5,4,'#f16a52');box(g,29,9,5,4,'#f16a52');box(g,18,13,3,3,'#ffdec2');box(g,31,13,3,3,'#ffdec2');
  box(g,24,21,9,4,'#5c0b14');box(g,19,28,15,3,'#6e1017');
 })),
 crate:draw(42,42,g=>{
  box(g,2,2,38,38,'#291d17');box(g,5,5,32,32,'#77502b');
  for(let i=0;i<4;i++)box(g,7+i*8,6,2,30,i%2?'#9c6e3e':'#4b301f');
  poly(g,[[6,8],[10,6],[36,33],[32,36]],'#bd8a4b');
  poly(g,[[35,7],[37,10],[10,36],[7,32]],'#aa7a42');
  box(g,2,3,38,5,'#a57a46');box(g,2,34,38,5,'#4c3323');
  for(const x of [5,35])for(const y of [6,35])box(g,x,y,3,3,'#b7aa81');
 }),
 sandbags:draw(64,42,g=>{
  for(let row=0;row<3;row++)for(let i=0;i<(row===2?3:4);i++){
   const x=i*16+(row===2?8:row%2?5:0),y=31-row*11;
   ellipse(g,x+8,y+4,10,6,'#2e2a1e');ellipse(g,x+8,y+2,9,5,['#918267','#a99b7d','#7e765f'][row]);
   box(g,x+2,y+2,7,2,'#c6b99a');box(g,x+12,y+4,4,2,'#625b48');
  }
 }),
 tower:draw(90,165,g=>{
  box(g,14,35,9,130,'#342719');box(g,67,35,9,130,'#342719');
  for(let i=0;i<4;i++){const y=47+i*30;poly(g,[[18,y],[24,y],[72,y+26],[66,y+26]],'#7b5937');poly(g,[[68,y],[74,y],[22,y+26],[16,y+26]],'#624527')}
  box(g,6,28,78,9,'#6b4b2c');box(g,8,0,7,39,'#3c2d1e');box(g,75,0,7,39,'#3c2d1e');
  box(g,6,3,78,7,'#5d4028');box(g,4,10,82,5,'#9b7347');
  for(let i=0;i<6;i++)box(g,10+i*13,15,9,15,'#493422');
  box(g,19,42,50,4,'#a17a48');
 }),
};
export function pixelBackdrop(g,w,h,scroll){
 const horizon=h*.76;
 const sky=g.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,'#4b83b5');sky.addColorStop(.68,'#a5c3c3');sky.addColorStop(1,'#e4c9a3');g.fillStyle=sky;g.fillRect(0,0,w,h);
 for(let layer=0;layer<3;layer++){
  const speed=[.07,.18,.39][layer],step=[125,75,43][layer],offset=scroll*speed;
  for(let i=Math.floor(offset/step)-2;i<Math.ceil((offset+w)/step)+2;i++){
   const x=Math.floor(i*step-offset),v=seed(i+layer*111),base=h*[.63,.72,.80][layer];
   if(layer===0){poly(g,[[x-95,base],[x,base-75-v*46],[x+90,base]],'#788fa2');poly(g,[[x-28,base-38],[x,base-75-v*46],[x+29,base-35]],'#d7d9d3');continue}
   const tall=25+v*(layer===2?42:64);
   box(g,x-3,base-tall,6,horizon-base+tall,'#3b3627');
   for(let j=0;j<4;j++){const y=base-tall+4+j*tall*.19,ww=(layer===2?16:12)+j*5;poly(g,[[x,y-13],[x-ww,y+12],[x+ww,y+12]],layer===2?'#223f30':'#416050')}
   box(g,x-1,base-tall,2,8,'#78856c');
  }
 }
 g.fillStyle='#6b5a3a';g.fillRect(0,horizon,w,h-horizon);
 g.fillStyle='#a6a078';g.fillRect(0,horizon,w,5);
 for(let i=Math.floor(scroll/23)-1;i<Math.ceil((scroll+w)/23)+1;i++){
  const x=Math.floor(i*23-scroll),v=seed(i*5);
  box(g,x,horizon+8+v*27,8+v*10,2,v>.5?'#98845c':'#453d2b');
  box(g,x+4,horizon-3,4,3,'#425b34');
 }
}
