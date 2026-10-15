import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const main = readFileSync('main.js', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const checks = [
 ['Canvas e controlli',()=>{for(const id of ['game','message','stats','left','right','jump','duck','pause','points','hearts'])assert.ok(html.includes('id="'+id+'"'),id)}],
 ['Backup 3D documentato',()=>assert.ok(existsSync('docs/2-5d-assets.md'))],
 ['Motore 2D senza prospettiva',()=>{for(const token of ['function laneY(', 'function drawSoldier(', 'function drawObstacles('])assert.ok(main.includes(token),token);assert.ok(!main.includes('function projection('))}],
 ['Tre corsie e movimento',()=>{assert.ok(main.includes('function laneY('));assert.ok(main.includes('function move('));assert.ok(main.includes('function jump('))}],
 ['Sprite 2D con fallback',()=>{for(const token of ['forest-background.webp','soldier-back.png','crate.png','barrier.png','drawSprite('])assert.ok(main.includes(token),token)}],
 ['Traguardo e punteggio',()=>{assert.ok(main.includes('distance>=200'));assert.ok(main.includes('score+=20'))}],
 ['Prestazioni mobile',()=>{assert.ok(main.includes('devicePixelRatio'));assert.ok(main.includes('requestAnimationFrame(frame)'))}],
 ['Build configurata',()=>assert.ok(pkg.scripts.build)]
];
let failed=0;for(const [name,fn] of checks){try{fn();console.log('OK:',name)}catch(e){failed++;console.error('FAIL:',name,e.message)}}if(failed)process.exitCode=1;
