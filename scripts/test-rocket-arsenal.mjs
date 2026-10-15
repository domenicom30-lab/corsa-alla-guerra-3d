import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createArcadeSystems} from '../arcade-mechanics.js';
import {segmentOverlapsX,segmentHitsRect,rocketSplashDamage,drawRocketProjectile,drawRocketPickup} from '../arcade-arsenal.js';

const game=createArcadeSystems();
assert.equal(game.pickups.length,12,'Regular weapon drops cover the 200m run');
assert.ok(game.pickups.every(p=>p.x<=10000));
for(const kind of ['spread','heavy','rocket','health'])assert.ok(game.pickups.some(p=>p.type===kind),kind);
const rocket=game.pickups.find(p=>p.type==='rocket');
assert.equal(game.collect(rocket.x,0,400,500),'rocket');
assert.equal(game.weapon,'rocket');
assert.equal(game.ammo,35);
const shot=game.fire(100,200,1,600);
assert.equal(shot.length,1);assert.equal(shot[0].kind,'rocket');
assert.equal(shot[0].damage,5);
assert.ok(shot[0].vx<600&&shot[0].vx>400);
assert.equal(game.ammo,34);
for(let i=0;i<34;i++)game.fire(100,200,1,600);
assert.equal(game.weapon,'normal','Rocket ammunition eventually expires');
assert.equal(game.fire(100,200,1,600)[0].kind,'normal');
game.reset();
assert.equal(game.weapon,'normal');
assert.equal(game.ammo,Infinity);
assert.equal(rocket.taken,false);

assert.equal(segmentOverlapsX(0,100,50,2),true);
assert.equal(segmentOverlapsX(100,0,50,2),true);
assert.equal(segmentOverlapsX(0,40,50,2),false);
assert.equal(segmentOverlapsX(5,5,5,0),true);
assert.equal(segmentOverlapsX(0,100,NaN,2),false);
assert.equal(segmentHitsRect(0,10,100,10,50,10,2,5),true,'High speed shot must hit thin enemy');
assert.equal(segmentHitsRect(100,10,0,10,50,10,2,5),true);
assert.equal(segmentHitsRect(0,0,100,100,50,50,2,5),true);
assert.equal(segmentHitsRect(0,0,100,0,50,30,2,5),false,'Parallel misses should not hit');
assert.equal(segmentHitsRect(50,10,50,10,50,10,0,0),true);
assert.equal(segmentHitsRect(0,0,100,100,50,50,-1,5),false);
assert.equal(rocketSplashDamage(0,100),5);
assert.equal(rocketSplashDamage(100,100),1);
assert.equal(rocketSplashDamage(101,100),0);
assert.equal(rocketSplashDamage(50,100,6),3);

let paints=0;
const noop=()=>{};
const g=new Proxy({save:noop,restore:noop,translate:noop,scale:noop,fillRect(){paints++}},{
 get(t,k){return k in t?t[k]:noop},set(t,k,v){t[k]=v;return true}
});
drawRocketProjectile(g,{x:100,y:120,vx:300},400,6);
drawRocketProjectile(g,{x:100,y:120,vx:-300},400,6);
drawRocketPickup(g,100,120,28);
assert.ok(paints>25,'Missile and pickup use multiple separately shaded shapes');
const main=readFileSync('main.js','utf8');
assert.ok(main.includes("if(b.kind==='rocket'){drawRocketProjectile"));
assert.ok(main.includes("segmentHitsRect(oldX,oldY,b.x,b.y"));
assert.ok(main.includes("explosion(impactX,b.y,H*.36)"));
assert.ok(main.includes("if(rocket&&b.life>0&&!hit)"));
assert.ok(main.includes("for(const c of arcade.covers)if(c.hp>0"));
console.log('PASS: unique 2D missile weapon, swept projectile hitboxes, bounded exhaust and explosive scenery');
