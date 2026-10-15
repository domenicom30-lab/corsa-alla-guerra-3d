// Original mobile-friendly arcade front end: explicit loading, mission, pause, victory.
const MODES=new Set(['loading','ready','playing','paused','victory','error']);
const scoreText=n=>String(Math.floor(Math.max(0,n||0))).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
export function createGameInterface({onPlay=()=>{},onRestart=()=>{},onAudio=()=>{},onQuality=()=>{},initialMuted=false,initialQuality='auto'}={}){
 if(typeof document==='undefined')throw Error('DOM required');
 const root=document.createElement('section');
 root.id='arcade-menu';root.setAttribute('role','dialog');root.setAttribute('aria-label','Menu di Corsa alla Guerra');
 root.className='arcade-menu';
 const panel=document.createElement('div');panel.className='arcade-menu-panel';
 const eyebrow=document.createElement('p');eyebrow.className='arcade-eyebrow';eyebrow.textContent='OPERAZIONE FERRO · BUILD 2.3';
 const title=document.createElement('h1');title.textContent='CORSA ALLA GUERRA';
 const subtitle=document.createElement('p');subtitle.className='arcade-menu-subtitle';
 const stats=document.createElement('p');stats.className='arcade-menu-stats';
 const actions=document.createElement('div');actions.className='arcade-menu-actions';
 const play=document.createElement('button');play.type='button';play.className='arcade-action-primary';
 const restart=document.createElement('button');restart.type='button';restart.className='arcade-action-secondary';restart.textContent='RICOMINCIA';
 const settings=document.createElement('div');settings.className='arcade-settings';
 const audio=document.createElement('button');audio.type='button';audio.className='arcade-action-setting';
 const quality=document.createElement('button');quality.type='button';quality.className='arcade-action-setting';
 const hint=document.createElement('p');hint.className='arcade-menu-hint';hint.textContent='MUOVITI · SALTA · SPARA · GRANATA · ABBASSATI';
 actions.append(play,restart);settings.append(audio,quality);
 panel.append(eyebrow,title,subtitle,stats,actions,settings,hint);root.append(panel);
 document.body.appendChild(root);
 let mode='loading',isMuted=!!initialMuted,qualityMode=['auto','high','battery'].includes(initialQuality)?initialQuality:'auto',canReplay=true;
 const help={
  loading:'Preparazione degli sprite e degli scenari 2D…',
  ready:'Quattro zone di battaglia. Libera i prigionieri, raccogli le armi, elimina il comandante corazzato e raggiungi i 200 metri.',
  paused:'Missione sospesa. Puoi riprendere dallo stesso punto.',
  victory:'Missione completata! Il comandante corazzato è stato sconfitto.',
  error:'Impossibile caricare un asset grafico obbligatorio.',
  playing:''
 };
 function update(){
  root.hidden=mode==='playing';
  root.dataset.mode=mode;subtitle.textContent=help[mode];
  play.textContent=mode==='loading'?'CARICAMENTO':mode==='paused'?'RIPRENDI':mode==='victory'?'GIOCA ANCORA':mode==='error'?'RIPROVA':'INIZIA MISSIONE';
  play.disabled=mode==='loading'||(mode==='victory'&&!canReplay);
  restart.hidden=mode!=='paused'&&mode!=='victory';restart.disabled=mode==='victory'&&!canReplay;
  audio.textContent='AUDIO: '+(isMuted?'OFF':'ON');
  quality.textContent='GRAFICA: '+(qualityMode==='high'?'ALTA':qualityMode==='battery'?'RISPARMIO':'AUTO');
  root.setAttribute('aria-hidden',mode==='playing'?'true':'false');
 }
 function setMode(next,data={}){
  if(!MODES.has(next))throw Error('Menu mode invalid: '+next);
  mode=next;
  if(next==='loading'||next==='ready'||next==='paused'){stats.textContent=data.stats||'';canReplay=true}
  if(next==='victory'){canReplay=false;stats.textContent='PUNTI '+scoreText(data.score)+
   ' · RECORD '+scoreText(data.record)+
   ' · OSTAGGI '+Math.max(0,data.rescued||0)+
   ' · TEMPO '+Math.floor(Math.max(0,data.seconds||0)/60)+':'+String(Math.floor(Math.max(0,data.seconds||0)%60)).padStart(2,'0')}
  if(next==='error'){stats.textContent=String(data.error||'Risorsa assente').slice(0,250)}
  update();
 }
 play.addEventListener('click',()=>{if(play.disabled)return;if(mode==='victory')onRestart();else onPlay()});
 restart.addEventListener('click',()=>onRestart());
 audio.addEventListener('click',()=>{isMuted=!isMuted;onAudio(isMuted);update()});
 quality.addEventListener('click',()=>{
  qualityMode=qualityMode==='auto'?'high':qualityMode==='high'?'battery':'auto';
  onQuality(qualityMode);update()
 });
 const start=()=>setMode('ready');
 const pause=()=>setMode('paused');
 const playMode=()=>setMode('playing');
 const victory=summary=>setMode('victory',summary);
 const error=message=>setMode('error',{error:message});
 function allowReplay(){if(mode==='victory'){canReplay=true;update()}}
 update();
 return {root,play,restart,audio,quality,start,pause,playMode,victory,error,allowReplay,setMode,
  get mode(){return mode},get muted(){return isMuted},get qualityMode(){return qualityMode}}
}
