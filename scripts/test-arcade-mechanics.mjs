import assert from 'node:assert/strict';
import { createArcadeSystems } from '../arcade-mechanics.js';

const H = 800;
const ground = 640;
const systems = createArcadeSystems();
let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log('PASS', name); };

check('granate: otto utilizzi, nessuna munizione negativa', () => {
  for (let i = 0; i < 8; i++) assert.equal(systems.throwGrenade(120, 200, 1, H), true);
  assert.equal(systems.throwGrenade(120, 200, 1, H), false);
  assert.equal(systems.grenadeCount, 0);
  systems.reset();
  assert.equal(systems.grenadeCount, 8);
});

check('armi: proiettili, spread, munizioni e danni', () => {
  const normal = systems.fire(100, 200, 1, 500);
  assert.equal(normal.length, 1);
  assert.equal(normal[0].damage, 1);
  const pickup = systems.pickups.find(p => p.type === 'spread');
  assert.equal(systems.collect(pickup.x, 0, ground, H), 'spread');
  assert.equal(systems.fire(100, 200, 1, 500).length, 3);
  assert.equal(systems.ammo, 99);
  const heavy = systems.pickups.find(p => p.type === 'heavy');
  assert.equal(systems.collect(heavy.x, 0, ground, H), 'heavy');
  assert.equal(systems.fire(100, 200, 1, 500)[0].damage, 2);
});

check('ostaggi: premio solo al primo salvataggio', () => {
  const x = systems.prisoners[0].x;
  assert.equal(systems.rescue(x, 0, H), 1);
  assert.equal(systems.rescue(x, 0, H), 0);
});

check('boss carro: inseguimento lento, mira, sparo, rinculo', () => {
  systems.reset();
  const boss = systems.boss;
  const initial = boss.x;
  const playerWorld = initial - H * 1.1;
  const scroll = playerWorld - 200;
  for (let i = 0; i < 200; i++) systems.step(0.016, scroll, 200, ground, H, () => {}, () => {});
  assert.equal(boss.active, true);
  assert.ok(boss.x < initial, 'il carro deve avvicinarsi al giocatore');
  assert.ok(Number.isFinite(boss.turretAngle), 'la torretta deve mirare');
  assert.ok(systems.enemyShots.length > 0, 'il cannone deve sparare');
  assert.ok(Math.abs(boss.velocity) <= H * 0.5, 'il carro deve muoversi lentamente');
});

check('reset: stato del boss, granate, ostaggi e armi', () => {
  systems.boss.hp = 1;
  systems.boss.defeated = true;
  systems.reset();
  assert.equal(systems.boss.hp, systems.boss.maxHp);
  assert.equal(systems.boss.defeated, false);
  assert.equal(systems.weapon, 'normal');
  assert.equal(systems.prisoners[0].rescued, false);
  assert.equal(systems.grenadeCount, 8);
});
console.log('Gameplay mechanics verified:', checks);
