import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const main = readFileSync('main.js', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const checks = [
  ['Canvas e controlli', () => {
    for (const id of ['game', 'message', 'stats', 'left', 'right', 'jump']) {
      assert.ok(html.includes('id="' + id + '"') || html.includes("id='" + id + "'"), 'Elemento mancante: ' + id);
    }
  }],
  ['Modello soldato presente', () => assert.ok(existsSync('public/models/ww2_panzergrenadier_2k_cc0-optimized.glb'), 'ww2_panzergrenadier_2k_cc0-optimized.glb mancante')],
  ['Caricamento GLB', () => assert.ok(main.includes('./models/ww2_panzergrenadier_2k_cc0-optimized.glb'))],
  ['Animazioni e movimento', () => {
    for (const token of ['GLTFLoader', 'soldierMixer', 'function jump()', 'function move(']) assert.ok(main.includes(token), token);
  }],
  ['Traguardo giocabile', () => {
    assert.ok(main.includes('finishGate'));
    assert.ok(main.includes('TRAGUARDO'));
    assert.ok(main.includes('distance >= 500'));
  }],
  ['Prestazioni mobile', () => {
    assert.ok(main.includes('setPixelRatio'));
    assert.ok(main.includes('InstancedMesh'));
    const shadow = main.match(/sun\.shadow\.mapSize\.set\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    assert.ok(shadow, 'Risoluzione shadow map mancante');
    const width = Number(shadow[1]), height = Number(shadow[2]);
    assert.ok(width >= 512 && width <= 2048 && height >= 512 && height <= 2048,
      'Shadow map fuori dal budget mobile (512–2048)');
  }],
  ['Build configurata', () => assert.ok(pkg.scripts.build)]
];
let failed = 0;
for (const [name, fn] of checks) {
  try { fn(); console.log('OK:', name); }
  catch (error) { failed++; console.error('FAIL:', name, error.message); }
}
if (failed) process.exitCode = 1;
