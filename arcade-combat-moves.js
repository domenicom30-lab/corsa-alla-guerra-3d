// 2D arcade action state. Deterministic, frame-rate-independent, no browser dependency.
// Low evasive slide is a movement tool, not permanent invulnerability.
export function createArcadeCombatMoves(){
 let slideTime=0,slideCooldown=0,slideDirection=1,slashTime=0,slashCooldown=0;
 const SLIDE_DURATION=.37,SLIDE_COOLDOWN=.92,SLASH_DURATION=.26,SLASH_COOLDOWN=.28;
 return {
  startSlide(direction,onGround=true,inVehicle=false){
   const dir=Math.sign(direction);
   if(!dir||!onGround||inVehicle||slideCooldown>0||slideTime>0)return false;
   slideDirection=dir;slideTime=SLIDE_DURATION;slideCooldown=SLIDE_COOLDOWN;return true;
  },
  slash(inVehicle=false){
   if(inVehicle||slashCooldown>0)return false;
   slashTime=SLASH_DURATION;slashCooldown=SLASH_COOLDOWN;return true;
  },
  step(dt){
   if(!(dt>0))return;
   dt=Math.min(1,dt);
   slideTime=Math.max(0,slideTime-dt);
   slideCooldown=Math.max(0,slideCooldown-dt);
   slashTime=Math.max(0,slashTime-dt);
   slashCooldown=Math.max(0,slashCooldown-dt);
  },
  reset(){slideTime=slideCooldown=slashTime=slashCooldown=0;slideDirection=1},
  get sliding(){return slideTime>0},
  get slidingDir(){return slideDirection},
  get slideFraction(){return Math.min(1,slideTime/SLIDE_DURATION)},
  get slideSpeedFactor(){return slideTime>0?1.55:1},
  get slashActive(){return slashTime>0},
  get slashFraction(){return Math.min(1,slashTime/SLASH_DURATION)},
  get readyToSlide(){return slideCooldown<=0},
  get readyToSlash(){return slashCooldown<=0}
 }
}
export function enemyCombatPose(e){
 return e?.dodgeTime>0?'dodge':e?.flinch>0?'hurt':e?.windup>0?'windup':'normal';
}
