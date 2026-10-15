import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import {createArcadeSystems} from '../arcade-mechanics.js';
import {prepareEnemyFrames,drawEnemyFrame} from '../enemy-frames.js';
const main = readFileSync('main.js', 'utf8');
const html = readFileSync('index.html', 'utf8');
const art = readFileSync('pixel-art.js','utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const checks = [
 ['Schermata vittoria visibile almeno sei secondi',()=>{assert.ok(main.includes('const VICTORY_RESTART_DELAY_MS=6000'));assert.ok(main.includes('victoryRestartAt=performance.now()+VICTORY_RESTART_DELAY_MS'));assert.ok(main.includes('if(victoryRestartAt&&performance.now()<victoryRestartAt)return'))}], 
 ['Boss: effetto camera modificabile senza errore',()=>{const systems=createArcadeSystems();systems.screenShake=Math.max(systems.screenShake,18);assert.equal(systems.screenShake,18);systems.reset();assert.equal(systems.screenShake,0)}],
 ['Cache frame soldato',()=>{const source=readFileSync('soldier-frames.js','utf8');assert.ok(source.includes('if(soldierFrames[pose]?.length===count)continue'),'evita di ricreare i frame già caricati')}],
 ['Canvas e controlli',()=>{for(const id of ['game','message','stats','left','right','jump','duck','pause','points','hearts','shoot','grenade'])assert.ok(html.includes('id="'+id+'"'),id)}],
 ['Backup 3D documentato',()=>assert.ok(existsSync('docs/2-5d-assets.md'))],
 ['Motore 2D laterale senza prospettiva',()=>{for(const token of ['function ground(', 'function drawPlayer(', 'function drawTicks('])assert.ok(main.includes(token),token);assert.ok(!main.includes('function projection('))}],
 ['Movimento platform laterale',()=>{assert.ok(main.includes('function ground('));assert.ok(main.includes('const direction=Number(movement.right)-Number(movement.left)'));assert.ok(main.includes('function jump('))}],
 ['Grafica platform 2D',()=>{for(const token of ['pixelBackdrop','sprites.soldier','sprites.tick','function drawPlayer(','function background('])assert.ok(main.includes(token),token)}],
 ['Asset pixel art indipendenti',()=>{for(const token of ['soldier:Array.from','tick:Array.from','crate:draw','sandbags:draw','tower:draw','pixelBackdrop'])assert.ok(art.includes(token),token);assert.ok(!main.includes('forest-background.webp'))}],
 ['Traguardo e punteggio',()=>{assert.ok(main.includes('distance>=200'));assert.ok(main.includes('score+=arcade.kill()'))}],
 ['Fucile e nemici rossi',()=>{for(const token of ['function shoot(','function drawTicks(','function drawBullets(','shotCooldown','bullets.push(','score+=arcade.kill()'])assert.ok(main.includes(token),token)}],
 ['Meccaniche arcade',()=>{const combat=readFileSync('arcade-mechanics.js','utf8');for(const token of ['throwGrenade','enemyShots','boss','pickups','spread','heavy','combo'])assert.ok(combat.includes(token),token);assert.ok(main.includes('arcade.step('));assert.ok(main.includes('arcade.fire('))}],
 ['Controlli granata e fine partita',()=>{assert.ok(main.includes("['grenade',grenade]"));assert.ok(main.includes('distance=scroll/50'));assert.ok(main.includes('movement.left=false;movement.right=false'))}],
 ['Boss: premio assegnato una sola volta',()=>{assert.ok(main.includes('function defeatBoss('));assert.ok(main.includes('if(bossVictoryAwarded)return'));assert.ok(main.includes('bossVictoryAwarded=false;bossDeathTime=-1;bossDeathX=0;arcade.reset()'))}],
 ['Feedback arcade visivo',()=>{for(const token of ['function drawBlastEffects(', 'blastEffects.length=0','COMBO x'])assert.ok(main.includes(token),token)}],
 ['Animazione soldato sincronizzata',()=>{for(const token of ['let runCycle=0','runCycle+=Math.abs(scroll-previousScroll)','Math.floor(runCycle)%8','footstepBob'])assert.ok(main.includes(token),token)}],
 ['Rinculo e ombra del soldato',()=>{for(const token of ['let recoil=0','recoil=1;bullets.push','recoil=Math.max(0,recoil-dt*12)','ctx.ellipse(playerX()'])assert.ok(main.includes(token),token)}],
 ['Sprite animati fotogramma per fotogramma',()=>{for(const token of ["from './soldier-frames.js'",'loadSoldierFrames();','drawSoldierFrame(ctx,pose,frame','Math.floor(runCycle)%8'])assert.ok(main.includes(token),token)}],
 ['Polvere dei passi sincronizzata',()=>{for(const token of ['const dustPuffs=[]','function drawDust()','dustPuffs.push({','dustPuffs.length=0'])assert.ok(main.includes(token),token)}],
 ['Nemici animati in otto fotogrammi',()=>{const enemy=readFileSync('enemy-frames.js','utf8');for(const token of ['prepareEnemyFrames','drawEnemyFrame','i<8'])assert.ok(enemy.includes(token),token);for(const token of ["from './enemy-frames.js'",'prepareEnemyFrames();','drawEnemyFrame(ctx,'])assert.ok(main.includes(token),token)}],
 ['Otto frame nemici differenti e disegnabili',()=>{
   const originalDocument=globalThis.document,created=[];
   globalThis.document={createElement(tag){assert.equal(tag,'canvas');const operations=[];const g={fillStyle:'',fillRect(...args){operations.push([this.fillStyle,...args])}};const canvas={getContext(){return g}};created.push({canvas,operations});return canvas}};
   try{
    prepareEnemyFrames();
    assert.equal(created.length,8,'devono essere generati otto sprite');
    assert.ok(new Set(created.map(x=>JSON.stringify(x.operations))).size>=6,'le pose devono variare');
    const drawn=[];const ctx={imageSmoothingEnabled:true,drawImage(sprite){drawn.push(sprite)}};
    for(let i=0;i<8;i++)assert.equal(drawEnemyFrame(ctx,i,0,0,64,48),true);
    assert.equal(new Set(drawn).size,8,'ogni indice deve disegnare un frame diverso');
   }finally{if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument}
 }],
 ['Dettagli nemici in movimento',()=>{const enemy=readFileSync('enemy-frames.js','utf8');for(const token of ['Eight distinct gait poses','Independently animated foreleg tips','const gait=[0,2,4,2,0,-2,-4,-2][i]'])assert.ok(enemy.includes(token),token)}],
 ['Esplosione pixel a otto stadi',()=>{for(const token of ['Math.min(7,Math.floor(progress*8))','if(frame<6)','ctx.fillRect(Math.round(e.x-core*.5)'])assert.ok(main.includes(token),token)}],
 ['Distruzione pixel dei nemici',()=>{for(const token of ['const enemyDebris=[]','function shatterEnemy(','function drawEnemyDebris()','drawEnemyDebris();','enemyDebris.length=0'])assert.ok(main.includes(token),token)}],
 ['Autofire touch e stop dopo danno fatale',()=>{for(const token of ['if(!running)start();fireHeld=true','if(!running){hud();return}'])assert.ok(main.includes(token),token)}],
 ['Sospensione sicura su Android',()=>{for(const token of ["document.addEventListener('visibilitychange'",'if(!visible){last=t;requestAnimationFrame(frame);return}','const dt=Math.min(last?(t-last)/1000:0,.05)'])assert.ok(main.includes(token),token)}],
 ['Pausa automatica al cambio app',()=>{for(const token of ["if(running&&!paused){paused=true;message.textContent='IN PAUSA",'message.style.display=\'block\'}}});'])assert.ok(main.includes(token),token)}],
 ['Fuoco touch continuo e pausa su blur',()=>{assert.ok(main.includes("['pointerup','pointercancel','lostpointercapture'])fireButton"));assert.ok(main.includes("addEventListener('blur',()=>"));assert.ok(main.includes("if(running&&!paused){paused=true;message.textContent='IN PAUSA"))}],
 ['Movimento multitouch indipendente',()=>{for(const token of ['const pointers=activeMovementPointers[id]','pointers.add(e.pointerId)','pointers.delete(e.pointerId)','movement[id]=pointers.size>0'])assert.ok(main.includes(token),token)}],
 ['Culling pickup su schermi ad alta densità',()=>{let draws=0;const ctx={canvas:{width:400,clientWidth:100},save(){},restore(){},translate(){},fillRect(){draws++},strokeRect(){},fillText(){}};const systems=createArcadeSystems();systems.draw(ctx,1100,100,100,0);assert.equal(draws,0,'pickup fuori dalla viewport CSS');systems.draw(ctx,1330,100,100,0);assert.ok(draws>0,'pickup visibile') }],
 ['Limite proiettili per prestazioni Android',()=>assert.ok(main.includes('if(bullets.length>120)bullets.splice(0,bullets.length-120)'))],
 ['Budget pixel canvas Android',()=>{for(const token of ['const pixelBudget=2400000','Math.sqrt(pixelBudget/Math.max(1,W*H))','Math.max(1,Math.round(W*dpr))'])assert.ok(main.includes(token),token)}],
 ['Pulizia tocchi su pausa e riavvio',()=>{for(const token of ['function clearTouchMovement()','activeMovementPointers.left.clear()','activeMovementPointers.right.clear()','if(!visible){fireHeld=false;clearTouchMovement()','clearTouchMovement();movement.left=false;movement.right=false;last=0;message.style.display','addEventListener(\'blur\',()=>{clearTouchMovement()'])assert.ok(main.includes(token),token)}],
 ['Limite refresh rendering Android',()=>assert.ok(main.includes('if(last&&t-last<1000/65){requestAnimationFrame(frame);return}'))],
 ['Fiammata pixel art stratificata',()=>{for(const token of ["ctx.fillStyle='#fff6c8'","ctx.fillStyle='#ffc34e'","ctx.fillStyle='#f08b27'",'for(let i=0;i<3;i++){const sparkX=mx+flash'])assert.ok(main.includes(token),token)}],
 ['Scie luminose proiettili',()=>{for(const token of ["b.kind==='heavy'?'#245e7b':'#8c4b2c'","b.kind==='heavy'?'#e7ffff':'#fff8d1'",'tail=b.x-dir*len*.9'])assert.ok(main.includes(token),token)}],
 ['Dissolvenza particelle impatto',()=>{for(const token of ['H*.007*Math.min(1,p.life/.2)','ctx.globalAlpha=Math.min(1,Math.max(0,p.life/.18))','ctx.globalAlpha=1}'])assert.ok(main.includes(token),token)}],
 ['Polvere passi pixel art stratificata',()=>{for(const token of ["ctx.fillStyle='#d7c6a2'",'Math.round(p.y-p.size*.25)','Math.max(2,p.size*.45)'])assert.ok(main.includes(token),token)}],
 ['Frammenti nemici rotanti',()=>{for(const token of ['ctx.rotate((p.x+p.y)*.012)',"ctx.fillStyle='#e9ad70'",'ctx.fillRect(-p.size*.5,-p.size*.5,p.size,p.size*.7)'])assert.ok(main.includes(token),token)}],
 ['Ombre contatto nemici',()=>{for(const token of ["ctx.globalAlpha=.25;ctx.fillStyle='#201910'",'ctx.ellipse(x,ground()+H*.006,w*.48,H*.009','drawEnemyFrame(ctx,Math.floor(phase*1.4+t.phase)%8'])assert.ok(main.includes(token),token)}],
 ['Pausa rilascia comandi attivi',()=>{for(const token of ['paused=!paused;last=0','if(paused){fireHeld=false;clearTouchMovement();movement.left=false;movement.right=false}'])assert.ok(main.includes(token),token)}],
 ['Comandi reali puliti senza variabile keys inesistente',()=>{assert.ok(!main.includes('keys.left=false'));assert.ok(main.includes('if(!visible){fireHeld=false;clearTouchMovement();movement.left=false;movement.right=false;'));assert.ok(main.includes("addEventListener('blur',()=>{clearTouchMovement();movement.left=false;movement.right=false;fireHeld=false;"))}],
 ['Boss animato e rendering limitato alla viewport',()=>{const combat=readFileSync('arcade-mechanics.js','utf8');for(const t of ['const treadFrame=Math.floor(phase*.55)%4','if(x<-H*.55||x>viewportWidth+H*.55)return','treadFrame%2'])assert.ok(combat.includes(t),t)}],
 ['Nuova partita azzera movimento e tempo',()=>{assert.ok(main.includes("clearTouchMovement();movement.left=false;movement.right=false;last=0;message.style.display='none';hud()"))}],
 ['Salute boss visibile durante lo scontro',()=>{for(const token of ["arcade.boss.active&&!arcade.boss.defeated?' · BOSS '",'Math.ceil(arcade.boss.hp/arcade.boss.maxHp*100)'])assert.ok(main.includes(token),token)}],
 ['Barra vita boss in pixel art',()=>{for(const token of ['function drawBossHealthBar()','if(!arcade.boss.active||arcade.boss.defeated)return','ctx.fillRect(x,y,width*ratio,height)','ctx.restore();drawBossHealthBar();requestAnimationFrame(frame)'])assert.ok(main.includes(token),token)}],
 ['Distruzione scenografica boss',()=>{for(const token of ['for(let i=0;i<5;i++){burst(bossScreenX','for(let i=0;i<4;i++){shatterEnemy(bossScreenX','arcade.screenShake=Math.max(arcade.screenShake,18)'])assert.ok(main.includes(token),token)}],
 ['Vittoria azzera controlli touch e fuoco',()=>{for(const token of ['if(distance>=200&&arcade.boss.defeated){victoryRestartAt=performance.now()+VICTORY_RESTART_DELAY_MS;running=false;fireHeld=false;clearTouchMovement()','shotCooldown=0;last=0;message.textContent=\'HAI SCONFITTO LE ZECCHE ROSSE!'])assert.ok(main.includes(token),token)}],
 ['Messaggio finale zecche rosse',()=>assert.ok(main.includes("message.textContent='HAI SCONFITTO LE ZECCHE ROSSE!\\nTOCCA PER RIPROVARE'"))],
 ['Credito finale discreto',()=>{for(const token of ['victory-credit','Grazie per aver giocato — firmato il pittore austriaco'])assert.ok(html.includes(token),token);assert.ok(main.includes("document.getElementById('victory-credit').style.display='block'"));assert.ok(main.includes("function start(){if(victoryRestartAt&&performance.now()<victoryRestartAt)return;victoryRestartAt=0;document.getElementById('victory-credit').style.display='none'"))}],
 ['Schermata vittoria leggibile',()=>{for(const token of ["message.classList.add('victory-message')","message.classList.remove('victory-message')"])assert.ok(main.includes(token),token)}],
 ['Dettagli sprite soldato',()=>{const soldier=readFileSync('soldier-frames.js','utf8');for(const token of ['Hand-pixelled material detail','High-contrast pixel clusters','torsoY-14','frontKnee-3'])assert.ok(soldier.includes(token),token)}],
 ['Sprite soldato con ombreggiatura stratificata',()=>{const soldier=readFileSync('soldier-frames.js','utf8');for(const token of ['const armor=(x,y,w,h,base,light,shade)=>','Layered high-resolution pixel rendering','Combat vest, belts, buckles and pouches','Rifle receiver, magazine, muzzle'])assert.ok(soldier.includes(token),token)}],
 ['Silhouette originali non rettangolari',()=>{const soldier=readFileSync('soldier-frames.js','utf8');for(const token of ['const poly=(points,color)=>','Organic stepped combat jacket','Curved, chipped steel helmet silhouette'])assert.ok(soldier.includes(token),token)}],
 ['Percorso senza ostacoli da saltare',()=>{for(const token of ['const obstacles=','function drawObstacles(','drawObstacles();','for(const o of obstacles)'])assert.ok(!main.includes(token),token);assert.ok(main.includes('function drawTicks('))}],
 ['Prestazioni mobile',()=>{assert.ok(main.includes('devicePixelRatio'));assert.ok(main.includes('requestAnimationFrame(frame)'))}],
 ['Build configurata',()=>assert.ok(pkg.scripts.build)]
];
let failed=0;for(const [name,fn] of checks){try{fn();console.log('OK:',name)}catch(e){failed++;console.error('FAIL:',name,e.message)}}if(failed)process.exitCode=1;
