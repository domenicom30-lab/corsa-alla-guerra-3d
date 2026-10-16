// Pure enter/exit rules shared by touchscreen UI, keyboard, and tests.
export function vehicleInteraction({running=false,paused=false,occupied=false,hp=0,vehicleX=0,playerX=0,H=1}={}){
 const distance=Math.abs(vehicleX-playerX),limit=Math.max(1,H)*.24;
 if(!running||paused||hp<=0)return {visible:false,disabled:true,action:'none',label:'CARRO'};
 if(occupied)return {visible:true,disabled:false,action:'exit',label:'ESCI DAL CARRO'};
 if(distance<=limit)return {visible:true,disabled:false,action:'enter',label:'ENTRA NEL CARRO'};
 if(distance<=Math.max(1,H)*.75)return {visible:true,disabled:true,action:'approach',label:'AVVICINATI AL CARRO'};
 return {visible:false,disabled:true,action:'none',label:'CARRO'};
}
