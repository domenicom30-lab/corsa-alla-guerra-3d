// Startup chooses the true 3D implementation or the original 2D arcade.
import './style.css';
const p=new URLSearchParams(location.search);
const requested=p.get('mode')==='2d'?'2d':'3d';
let webgl=true;
try{
 const test=document.createElement('canvas');
 webgl=!!(test.getContext('webgl2')||test.getContext('webgl'));
}catch(_){webgl=false}
const mode=requested==='3d'&&webgl?'3d':'2d';
const swap=document.createElement('button');
swap.type='button';swap.id='game-mode-toggle';
swap.textContent=mode==='3d'?'MODALITÀ 2D':'MODALITÀ 3D';
swap.setAttribute('aria-label','Cambia visuale 2D e 3D');
Object.assign(swap.style,{position:'fixed',left:'2%',top:'12.5%',zIndex:'10',color:'#f7f0d8',border:'1px solid #c1be9a',borderRadius:'8px',background:'#182921eb',font:'bold 12px system-ui',padding:'7px 12px',pointerEvents:'auto',touchAction:'manipulation'});
document.body.appendChild(swap);
swap.addEventListener('pointerdown',e=>{
 e.preventDefault();
 const q=new URLSearchParams(location.search);
 q.set('mode',mode==='3d'?'2d':'3d');
 location.search=q.toString();
});
if(!webgl&&requested==='3d')swap.textContent='3D NON SUPPORTATO · 2D';
if(mode==='3d')import('./three-game.js');
else import('./main.js');
