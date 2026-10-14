import * as THREE from 'three';

// Lightweight original period-style officer mesh for the goal area.
// Deliberately separate from the modern Soldier.glb rig; no external assets.
export function createFinishOfficer() {
  const officer = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color: 0x777a72, roughness: 0.96 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x3b3e3b, roughness: 0.9 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x2c2925, roughness: 0.82 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc39a7e, roughness: 0.95 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xa39464, metalness: 0.45, roughness: 0.55 });
  function piece(geometry, material, x, y, z, sx=1, sy=1, sz=1) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz);
    mesh.castShadow = true; mesh.receiveShadow = true;
    officer.add(mesh); return mesh;
  }
  const sphere = new THREE.SphereGeometry(1, 12, 8);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 10);
  const box = new THREE.BoxGeometry(1,1,1);
  // Boots, straight trousers, tailored tunic and collar.
  for (const x of [-0.18,0.18]) {
    piece(cylinder, cloth, x,0.52,0,0.145,0.66,0.155);
    piece(box, leather,x,0.16,0.075,0.19,0.32,0.33);
    piece(sphere, leather,x,0.065,0.20,0.14,0.09,0.24);
    piece(cylinder, cloth,x*1.88,1.29,0,0.125,0.65,0.15).rotation.z = x>0 ? 0.13 : -0.13;
    piece(sphere,skin,x*2.02,0.95,0,0.12,0.16,0.12);
    piece(box,trim,x*0.73,1.62,0.205,0.12,0.07,0.035);
    piece(sphere,brass,x*0.65,1.46,0.225,0.025,0.025,0.025);
  }
  piece(box,cloth,0,1.31,0,0.60,0.82,0.33);
  piece(box,leather,0,1.13,0.19,0.64,0.10,0.08);
  piece(box,trim,0,1.76,0.14,0.35,0.15,0.12);
  piece(sphere,skin,0,1.94,0,0.22,0.28,0.19);
  piece(sphere,skin,0,1.90,0.18,0.075,0.085,0.055);
  // Flat peaked military cap, not a helmet.
  piece(cylinder,trim,0,2.205,0,0.235,0.15,0.21);
  piece(cylinder,cloth,0,2.29,0,0.245,0.075,0.225);
  piece(sphere,leather,0,2.17,0.21,0.25,0.028,0.16);
  piece(sphere,brass,0,2.245,0.225,0.045,0.045,0.018);
  officer.userData.originalPeriodOfficer = true;
  return officer;
}
