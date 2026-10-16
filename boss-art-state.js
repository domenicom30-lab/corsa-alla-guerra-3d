import {bossPhase} from './boss-encounter.js';
// The renderer chooses three real authored PNG atlases, not a CSS tint overlay.
export function bossSpriteForPhase(boss){
 const phase=bossPhase(boss);
 return phase===3?'commanderCritical':phase===2?'commanderDamaged':'commander';
}
