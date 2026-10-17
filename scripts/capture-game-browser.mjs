#!/usr/bin/env node
// Real in-browser visual inspection of the compiled 2D game, no new dependency.
// Runs on GitHub's Ubuntu image using installed Chrome/Chromium + CDP.
// A screenshot made here shows the exact shipped web bundle, unlike concept art.
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {join,resolve,extname} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as pause} from 'node:timers/promises';

const root=resolve('dist'),port=43179;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const server=createServer((req,res)=>{
 try{
  const uri=new URL(req.url,'http://localhost');
  let file=resolve(root,'.'+decodeURIComponent(uri.pathname));
  if(uri.pathname==='/')file=join(root,'index.html');
  assert.ok(file.startsWith(root+'/')||file===join(root,'index.html'));
  const bytes=readFileSync(file);res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found')}
});
const listen=()=>new Promise(r=>server.listen(port,'127.0.0.1',r));
function detectChrome(){
 for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
  try{return execFileSync('which',[name],{encoding:'utf8'}).trim()}catch{}
 }
 throw Error('Missing headless Chrome/Chromium on runner');
}
async function waitForChrome(){
 for(let n=0;n<80;n++){
  try{
   const r=await fetch('http://127.0.0.1:43180/json/list');
   if(r.ok){const tabs=await r.json();const page=tabs.find(t=>t.type==='page');if(page?.webSocketDebuggerUrl)return page.webSocketDebuggerUrl}
  }catch{}
  await pause(250);
 }
 throw Error('Chrome DevTools port never became available');
}
async function openCDP(url){
 const ws=new WebSocket(url),pending=new Map();let serial=0;
 await new Promise((resolve,reject)=>{
  ws.onopen=resolve;ws.onerror=()=>reject(Error('CDP WebSocket failed'));
 });
 ws.onmessage=event=>{
  const msg=JSON.parse(event.data),p=pending.get(msg.id);
  if(!p)return;pending.delete(msg.id);
  if(msg.error)p.reject(Error(msg.error.message));
  else p.resolve(msg.result);
 };
 async function cmd(method,params={}){
  const id=++serial;
  return await new Promise((resolve,reject)=>{
   pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
  });
 }
 return {cmd,close:()=>ws.close()};
}
async function evaluate(cdp,expression){
 const result=await cdp.cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails).slice(0,400));
 return result.result?.value;
}
async function waitMode(cdp,goal){
 for(let i=0;i<55;i++){
  const value=await evaluate(cdp,`document.querySelector('.arcade-menu')?.dataset.mode || ''`);
  if(value===goal)return;
  if(value==='error')throw Error('Game entered asset-loading ERROR menu');
  await pause(200);
 }
 throw Error('Game never reached menu state '+goal);
}
function auditLayout(layout){
 assert.equal(layout.aimCount,1,'One and only one hold-to-aim touch button');
 assert.ok(layout.aim.y>layout.height*.70,'Aim button still obscures center of game');
 assert.ok(layout.topbar.height<layout.height*.11,'HUD occupies over eleven percent of visible scene');
 assert.equal(layout.touch.length,8,'Expected all 8 mobile movement/combat buttons');
 assert.equal(layout.vehiclePromptVisible,false,'Disabled approach-to-tank button still covers the battlefield');
 for(const b of layout.touch){
  assert.ok(b.width>=44&&b.height>=44,'Touch target is too small: '+b.id);
  assert.ok(b.left>=0&&b.right<=layout.width,'Touch button clips outside screen: '+b.id);
  assert.ok(b.top>=layout.height*.75&&b.bottom<=layout.height,'Controls float over actors: '+b.id);
 }
 for(let i=0;i<layout.touch.length;i++)for(let j=i+1;j<layout.touch.length;j++){
  const a=layout.touch[i],b=layout.touch[j];
  const overlap=Math.min(a.right,b.right)-Math.max(a.left,b.left)>4&&
   Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>4;
  assert.ok(!overlap,'Mobile thumb buttons overlap: '+a.id+' + '+b.id);
 }
}
const output=resolve('artifacts/gameplay-browser-qa.png');mkdirSync('artifacts',{recursive:true});
let chrome=null,cdp=null,profile=null;
try{
 await listen();
 profile=mkdtempSync(join(tmpdir(),'cag-chrome-'));
 chrome=spawn(detectChrome(),[
  '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
  '--no-first-run','--no-default-browser-check','--window-size=1536,968',
  '--remote-debugging-port=43180','--remote-allow-origins=*','--user-data-dir='+profile,
  'about:blank'
 ],{stdio:'ignore'});
 cdp=await openCDP(await waitForChrome());
 await cdp.cmd('Page.enable');await cdp.cmd('Runtime.enable');
 await cdp.cmd('Emulation.setDeviceMetricsOverride',{width:1536,height:968,deviceScaleFactor:1,mobile:true});
 await cdp.cmd('Page.navigate',{url:'http://127.0.0.1:'+port+'/'});
 await waitMode(cdp,'ready');
 await evaluate(cdp,`document.querySelector('.arcade-action-primary').click(); true`);
 await waitMode(cdp,'playing');
 // Capture the actual playable scene after the short mission title fades.
 await pause(3200);
 const layout=await evaluate(cdp,`(()=>{
 const ids=['left','right','slide','aim-up','jump','shoot','grenade','duck'];
 const rect=id=>{let r=document.getElementById(id).getBoundingClientRect();
  return {id,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,y:r.y}};
 return {width:innerWidth,height:innerHeight,aimCount:document.querySelectorAll('#aim-up').length,
  aim:rect('aim-up'),topbar:document.querySelector('.topbar').getBoundingClientRect().toJSON(),
  touch:ids.map(rect),vehiclePromptVisible:!document.getElementById('vehicle-toggle').hidden,
  state:document.querySelector('.arcade-menu')?.dataset.mode};
})()`);
 auditLayout(layout);
 const image=await cdp.cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 const bytes=Buffer.from(image.data,'base64');writeFileSync(output,bytes);
 assert.ok(bytes.length>70000,'Screenshot is empty or rendered as a single flat panel');
 console.log('PASS: Chrome visual QA gameplay screenshot',output,'bytes',bytes.length,
  '8 non-overlapping touch targets, one aim button, compact HUD');
 // Real keyboard input drives the live player toward the first enemies.
 // A second original screenshot captures an actual impact rather than a static menu.
 const beforeStats=await evaluate(cdp,"document.getElementById('stats').textContent");
 const beforeRemaining=Number(beforeStats.match(/(\d+)m/)?.[1]);
 assert.ok(Number.isFinite(beforeRemaining),'Mission distance counter is missing');
 await cdp.cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 await pause(1200);
 await cdp.cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 const afterStats=await evaluate(cdp,"document.getElementById('stats').textContent");
 const afterRemaining=Number(afterStats.match(/(\d+)m/)?.[1]);
 assert.ok(Number.isFinite(afterRemaining)&&afterRemaining<beforeRemaining,
  'Real Chromium movement did not advance the level');
 await cdp.cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'f',code:'KeyF',windowsVirtualKeyCode:70});
 await cdp.cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'f',code:'KeyF',windowsVirtualKeyCode:70});
 await pause(260);
 const combatImage=await cdp.cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 const combatBytes=Buffer.from(combatImage.data,'base64');
 const combatOutput=resolve('artifacts/gameplay-combat-qa.png');
 writeFileSync(combatOutput,combatBytes);
 assert.ok(combatBytes.length>70000,'Real combat screenshot is empty');
 assert.equal(await evaluate(cdp,"document.querySelector('.arcade-menu')?.dataset.mode"),'playing',
  'Gameplay must remain active during movement and shooting');
 console.log('PASS: Chromium combat screenshot',combatOutput,
  'bytes',combatBytes.length,'travelled',beforeRemaining-afterRemaining,'m');

}finally{
 if(cdp)cdp.close();
 if(chrome){
  if(chrome.exitCode===null && chrome.signalCode===null){
   const exited=new Promise(resolve=>chrome.once('exit',resolve));
   chrome.kill('SIGTERM');
   await Promise.race([exited,pause(2000)]);
   if(chrome.exitCode===null && chrome.signalCode===null){
    chrome.kill('SIGKILL');
    await Promise.race([exited,pause(2000)]);
   }
  }
 }
 await new Promise(r=>server.close(r));
 if(profile){
  // Chrome extensions can finish writing shortly after the browser exits.
  for(let attempt=0;attempt<6;attempt++){
   try{rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});break}
   catch(error){
    if(!['ENOTEMPTY','EBUSY','EPERM'].includes(error.code))throw error;
    if(attempt===5){console.warn('WARN: Chrome temp profile cleanup:',error.message);break}
    await pause(300*(attempt+1));
   }
  }
 }
}
