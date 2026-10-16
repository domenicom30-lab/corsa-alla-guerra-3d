import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vehicleRamContacts} from '../vehicle-ram.js';
const H=400;
const rifle={x:101,alive:true,hp:2},nearEnemy={x:125,alive:true},behind={x:0,alive:true};
const rubble={x:111,hp:100},obstacle={x:118,alive:true};
const options={occupied:true,hp:100,velocity:160,fromX:0,toX:50,H,
 troops:[rifle,nearEnemy,behind],obstacles:[obstacle],covers:[rubble]};
assert.deepEqual(vehicleRamContacts(options).map(c=>c.kind),['troop','cover','obstacle','troop']);
assert.equal(vehicleRamContacts({...options,occupied:false}).length,0);
assert.equal(vehicleRamContacts({...options,hp:0}).length,0);
assert.equal(vehicleRamContacts({...options,velocity:20}).length,0);
assert.equal(vehicleRamContacts({...options,velocity:-160}).length,0);
assert.equal(vehicleRamContacts({...options,toX:0}).length,0);
assert.equal(vehicleRamContacts({...options,H:0}).length,0);
assert.equal(vehicleRamContacts({...options,fromX:NaN}).length,0);
assert.equal(vehicleRamContacts({...options,velocity:NaN}).length,0);
assert.equal(vehicleRamContacts({...options,toX:250}).length,4,'Swept tracks must not tunnel');
rifle.alive=false;obstacle.alive=false;rubble.hp=0;
assert.deepEqual(vehicleRamContacts(options).map(c=>c.ref),[nearEnemy],'Dead targets cannot score twice');
const leftEnemy={x:120,alive:true};
assert.equal(vehicleRamContacts({...options,velocity:-140,fromX:200,toX:165,troops:[leftEnemy],covers:[],obstacles:[]}).length,1,'Reverse ramming');
assert.equal(vehicleRamContacts({...options,velocity:160,fromX:200,toX:235,troops:[leftEnemy],covers:[],obstacles:[]}).length,0,'No rear ramming');
const main=readFileSync('main.js','utf8'),html=readFileSync('index.html','utf8'),css=readFileSync('style.css','utf8');
for(const token of ["import {vehicleRamContacts} from './vehicle-ram.js'",'const contacts=vehicleRamContacts(', "hit.kind==='troop'", "hit.kind==='obstacle'", "hit.ref.hp=0", "hit.ref.alive=false", "armorHud.hidden=!ride.occupied", "armorFill.style.width=armor+'%'"]){
 assert.ok(main.includes(token),'Missing runtime integration: '+token);
}
for(const id of ['vehicle-armor','vehicle-armor-fill','vehicle-armor-label'])assert.ok(html.includes('id="'+id+'"'));
assert.ok(css.includes('#vehicle-armor[hidden]{display:none!important}'));
assert.ok(css.includes('#vehicle-armor.critical'));
console.log('PASS: bidirectional armor crushing, swept targets, destroyed rubble, repeat-hit protection and hull HUD');
