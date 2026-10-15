import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const main = readFileSync('main.js', 'utf8');
const html = readFileSync('index.html', 'utf8');
const art = readFileSync('pixel-art.js','utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const checks = [
 ['Canvas e controlli',()=>{for(const id of ['game','message','stats','left','right','jump','duck','pause','points','hearts','shoot','grenade'])assert.ok(html.includes('id="'+id+'"'),id)}],
 ['Backup 3D documentato',()=>assert.ok(existsSync('docs/2-5d-assets.md'))],
 ['Motore 2D laterale senza prospettiva',()=>{for(const token of ['function ground(', 'function drawPlayer(', 'function drawObstacles('])assert.ok(main.includes(token),token);assert.ok(!main.includes('function projection('))}],
 ['Movimento platform laterale',()=>{assert.ok(main.includes('function ground('));assert.ok(main.includes('const direction=Number(movement.right)-Number(movement.left)'));assert.ok(main.includes('function jump('))}],
 ['Grafica platform 2D',()=>{for(const token of ['pixelBackdrop','sprites.soldier','sprites.tick','function drawPlayer(','function background('])assert.ok(main.includes(token),token)}],
 ['Asset pixel art indipendenti',()=>{for(const token of ['soldier:Array.from','tick:Array.from','crate:draw','sandbags:draw','tower:draw','pixelBackdrop'])assert.ok(art.includes(token),token);assert.ok(!main.includes('forest-background.webp'))}],
 ['Traguardo e punteggio',()=>{assert.ok(main.includes('distance>=200'));assert.ok(main.includes('score+=arcade.kill()'))}],
 ['Fucile e nemici rossi',()=>{for(const token of ['function shoot(','function drawTicks(','function drawBullets(','shotCooldown','bullets.push(','score+=arcade.kill()'])assert.ok(main.includes(token),token)}],
 ['Meccaniche arcade',()=>{const combat=readFileSync('arcade-mechanics.js','utf8');for(const token of ['throwGrenade','enemyShots','boss','pickups','spread','heavy','combo'])assert.ok(combat.includes(token),token);assert.ok(main.includes('arcade.step('));assert.ok(main.includes('arcade.fire('))}],
 ['Controlli granata e fine partita',()=>{assert.ok(main.includes("['grenade',grenade]"));assert.ok(main.includes('distance=scroll/50'));assert.ok(main.includes('movement.left=false;movement.right=false'))}],
 ['Boss: premio assegnato una sola volta',()=>{assert.ok(main.includes('function defeatBoss('));assert.ok(main.includes('if(bossVictoryAwarded)return'));assert.ok(main.includes('bossVictoryAwarded=false;arcade.reset()'))}],
 ['Feedback arcade visivo',()=>{for(const token of ['function drawBlastEffects(', 'blastEffects.length=0','COMBO x'])assert.ok(main.includes(token),token)}],
 ['Animazione soldato sincronizzata',()=>{for(const token of ['let runCycle=0','runCycle+=Math.abs(scroll-previousScroll)','Math.floor(runCycle)%8','footstepBob'])assert.ok(main.includes(token),token)}],
 ['Rinculo e ombra del soldato',()=>{for(const token of ['let recoil=0','recoil=1;bullets.push','recoil=Math.max(0,recoil-dt*12)','ctx.ellipse(playerX()'])assert.ok(main.includes(token),token)}],
 ['Sprite animati fotogramma per fotogramma',()=>{for(const token of ["from './soldier-frames.js'",'loadSoldierFrames();','drawSoldierFrame(ctx,pose,frame','Math.floor(runCycle)%8'])assert.ok(main.includes(token),token)}],
 ['Polvere dei passi sincronizzata',()=>{for(const token of ['const dustPuffs=[]','function drawDust()','dustPuffs.push({','dustPuffs.length=0'])assert.ok(main.includes(token),token)}],
 ['Nemici animati in otto fotogrammi',()=>{const enemy=readFileSync('enemy-frames.js','utf8');for(const token of ['prepareEnemyFrames','drawEnemyFrame','i<8'])assert.ok(enemy.includes(token),token);for(const token of ["from './enemy-frames.js'",'prepareEnemyFrames();','drawEnemyFrame(ctx,'])assert.ok(main.includes(token),token)}],
 ['Esplosione pixel a otto stadi',()=>{for(const token of ['Math.min(7,Math.floor(progress*8))','if(frame<6)','ctx.fillRect(Math.round(e.x-core*.5)'])assert.ok(main.includes(token),token)}],
 ['Distruzione pixel dei nemici',()=>{for(const token of ['const enemyDebris=[]','function shatterEnemy(','function drawEnemyDebris()','drawEnemyDebris();','enemyDebris.length=0'])assert.ok(main.includes(token),token)}],
 ['Autofire touch e stop dopo danno fatale',()=>{for(const token of ['if(!running)start();fireHeld=true','if(!running){hud();return}'])assert.ok(main.includes(token),token)}],
 ['Sospensione sicura su Android',()=>{for(const token of ["document.addEventListener('visibilitychange'",'if(!visible){last=t;requestAnimationFrame(frame);return}','const dt=Math.min(last?(t-last)/1000:0,.05)'])assert.ok(main.includes(token),token)}],
 ['Pausa automatica al cambio app',()=>{for(const token of ["if(running&&!paused){paused=true;message.textContent='IN PAUSA",'message.style.display=\'block\'}}});'])assert.ok(main.includes(token),token)}],
 ['Fuoco touch continuo e pausa su blur',()=>{assert.ok(main.includes("['pointerup','pointercancel','lostpointercapture'])fireButton"));assert.ok(main.includes("addEventListener('blur',()=>"));assert.ok(main.includes("if(running&&!paused){paused=true;message.textContent='IN PAUSA"))}],
 ['Prestazioni mobile',()=>{assert.ok(main.includes('devicePixelRatio'));assert.ok(main.includes('requestAnimationFrame(frame)'))}],
 ['Build configurata',()=>assert.ok(pkg.scripts.build)]
];
let failed=0;for(const [name,fn] of checks){try{fn();console.log('OK:',name)}catch(e){failed++;console.error('FAIL:',name,e.message)}}if(failed)process.exitCode=1;
