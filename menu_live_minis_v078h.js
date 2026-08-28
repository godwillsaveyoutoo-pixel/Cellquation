/* Cellquation v0.7.8h — shared one-shot CellKit campaign miniature renderer.
   One WebGL context renders all menu miniatures; target canvases are 2D copies.
   This avoids per-card WebGL context pressure and all continuous menu rendering. */
import {CellRenderer} from './cellkit_latest/renderer.js?v=0.7.8d';
import {Cell} from './cellkit_latest/cell.js?v=0.12.3.2';
import {
  paletteForSpecies,FUSION_VISUAL_DEFAULTS,SPLIT_VISUAL_DEFAULTS,BROOD_VISUAL_DEFAULTS,
  CELL_TYPE_IDLE_IDENTITY_DEFAULTS,CELL_TYPE_MATERIAL_DEFAULTS,cloneProfile
} from './cellkit_latest/profiles.js?v=0.12.3.4';
import {broodNucleusLocalPosition,broodNucleusRadius} from './cellkit_latest/brood.js?v=0.12.3.2';
import {SynapseRenderer} from './runtime/synapse_renderer_v053.js?v=0.7.6.4';
import {createSettings} from './canonical/synapse/settings.js?v=synapse0.8.7';
import {applyVisualIdentityV062} from './visual_profiles_v062.js?v=0.7.3';

const SIZE=192;
const fusionVisual=cloneProfile(FUSION_VISUAL_DEFAULTS);
const splitVisual=cloneProfile(SPLIT_VISUAL_DEFAULTS);
const broodVisual=cloneProfile(BROOD_VISUAL_DEFAULTS);
const idleProfiles=cloneProfile(CELL_TYPE_IDLE_IDENTITY_DEFAULTS);
const materialProfiles=cloneProfile(CELL_TYPE_MATERIAL_DEFAULTS);
const visuals={fusion:fusionVisual,split:splitVisual,brood:broodVisual};
applyVisualIdentityV062({materialProfiles,idleProfiles,visuals});
const canonical=createSettings();
let canonicalReady=false;
fetch('./canonical/CellKit_Synapse_Animation_2026-08-17T00-32-48-952Z.json')
  .then(r=>r.ok?r.json():null).then(v=>{if(v?.settings)Object.assign(canonical,v.settings);canonicalReady=true;renderAll();}).catch(()=>{canonicalReady=true;renderAll()});

let sourceCanvas=null,renderer=null,synapse=null,glFailed=false,renderQueued=false;
function scaledVisual(base,scale){
  const out={...base};
  for(const k of ['radius','nucleusRadius','nucleusSeparation','broodNucleusRadius','broodOrbitInner','broodOrbitOuter'])if(Number.isFinite(out[k]))out[k]*=scale;
  return out;
}
function speciesFor(colour,slot){
  return colour==='three'?['blue','green','violet','blue'][slot%4]:['blue','green','blue','green'][slot%4];
}
function makeCell(type,species,pos,seed,visual){return new Cell({type,species,position:[...pos],rotation:seed*.15,visualSeed:seed,visualProfile:visual,state:'idle'})}
function ensureRenderer(){
  if(renderer||glFailed)return !!renderer;
  try{
    sourceCanvas=document.createElement('canvas');
    sourceCanvas.width=SIZE;sourceCanvas.height=SIZE;
    Object.assign(sourceCanvas.style,{position:'fixed',left:'-10000px',top:'0',width:`${SIZE}px`,height:`${SIZE}px`,opacity:'0',pointerEvents:'none',zIndex:'-9999'});
    document.body.append(sourceCanvas);
    renderer=new CellRenderer(sourceCanvas,null);
    renderer.setIdleIdentity(idleProfiles);renderer.setMaterialProfiles(materialProfiles);
    renderer.setPixelRatioCap(1);renderer.setRenderDetail(.70);renderer.setViewScale(.92);
    synapse=new SynapseRenderer(renderer);
    return true;
  }catch(err){
    console.warn('Cellquation menu miniature WebGL fallback',err);glFailed=true;renderer=null;synapse=null;return false;
  }
}
function prepare(){
  renderer.resize();
  const g=renderer.gl;
  g.disable(g.SCISSOR_TEST);g.disable(g.BLEND);
  g.clearColor(0.007,0.052,0.071,1);g.clear(g.COLOR_BUFFER_BIT);
  g.enable(g.BLEND);g.blendFunc(g.ONE,g.ONE);
}
function drawBrood(cell,visual,time,count=3){
  cell.ensureBroodNuclei(count);const live=cell.liveBroodNuclei,nr=broodNucleusRadius(count,visual);
  for(let i=0;i<live.length;i++){
    const n=live[i],local=broodNucleusLocalPosition(n,time,cell.radius,visual,count,i);
    renderer.drawBroodNucleus({time,center:[cell.position[0]+local[0],cell.position[1]+local[1]],radius:nr,parentCenter:cell.position,parentRadius:cell.radius,phase:n.visualSeed,opacity:1,clipInside:1,colors:paletteForSpecies(cell.species),glow:visual.broodNucleusGlow});
  }
}
function trim(a,b,r=.115){
  const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.001,Math.hypot(dx,dy)),nx=dx/d,ny=dy/d,gap=Math.min(.018,Number(canonical.gap)||.018);
  return [[a[0]+nx*(r+gap),a[1]+ny*(r+gap)],[b[0]-nx*(r+gap),b[1]-ny*(r+gap)]];
}
function synapseOptions(time,a,b,sa,sb){
  const s=canonical;
  return {time,a,b,curve:s.curve,waist:s.waist,endWidth:s.endWidth*.82,shoulderWidth:s.shoulderWidth,mouthWidth:s.mouthWidth,mouthAngle:s.mouthAngle,mouthBowl:s.mouthBowl,mouthWrap:s.mouthWrap,mouthFlatness:s.mouthFlatness,opacity:.96,glow:s.glow*.78,relief:s.relief,living:s.living,breatheStrength:s.breatheStrength,breatheSpeed:s.breatheSpeed,edgeLife:s.edgeLife,mouthFlex:s.mouthFlex,innerShadowThickness:s.innerShadowThickness,innerShadowDarkness:s.innerShadowDarkness,membraneTint:s.membraneTint,rimTint:s.rimTint,flowTint:s.flowTint,flowSpeed:s.flowSpeed,flowStrength:s.flowStrength,material:fusionVisual,paletteA:paletteForSpecies(sa),paletteB:paletteForSpecies(sb)};
}
function renderFoundations(colour,time){
  const vf=scaledVisual(fusionVisual,1.04),vs=scaledVisual(splitVisual,.92),vb=scaledVisual(broodVisual,.90);
  const specs=[
    ['fusion',speciesFor(colour,0),[-.17,.15],2.1,vf],
    ['split',speciesFor(colour,1),[ .18,.11],5.2,vs],
    ['brood',speciesFor(colour,2),[-.01,-.18],8.1,vb],
  ];
  for(const [type,species,pos,seed,visual] of specs){
    const c=makeCell(type,species,pos,seed,visual);
    renderer.drawCell({time,cell:c,visual,colors:paletteForSpecies(species),outerHaloStrength:.34});
    if(type==='brood')drawBrood(c,visual,time,3);
  }
}
function renderNetwork(colour,time){
  const visual=scaledVisual(fusionVisual,.76),r=visual.radius;
  const pts=[[-.27,.00],[-.06,.24],[.27,.05],[.05,-.24]],species=pts.map((_,i)=>speciesFor(colour,i)),edges=[[0,1],[1,2],[2,3],[3,0]];
  for(const [i,j] of edges){const [a,b]=trim(pts[i],pts[j],r);synapse.draw(synapseOptions(time,a,b,species[i],species[j]));}
  renderer.gl.disable(renderer.gl.SCISSOR_TEST);
  pts.forEach((p,i)=>{const c=makeCell('fusion',species[i],p,3.2+i*2.13,visual);renderer.drawCell({time,cell:c,visual,colors:paletteForSpecies(species[i]),outerHaloStrength:.32})});
}
function readFrame(){
  const g=renderer.gl,w=sourceCanvas.width,h=sourceCanvas.height,raw=new Uint8Array(w*h*4);
  g.readPixels(0,0,w,h,g.RGBA,g.UNSIGNED_BYTE,raw);
  const out=new Uint8ClampedArray(raw.length),row=w*4;
  for(let y=0;y<h;y++)out.set(raw.subarray((h-1-y)*row,(h-y)*row),y*row);
  return new ImageData(out,w,h);
}
function renderFrame(kind,colour){
  prepare();const time=2.35;
  if(kind==='network')renderNetwork(colour,time);else renderFoundations(colour,time);
  const frame=readFrame();renderer.endFrame();return frame;
}
function drawFallback(canvas,kind,colour){
  const w=160,h=160;canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');if(!c)return;
  c.clearRect(0,0,w,h);c.fillStyle='#031923';c.fillRect(0,0,w,h);
  const cols=colour==='three'?['#1ea8ee','#27cb7b','#a34be3','#1ea8ee']:['#1ea8ee','#27cb7b','#1ea8ee','#27cb7b'];
  const pts=kind==='network'?[[35,80],[74,38],[125,75],[82,125]]:[[48,48],[112,55],[78,113]];
  if(kind==='network'){
    c.lineWidth=8;c.lineCap='round';
    for(const [a,b] of [[0,1],[1,2],[2,3],[3,0]]){const g=c.createLinearGradient(...pts[a],...pts[b]);g.addColorStop(0,cols[a]);g.addColorStop(1,cols[b]);c.strokeStyle=g;c.globalAlpha=.45;c.beginPath();c.moveTo(...pts[a]);c.lineTo(...pts[b]);c.stroke();}
  }
  c.globalAlpha=1;pts.forEach((p,i)=>{const g=c.createRadialGradient(p[0]-6,p[1]-7,3,p[0],p[1],23);g.addColorStop(0,'#bff8ff');g.addColorStop(.16,cols[i]);g.addColorStop(1,'#07354a');c.fillStyle=g;c.beginPath();c.arc(p[0],p[1],20,0,Math.PI*2);c.fill();});
}
function blit(canvas,frame){
  canvas.width=frame.width;canvas.height=frame.height;const c=canvas.getContext('2d',{alpha:false});if(!c)return;c.putImageData(frame,0,0);
}
function renderAll(){
  renderQueued=false;
  const targets=[...document.querySelectorAll('canvas.cq-campaign-mini')];if(!targets.length)return;
  if(!ensureRenderer()){targets.forEach(t=>drawFallback(t,t.dataset.miniKind||'foundation',t.dataset.miniColour||'two'));return;}
  const cache=new Map();
  for(const t of targets){
    const kind=t.dataset.miniKind||'foundation',colour=t.dataset.miniColour||'two',key=`${kind}:${colour}`;
    let frame=cache.get(key);if(!frame){frame=renderFrame(kind,colour);cache.set(key,frame);}blit(t,frame);
  }
}
function queueRender(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>requestAnimationFrame(renderAll));}
queueRender();
const choices=document.getElementById('campaignChoices');if(choices)new MutationObserver(queueRender).observe(choices,{childList:true,subtree:true});
window.addEventListener('pageshow',queueRender,{passive:true});
