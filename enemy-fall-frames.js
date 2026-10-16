// Six-frame authored enemy fall selection follows the actual knockdown state.
export function enemyFallFrame(fall){
 if(!fall||fall.impact)return fall?5:0;
 const age=Number.isFinite(fall.age)?Math.max(0,fall.age):0;
 return Math.min(4,Math.floor(age/.105));
}
