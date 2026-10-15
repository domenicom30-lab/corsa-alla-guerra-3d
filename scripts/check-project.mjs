import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const main = readFileSync('main.js', 'utf8');
const html = readFileSync('index.html', 'utf8');
const art = readFileSync('pixel-art.js','utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const checks = [
 ['Canvas e controlli',()=>{for(const id of ['game','message','stats','left','right','jump','duck','pause','points','hearts','shoot'])assert.ok(html.includes('id="'+id+'"'),id)}],
 ['Backup 3D documentato',()=>assert.ok(existsSync('docs/2-5d-assets.md'))],
 ['Motore 2D laterale senza prospettiva',()=>{for(const token of ['function ground(', 'function drawPlayer(', 'function drawObstacles('])assert.ok(main.includes(token),token);assert.ok(!main.includes('function projection('))}],
 ['Movimento platform laterale',()=>{assert.ok(main.includes('function ground('));assert.ok(main.includes('function move('));assert.ok(main.includes('function jump('))}],
 ['Grafica platform 2D',()=>{for(const token of ['pixelBackdrop','sprites.soldier','sprites.tick','function drawPlayer(','function background('])assert.ok(main.includes(token),token)}],
 ['Asset pixel art indipendenti',()=>{for(const token of ['soldier:Array.from','tick:Array.from','crate:draw','sandbags:draw','tower:draw','pixelBackdrop'])assert.ok(art.includes(token),token);assert.ok(!main.includes('forest-background.webp'))}],
 ['Traguardo e punteggio',()=>{assert.ok(main.includes('distance>=200'));assert.ok(main.includes('score+=100'))}],
 ['Fucile e nemici rossi',()=>{for(const token of ['function shoot(','function drawTicks(','function drawBullets(','shotCooldown','bullets.push(','score+=100'])assert.ok(main.includes(token),token)}],
 ['Prestazioni mobile',()=>{assert.ok(main.includes('devicePixelRatio'));assert.ok(main.includes('requestAnimationFrame(frame)'))}],
 ['Build configurata',()=>assert.ok(pkg.scripts.build)]
];
let failed=0;for(const [name,fn] of checks){try{fn();console.log('OK:',name)}catch(e){failed++;console.error('FAIL:',name,e.message)}}if(failed)process.exitCode=1;
