import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGameInterface} from '../game-interface.js';
const made=[];
class MockNode{
 constructor(tag){this.tag=tag;this.hidden=false;this.disabled=false;this.dataset={};this.attributes={};this.events=new Map();this.children=[];this.textContent='';this.className='';this.style={};}
 setAttribute(k,v){this.attributes[k]=v}
 append(...nodes){this.children.push(...nodes)}
 appendChild(n){this.children.push(n)}
 addEventListener(k,fn){this.events.set(k,fn)}
 click(){if(this.disabled)return;this.events.get('click')?.()}
}
const previous=globalThis.document;
globalThis.document={body:new MockNode('body'),createElement(tag){const n=new MockNode(tag);made.push(n);return n}};
try{
 let playCalls=0,restarts=0,audio=false,quality='auto';
 const u=createGameInterface({initialMuted:true,initialQuality:'high',
  onPlay(){playCalls++},onRestart(){restarts++},onAudio(value){audio=value},
  onQuality(value){quality=value}});
 assert.equal(u.mode,'loading');assert.equal(u.root.hidden,false);
 assert.equal(u.play.disabled,true);
 assert.equal(u.root.attributes.role,'dialog');
 assert.equal(u.audio.textContent,'AUDIO: OFF');
 assert.equal(u.quality.textContent,'GRAFICA: ALTA');
 u.start();assert.equal(u.mode,'ready');assert.equal(u.play.disabled,false);
 u.play.click();assert.equal(playCalls,1);
 u.playMode();assert.equal(u.root.hidden,true);
 u.pause();assert.equal(u.root.hidden,false);
 assert.equal(u.play.textContent,'RIPRENDI');
 u.play.click();assert.equal(playCalls,2);
 assert.equal(u.restart.hidden,false);
 u.restart.click();assert.equal(restarts,1);
 u.audio.click();assert.equal(audio,false);assert.equal(u.audio.textContent,'AUDIO: ON');
 u.quality.click();assert.equal(quality,'battery');
 u.quality.click();assert.equal(quality,'auto');
 u.quality.click();assert.equal(quality,'high');
 u.victory({score:5300,record:6500,rescued:3,seconds:125.8});
 assert.equal(u.mode,'victory');
 assert.equal(u.play.disabled,true);
 assert.equal(u.restart.disabled,true);
 assert.ok(u.root.querySelector===undefined);
 const stats=made.find(x=>x.className==='arcade-menu-stats');
 assert.ok(stats.textContent.includes('5.300'));
 assert.ok(stats.textContent.includes('RECORD 6.500'));
 assert.ok(stats.textContent.includes('OSTAGGI 3'));
 assert.ok(stats.textContent.includes('2:05'));
 u.play.click();u.restart.click();assert.equal(restarts,1,'Restart is gated for victory cinematic');
 u.allowReplay();assert.equal(u.play.disabled,false);assert.equal(u.restart.disabled,false);
 u.play.click();assert.equal(restarts,2);
 u.error('Risorsa mancante');assert.equal(u.mode,'error');
 assert.ok(stats.textContent.includes('Risorsa mancante'));
 assert.equal(u.play.textContent,'RIPROVA');
 assert.throws(()=>u.setMode('broken'),/invalid/);
}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous}
const main=readFileSync('main.js','utf8'),style=readFileSync('style.css','utf8'),html=readFileSync('index.html','utf8');
for(const part of ["import {createGameInterface}",'const gameMenu=createGameInterface({',
  'gameMenu.start();','gameMenu.playMode();','gameMenu.pause();',
  'gameMenu.victory({score,record:arcadeHighScore,rescued:',
  "audioMuted||!audioEngine","graphicsQuality==='battery'?900000",
  "missionSeconds+=dt","gameMenu.allowReplay();"]){
 assert.ok(main.includes(part),'Release integration missing: '+part);
}
assert.ok(style.includes(".arcade-menu[hidden]"),'Complete menu style');
assert.ok(html.includes('MISSIONE COMPIUTA · GRAZIE PER AVER GIOCATO'));
assert.ok(!html.includes('pittore austriaco'),'Remove unprofessional placeholder credits');
console.log('PASS: complete start/pause/restart/victory/error menus, audio, quality, stored settings and replay gating');
