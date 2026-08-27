import {CellRenderer} from './cellkit_latest/renderer.js?v=0.7.7a.2';
import {Cell} from './cellkit_latest/cell.js?v=0.12.3.2';
import {paletteForSpecies,FUSION_VISUAL_DEFAULTS,SPLIT_VISUAL_DEFAULTS,BROOD_VISUAL_DEFAULTS,DESTRUCT_VISUAL_DEFAULTS,SWITCH_VISUAL_DEFAULTS,MIMIC_VISUAL_DEFAULTS,DESTRUCT_NUCLEUS_COLORS,CELL_TYPE_IDLE_IDENTITY_DEFAULTS,CELL_TYPE_MATERIAL_DEFAULTS,FUSION_SPLIT_TRANSITION_DEFAULTS,cloneProfile} from './cellkit_latest/profiles.js?v=0.12.3.4';
import {broodNucleusLocalPosition,broodNucleusRadius} from './cellkit_latest/brood.js?v=0.12.3.2';
import {SynapseRenderer as SynapseRendererV053} from './runtime/synapse_renderer_v053.js?v=0.7.6.4';
import {createSettings} from './canonical/synapse/settings.js?v=synapse0.8.7';
import {createTransportAction,startTransport,advanceTransport,stageProgress,synapseActionParams,timingValue,sanitizeTransportSettings,transportTimelineTime,transportTimelineDuration} from './canonical/synapse/transport_choreography.js?v=synapse0.8.7';
import {TransportGeometry} from './canonical/synapse/transport_geometry.js?v=synapse0.8.7';
import {AnimationKeyframes} from './canonical/synapse/animation_keyframes.js?v=synapse0.8.7';
import {pressureBulgeFromCell} from './canonical/synapse/transport_deformation.js?v=synapse0.8.7';
import {transportCellRenderOpacity} from './canonical/synapse/transport_visibility.js?v=synapse0.8.7';
import {clamp,mix,smootherstep,lerp2,sub2,len2,add2,mul2} from './canonical/synapse/math2d.js?v=synapse0.8.7';
import {FusionSplitTransition,TransitionPhase,evaluateFusionSplitMechanics,lerp,smooth01} from './cellkit_latest/transition.js?v=0.12.3.2';
import {loadProgress,recordCompletion} from './progress_v060.js?v=0.7.7a.6';
import {saveGameplayResume} from './resume_state_v076412.js?v=0.7.6.4.12';
import {applyVisualIdentityV062} from './visual_profiles_v062.js?v=0.7.3';
import {createAdaptiveMobilePerformance} from './runtime/mobile_performance_v0764.js?v=0.7.6.4';
const BUILD_ID='Cellquation_Core_v0.7.7a.8_TARGET_CELL_WOBBLE_GLOW_CLEANUP';
const ACTION_SPEED=2.0;
const NETWORK_MAX_DT=0.12,NETWORK_MAX_SUB=1/60,NETWORK_MAX_STEPS=4;
const PORTRAIT_MAX_Y_STRETCH=1.32;
const GOAL_CONFIRM=0;
// v0.7.7a.8 — Living Cell Wobble Tuning
// Visual-only movement around authored network anchors. Gameplay topology,
// hit targets and action geometry remain fixed.
const REDUCED_MOTION=Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const IDLE_MOTION=Object.freeze({drift:0.0175,breathe:0.0068,rotate:0.018,speed:0.56,actionDamp:0.34,selectedDamp:0.58,lowQualityDamp:0.82});
const canvas=document.getElementById('gl'),errorBox=document.getElementById('error'),networkAura=document.getElementById('networkAura'),networkParticles=document.getElementById('networkParticles');
const sockets=document.getElementById('sockets'),hint=document.getElementById('hint'),selection=document.getElementById('selection');
const debug=document.getElementById('debug'),resultBackdrop=document.getElementById('resultBackdrop');
const movesEl=document.getElementById('moves'),ratioEl=document.getElementById('ratioNow'),levelTitleEl=document.getElementById('levelTitle'),levelMetaEl=document.getElementById('levelMeta');
const goalBlue=document.getElementById('goalBlue'),goalGreen=document.getElementById('goalGreen'),resultTitle=document.getElementById('resultTitle'),starsEl=document.getElementById('stars'),resultSummary=document.getElementById('resultSummary'),bestSummary=document.getElementById('bestSummary'),continueBtn=document.getElementById('continue');

let renderer,synapse,campaign,level,synapseCanonical,layoutPack,visualConfig,progress,mobilePerf;
const fusionVisual=cloneProfile(FUSION_VISUAL_DEFAULTS),splitVisual=cloneProfile(SPLIT_VISUAL_DEFAULTS),broodVisual=cloneProfile(BROOD_VISUAL_DEFAULTS),destructVisual=cloneProfile(DESTRUCT_VISUAL_DEFAULTS),switchVisual=cloneProfile(SWITCH_VISUAL_DEFAULTS),mimicVisual=cloneProfile(MIMIC_VISUAL_DEFAULTS);
const idleProfiles=cloneProfile(CELL_TYPE_IDLE_IDENTITY_DEFAULTS),materialProfiles=cloneProfile(CELL_TYPE_MATERIAL_DEFAULTS),dynamics=cloneProfile(FUSION_SPLIT_TRANSITION_DEFAULTS);
const TYPE_VISUALS={fusion:fusionVisual,split:splitVisual,brood:broodVisual,destruct:destructVisual,swap:switchVisual,imitate:mimicVisual};
applyVisualIdentityV062({materialProfiles,idleProfiles,visuals:TYPE_VISUALS});
let nodeWorld=[],occupancy=[],active=null,localDivision=null,localAction=null,broodSequence=null,pendingNetworkTransform=false,edgeBendMap=new Map();
const renderSkipNodes=new Set(),renderSkipEdge=[-1,-1];
const runtime={levelIndex:0,mode:'loading',paused:false,moves:0,simTime:0,lastNow:performance.now(),selectedNode:null,targetMode:null,goalHold:0,quality:'normal'};
let stats={frames:0,stamp:performance.now(),fps:0,intervals:[],updates:[],renders:[],total:0,dropped:0};
let priorRaf=performance.now();

function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0} function push(a,v,n=180){a.push(v);if(a.length>n)a.shift()}
function percentile(a,p=.95){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor((s.length-1)*p))]}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t}return a||1}
function reduced(a,b){if(!a&&!b)return '0:0';const g=gcd(a,b);return `${a/g}:${b/g}`}
function countSpecies(){let blue=0,green=0;for(const c of occupancy){if(!c)continue;if(c.species==='blue')blue++;else if(c.species==='green')green++}return {blue,green}}
function goalReached(){const {blue,green}=countSpecies(),[gb,gg]=level.goal;return blue>0&&green>0&&blue*gg===green*gb}
function starsForMoves(n){return n<=level.min?3:n===level.min+1?2:1}
function nodeCell(i){return occupancy[i]||null}
function adjacent(a,b){return level.network.edges.some(e=>(e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a))}
function neighbors(i){const out=[];for(const [a,b] of level.network.edges){if(a===i)out.push(b);else if(b===i)out.push(a)}return out}
function nodeRadius(){return fusionVisual.radius*1.15}
function nodeMotionFactor(i){
  if(REDUCED_MOTION||!nodeWorld[i])return 0;
  if(active&&(i===active.sourceNode||i===active.targetNode))return 0;
  if(localDivision&&(i===localDivision.source||i===localDivision.target))return 0;
  if(localAction&&(i===localAction.source||i===localAction.target))return 0;
  let f=(active||localDivision||localAction||broodSequence)?IDLE_MOTION.actionDamp:1;
  if(runtime.selectedNode===i)f*=IDLE_MOTION.selectedDamp;
  if(runtime.quality==='low'||mobilePerf?.state?.tier==='critical')f*=IDLE_MOTION.lowQualityDamp;
  return f;
}
function idleNodePose(i,c=nodeCell(i)){
  const anchor=nodeWorld[i]||[0,0],f=nodeMotionFactor(i);
  if(f<=0)return {position:anchor,scale:1,rotation:0};
  const seed=Number(c?.visualSeed??(i+1)*1.731),phase=seed*1.913+i*0.733,t=runtime.simTime*IDLE_MOTION.speed;
  const dx=IDLE_MOTION.drift*f*(0.64*Math.sin(t*0.79+phase)+0.36*Math.sin(t*0.31+phase*1.67));
  const dy=IDLE_MOTION.drift*f*(0.61*Math.cos(t*0.67+phase*1.21)+0.39*Math.sin(t*0.27+phase*0.74));
  const scale=1+IDLE_MOTION.breathe*f*(0.68*Math.sin(t*0.91+phase*0.83)+0.32*Math.sin(t*0.43+phase*1.49));
  const rotation=IDLE_MOTION.rotate*f*(0.72*Math.sin(t*0.53+phase*1.11)+0.28*Math.sin(t*0.23+phase*1.91));
  return {position:[anchor[0]+dx,anchor[1]+dy],scale,rotation};
}
function renderNodePosition(i){return idleNodePose(i,nodeCell(i)).position}


// v0.5.3 keeps every authored animation and world system frozen. Layout, curve,
// material tuning and component atmosphere are presentation adapters loaded from
// content/, so the canonical v0.8.7 transport can still be hashed byte-for-byte.
const SHARED_TEAL={deep:[.004,.060,.071],mid:[.022,.282,.302],bright:[.12,.74,.79],glow:[.055,.69,.72]};
function requestedQuality(){
  const q=new URL(location.href).searchParams.get('quality');if(['low','normal','high'].includes(q))return q;
  if(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return 'low';
  if(Number(navigator.deviceMemory||4)<=2)return 'low';
  return 'normal';
}
function currentLayout(){return layoutPack?.levels?.[level?.id]||null}
function qualityProfile(){return visualConfig?.quality?.[runtime.quality]||visualConfig?.quality?.normal||{particleNode:0,particleEdge:0,particleContact:0,auraScale:1,animateAtmosphere:false}}
function particleProfile(){
  const base=qualityProfile();
  const q={...base};
  if(runtime.quality==='low'||!level)return q;
  // v0.5.3 was tuned on small 3–5 node graphs. The full campaign reaches 11
  // nodes / 14 edges, so keep the same atmospheric language but cap CSS-particle
  // pressure on budget Android devices. Contact particles get priority because
  // they visually weld cells to synapses; node/edge dust scales down first.
  const nodes=level.network.nodes.length,edges=level.network.edges.length,budget=runtime.quality==='high'?110:72;
  const contactCost=edges*2*q.particleContact,free=Math.max(0,budget-contactCost),baseFree=nodes*q.particleNode+edges*q.particleEdge;
  if(contactCost+baseFree>budget&&baseFree>0){const scale=free/baseFree;q.particleNode=Math.max(1,Math.round(q.particleNode*scale));q.particleEdge=Math.max(1,Math.round(q.particleEdge*scale))}
  return q
}
function synapseProfile(){return visualConfig.production.synapse}
function atmosphereProfile(){return visualConfig.production.atmosphere}
function currentMaterialStyle(styleP){const a=materialProfiles.fusion,b=materialProfiles.split,t=smooth01(styleP),o={};for(const k of new Set([...Object.keys(a),...Object.keys(b)])){if(k==='enabled'){o[k]=(a.enabled||b.enabled)?1:0;continue}o[k]=lerp(Number(a[k]??0),Number(b[k]??0),t)}return o}
function mix3(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
const cohesivePaletteCache=new Map();
function cohesivePalette(species){
  const key=species||'green';
  let cached=cohesivePaletteCache.get(key);if(cached)return cached;
  const p=paletteForSpecies(key),t=synapseProfile().endpointSpeciesMix;
  cached={deep:mix3(SHARED_TEAL.deep,p.deep,t),mid:mix3(SHARED_TEAL.mid,p.mid,t),bright:mix3(SHARED_TEAL.bright,p.bright,t),glow:mix3(SHARED_TEAL.glow,p.glow,t)};
  cohesivePaletteCache.set(key,cached);return cached;
}
function edgeSpecies(i,j){const a=nodeCell(i),b=nodeCell(j);return [a?.species||b?.species||'blue',b?.species||a?.species||'green']}
function edgeBend(i,j){return edgeBendMap.get(`${i}:${j}`)??(Number(synapseCanonical?.settings?.curve)||0)}
function curvePoint(a,b,bend,t){
  const v=sub2(b,a),d=Math.max(1e-6,len2(v)),n=[-v[1]/d,v[0]/d],u=Math.abs(t*2-1),offset=bend*(1-Math.pow(u,1.45));
  return add2(lerp2(a,b,t),mul2(n,offset));
}
function edgeCurvePoint(i,j,t){return curvePoint(nodeWorld[i],nodeWorld[j],edgeBend(i,j),t)}
function curveMappedPoint(p,a,b,bend){
  if(Math.abs(bend)<1e-7)return p;
  const v=sub2(b,a),d2=Math.max(1e-8,v[0]*v[0]+v[1]*v[1]),t=clamp(((p[0]-a[0])*v[0]+(p[1]-a[1])*v[1])/d2,0,1),d=Math.sqrt(d2),n=[-v[1]/d,v[0]/d],offset=bend*(1-Math.pow(Math.abs(t*2-1),1.45));
  return add2(p,mul2(n,offset));
}
function updateNetworkAura(){
  if(!networkAura)return;
  if(!nodeWorld.length){networkAura.style.background='transparent';return}
  const a=atmosphereProfile(),q=particleProfile(),scale=q.auraScale||1,glows=[];
  // v0.7.7a.8: no broad component field. It visibly banded the dark plate on
  // some displays and made the sea look like a large artificial gradient.
  // Keep only local, low-alpha light close to cells and synapse contacts.
  const add=(p,colour,size,alpha)=>{const [x,y]=worldToCss(p);glows.push(`radial-gradient(circle ${Math.round(size*scale)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, ${colour.replace('ALPHA',(alpha*scale).toFixed(3))}, transparent 70%)`)};
  for(let i=0;i<nodeWorld.length;i++){
    const c=nodeCell(i),col=c?.species==='blue'?'rgba(18,145,225,ALPHA)':'rgba(26,205,130,ALPHA)';
    add(nodeWorld[i],col,a.nodeGlowPx*.78,a.nodeAlpha*.58);
  }
  for(const [i,j] of level.network.edges)add(edgeCurvePoint(i,j,.5),'rgba(38,205,198,ALPHA)',a.edgeGlowPx*.72,a.edgeAlpha*.50);
  networkAura.style.background=glows.join(',');
}
function hashSeed(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rngFrom(seed){let x=seed||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
function particleColour(species){return species==='blue'?'45,168,255':species==='green'?'43,226,139':'70,218,209'}
function updateNetworkParticles(){
  if(!networkParticles)return;
  networkParticles.innerHTML='';
  if(!nodeWorld.length)return;
  const q=particleProfile();
  networkParticles.classList.toggle('off',q.particleNode+q.particleEdge+q.particleContact===0);
  networkParticles.classList.toggle('static',!q.animateAtmosphere);
  if(q.particleNode+q.particleEdge+q.particleContact===0)return;
  const rnd=rngFrom(hashSeed(level?.id||'network'));
  const add=(x,y,species,scale=.8)=>{
    const el=document.createElement('i');
    const size=(1.25+rnd()*2.05)*scale,alpha=.20+rnd()*.32,duration=5.4+rnd()*5.8,delay=-(rnd()*duration);
    const angle=rnd()*Math.PI*2,dist=4+rnd()*13;
    el.className='net-particle';el.style.left=`${x.toFixed(1)}px`;el.style.top=`${y.toFixed(1)}px`;el.style.width=`${size.toFixed(2)}px`;el.style.height=`${size.toFixed(2)}px`;
    el.style.setProperty('--pc',particleColour(species));el.style.setProperty('--pa',alpha.toFixed(3));el.style.setProperty('--dx',`${(Math.cos(angle)*dist).toFixed(1)}px`);el.style.setProperty('--dy',`${(Math.sin(angle)*dist).toFixed(1)}px`);el.style.animationDuration=`${duration.toFixed(2)}s`;el.style.animationDelay=`${delay.toFixed(2)}s`;
    networkParticles.appendChild(el);
  };
  for(let i=0;i<nodeWorld.length;i++){
    const [cx,cy]=worldToCss(nodeWorld[i]),species=nodeCell(i)?.species||'teal';
    for(let k=0;k<q.particleNode;k++){const a=rnd()*Math.PI*2,r=46+rnd()*31;add(cx+Math.cos(a)*r,cy+Math.sin(a)*r,species,.95)}
  }
  for(const [a,b] of level.network.edges){
    const pa=worldToCss(nodeWorld[a]),pb=worldToCss(nodeWorld[b]),vx=pb[0]-pa[0],vy=pb[1]-pa[1],vl=Math.max(1,Math.hypot(vx,vy)),nx=-vy/vl,ny=vx/vl;
    const [sa,sb]=edgeSpecies(a,b);
    for(let k=0;k<q.particleEdge;k++){const t=.12+rnd()*.76,p=worldToCss(edgeCurvePoint(a,b,t)),off=(rnd()-.5)*32,species=t<.34?sa:t>.66?sb:'teal';add(p[0]+nx*off,p[1]+ny*off,species,.80)}
    for(let side=0;side<2;side++)for(let k=0;k<q.particleContact;k++){const t=side?.91:.09,p=worldToCss(edgeCurvePoint(a,b,t)),angle=rnd()*Math.PI*2,r=8+rnd()*14;add(p[0]+Math.cos(angle)*r,p[1]+Math.sin(angle)*r,side?sb:sa,.92)}
  }
}

function currentVisualStyle(styleP){
  const late=Math.max(0,Math.min(1,(styleP-.72)/.28));const lateStyle=late*late*(3-2*late),general=Math.max(0,Math.min(1,styleP)),g=general*general*(3-2*general),fluidT=dynamics.fluidReaction<=.0001?lateStyle:g,result={};
  const fluid=new Set(['volumeDepth','densityContrast','fluidWarp','fluidSpeed','liquidLights','fineDetail']);
  for(const key of new Set([...Object.keys(fusionVisual),...Object.keys(splitVisual)])){if(key==='radius'||key==='nucleusRadius'||key==='nucleusSeparation')continue;const a=fusionVisual[key]??splitVisual[key]??0,b=splitVisual[key]??fusionVisual[key]??0,t=fluid.has(key)?fluidT:g;result[key]=typeof a==='number'&&typeof b==='number'?a+(b-a)*t:b}return result;
}

function transformNetwork(){
  const authored=currentLayout(),pts=authored?.nodes||level.network.nodes,edges=level.network.edges;
  edgeBendMap=new Map();for(const e of authored?.edges||[]){const bend=Number(e.bend||0);edgeBendMap.set(`${e.from}:${e.to}`,bend);edgeBendMap.set(`${e.to}:${e.from}`,-bend)}
  const lengths=edges.map(([a,b])=>Math.hypot(pts[b].x-pts[a].x,pts[b].y-pts[a].y)).sort((a,b)=>a-b);
  const median=lengths[Math.floor(lengths.length/2)]||150;
  const scale=Number(level.transportScale)||(Number(authored?.targetMedianWorldLength||.84)/median);
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  nodeWorld=pts.map(p=>[(p.x-cx)*scale,(cy-p.y)*scale]);
  const rect=canvas.getBoundingClientRect(),aspect=Math.max(.25,rect.width/Math.max(1,rect.height));
  // Portrait-first use of space: once width determines the camera, spend otherwise
  // unused vertical room on the authored network instead of leaving it clustered
  // around the centre. Curves and transport are recomputed from these positions.
  const portrait=aspect<.82, padX=portrait?.22:.30, padY=portrait?.20:.27, minView=portrait?1.04:1.18, cameraPad=portrait?1.025:1.055;
  let maxX=Math.max(...nodeWorld.map(p=>Math.abs(p[0])))+padX;
  let rawMaxY=Math.max(...nodeWorld.map(p=>Math.abs(p[1])));
  const widthScale=Math.max(minView,maxX*2)*cameraPad;
  if(portrait&&rawMaxY>.001){
    const availableHalfY=widthScale/(2*aspect)-padY;
    const yStretch=clamp(availableHalfY/rawMaxY,1,PORTRAIT_MAX_Y_STRETCH);
    nodeWorld=nodeWorld.map(([x,y])=>[x,y*yStretch]);
  }
  maxX=Math.max(...nodeWorld.map(p=>Math.abs(p[0])))+padX;
  const maxY=Math.max(...nodeWorld.map(p=>Math.abs(p[1])))+padY;
  // Fit against the renderer's actual world bounds. On landscape screens the
  // horizontal world span grows with aspect ratio while the vertical span does
  // not. The previous formula multiplied vertical demand by aspect, making a
  // network progressively *smaller* on wide/fullscreen desktops.
  const halfWidthFactor=Math.max(1,aspect);
  const halfHeightFactor=Math.max(1,1/aspect);
  const neededScaleX=(maxX*2)/halfWidthFactor;
  const neededScaleY=(maxY*2)/halfHeightFactor;
  renderer.setViewScale(Math.max(minView,neededScaleX,neededScaleY)*cameraPad);
  renderer.resize();
}
function makeCell(spec,nodeId,seed){
  const type=spec.role==='imitation'?'imitate':spec.role;
  const visual=TYPE_VISUALS[type]||fusionVisual;
  const c=new Cell({id:1000+seed,type,species:spec.species,position:[...nodeWorld[nodeId]],rotation:(0.16*seed)%6.283,visualSeed:20.4+seed*1.73,visualProfile:visual});c.nodeId=nodeId;return c;
}
function syncNetworkBroodNuclei(){
  for(const c of occupancy){if(c?.type==='brood'){const n=occupancy.filter(x=>x?.species===c.species).length;c.ensureBroodNuclei(n)}}
}
function resetOccupancy(){occupancy=new Array(level.network.nodes.length).fill(null);level.cells.forEach((spec,i)=>{const c=makeCell(spec,spec.node,i+1);occupancy[spec.node]=c});syncNetworkBroodNuclei()}
function realignOccupancy(){for(let i=0;i<occupancy.length;i++){const c=occupancy[i];if(c){c.position[0]=nodeWorld[i][0];c.position[1]=nodeWorld[i][1];c.nodeId=i}}}
function applyNetworkLayout(){transformNetwork();realignOccupancy();positionSockets();updateNetworkAura();updateNetworkParticles();pendingNetworkTransform=false}

function syncSockets(){
  sockets.innerHTML='';
  nodeWorld.forEach((p,i)=>{const el=document.createElement('div');el.className=`socket ${occupancy[i]?'occupied':'empty'}`;el.dataset.node=String(i);el.innerHTML='<i></i>';sockets.appendChild(el)});
  positionSockets();updateNetworkAura();updateNetworkParticles();
}
function worldToCss(p){
  const rect=canvas.getBoundingClientRect(),fit=Math.min(canvas.width,canvas.height),sx=canvas.width/Math.max(1,rect.width),sy=canvas.height/Math.max(1,rect.height);
  const px=canvas.width*.5+(p[0]/renderer.viewScale)*fit,py=canvas.height*.5-(p[1]/renderer.viewScale)*fit;
  return [px/sx,py/sy];
}
function positionSockets(){for(const el of sockets.children){const i=Number(el.dataset.node),[x,y]=worldToCss(nodeWorld[i]);el.style.left=`${x}px`;el.style.top=`${y}px`}}
function targetNodes(){
  if(runtime.selectedNode==null)return [];
  const src=occupancy[runtime.selectedNode];if(!src)return [];
  if(runtime.targetMode==='fusion')return neighbors(runtime.selectedNode).filter(j=>occupancy[j]?.type==='fusion'&&occupancy[j].species===src.species);
  if(runtime.targetMode==='split')return neighbors(runtime.selectedNode).filter(j=>!occupancy[j]);
  if(runtime.targetMode==='destruct')return neighbors(runtime.selectedNode).filter(j=>occupancy[j]);
  if(runtime.targetMode==='imitation')return neighbors(runtime.selectedNode).filter(j=>occupancy[j]&&occupancy[j].type!=='imitate');
  if(runtime.targetMode==='brood')return [...broodRouteMap(runtime.selectedNode).keys()];
  return [];
}
function syncHud(){
  const {blue,green}=countSpecies();movesEl.textContent=`${runtime.moves} ${runtime.moves===1?'MOVE':'MOVES'}`;ratioEl.textContent=`NOW ${reduced(blue,green)}`;
  const prompts={fusion:'CHOOSE CONNECTED FUSION CELL',split:'CHOOSE EMPTY CONNECTED NODE',destruct:'CHOOSE CONNECTED CELL',imitation:'CHOOSE CONNECTED CELL TO COPY',brood:'CHOOSE GROWTH ROUTE END'};
  selection.textContent=runtime.targetMode?prompts[runtime.targetMode]||'CHOOSE TARGET':'';selection.classList.toggle('on',Boolean(selection.textContent));
  const targets=new Set(targetNodes());
  for(const el of sockets.children){const i=Number(el.dataset.node);el.classList.toggle('target',targets.has(i));el.classList.toggle('selected',runtime.selectedNode===i)}
}
function clearSelection(){runtime.selectedNode=null;runtime.targetMode=null;syncHud()}
function syncResumeState(){saveGameplayResume({colour:'two',campaign:'network',campaignLabel:'Living Networks',level,index:runtime.levelIndex})}
function setLevel(index){runtime.levelIndex=clamp(index,0,campaign.levels.length-1);level=campaign.levels[runtime.levelIndex];const url=new URL(location.href);url.searchParams.set('level',String(runtime.levelIndex+1));history.replaceState(null,'',url)}
function syncChrome(){
  const world=campaign.worlds[level.world];levelTitleEl.textContent=level.title.en.toUpperCase();levelMetaEl.innerHTML=`<span>LIVING NETWORKS · W${level.world+1}</span><span>${String(level.local+1).padStart(2,'0')}/${String(world?.count||8).padStart(2,'0')}</span>`;goalBlue.textContent=String(level.goal[0]);goalGreen.textContent=String(level.goal[1]);hint.textContent=world?.intro?.en||level.note?.en||'';resultTitle.textContent=level.title.en.toUpperCase();const link=document.getElementById('levelsLink');if(link)link.href=`living.html?world=${level.world+1}`;
}
function startLevel(index=runtime.levelIndex){
  setLevel(index);syncResumeState();Object.assign(runtime,{mode:'playing',paused:false,moves:0,simTime:0,lastNow:performance.now(),selectedNode:null,targetMode:null,goalHold:0});active=null;localDivision=null;localAction=null;broodSequence=null;pendingNetworkTransform=false;
  transformNetwork();resetOccupancy();syncSockets();updateNetworkAura();updateNetworkParticles();syncChrome();syncHud();window.CellquationUI?.hideResult(resultBackdrop);window.CellquationUI?.setPaused(false);priorRaf=performance.now();
}

function baseSynapseOptions(a,b,paletteA,paletteB,params={}){const s=synapseCanonical.settings,v=synapseProfile();return {time:runtime.simTime,a,b,curve:s.curve,waist:s.waist,endWidth:s.endWidth,shoulderWidth:s.shoulderWidth,mouthWidth:s.mouthWidth,mouthAngle:s.mouthAngle,mouthBowl:s.mouthBowl,mouthWrap:s.mouthWrap,mouthFlatness:s.mouthFlatness,opacity:s.opacity,glow:s.glow*v.glowScale,relief:s.relief,living:s.living*v.livingScale,breatheStrength:s.breatheStrength*v.breatheStrengthScale,breatheSpeed:s.breatheSpeed,edgeLife:s.edgeLife*v.edgeLifeScale,mouthFlex:s.mouthFlex*v.mouthFlexScale,innerShadowThickness:s.innerShadowThickness,innerShadowDarkness:s.innerShadowDarkness,membraneTint:v.membraneTint,rimTint:v.rimTint,flowTint:v.flowTint,flowSpeed:s.flowSpeed,flowStrength:Math.max(s.flowStrength,v.flowStrength),contactPulse:v.contactPulse||0,material:fusionVisual,paletteA,paletteB,...params}}
function trimmedEndpoints(i,j,rA=fusionVisual.radius,rB=fusionVisual.radius){const a=renderNodePosition(i),b=renderNodePosition(j),v=sub2(b,a),d=Math.max(.001,len2(v)),n=[v[0]/d,v[1]/d],gap=Number(synapseCanonical.settings.gap)||.041;return [add2(a,mul2(n,rA+gap)),add2(b,mul2(n,-(rB+gap)))]}
function staticEdgePalettes(i,j){const [sa,sb]=edgeSpecies(i,j);return [cohesivePalette(sa),cohesivePalette(sb)]}
function drawIdleEdges(skip=null){for(const [i,j] of level.network.edges){if(skip&&((skip[0]===i&&skip[1]===j)||(skip[0]===j&&skip[1]===i)))continue;const [a,b]=trimmedEndpoints(i,j,nodeCell(i)?.radius||fusionVisual.radius,nodeCell(j)?.radius||fusionVisual.radius),[pa,pb]=staticEdgePalettes(i,j);synapse.draw(baseSynapseOptions(a,b,pa,pb,{curve:edgeBend(i,j)}))}}
function mixPalette(a,b,t){const u=clamp(t,0,1),mm=(x,y)=>x.map((v,i)=>v+(y[i]-v)*u);return {deep:mm(a.deep,b.deep),mid:mm(a.mid,b.mid),bright:mm(a.bright,b.bright),glow:mm(a.glow,b.glow)}}
function drawBroodNuclei(cell,opacity=1){const count=Math.max(1,occupancy.filter(c=>c?.species===cell.species).length),nr=broodNucleusRadius(count,broodVisual);cell.ensureBroodNuclei(count);for(let i=0;i<cell.broodNuclei.length;i++){const n=cell.broodNuclei[i],local=broodNucleusLocalPosition(n,runtime.simTime,cell.radius,broodVisual,count,i);renderer.drawBroodNucleus({time:runtime.simTime,center:[cell.position[0]+local[0],cell.position[1]+local[1]],radius:nr,parentCenter:cell.position,parentRadius:cell.radius,phase:n.visualSeed,opacity,clipInside:1,colors:paletteForSpecies(cell.species),glow:broodVisual.broodNucleusGlow})}}
function drawNetworkCell(c,{opacity=1,scale=1,palette=null,actionProgress=null}={}){
  const base=TYPE_VISUALS[c.type]||fusionVisual,visual=scale===1?base:{...base,radius:base.radius*scale,nucleusRadius:base.nucleusRadius*scale,nucleusSeparation:(base.nucleusSeparation||0)*scale};let colors=palette||paletteForSpecies(c.species),nucleusColors=c.type==='destruct'?DESTRUCT_NUCLEUS_COLORS:colors,swap=null,mimic=null;
  if(c.type==='swap'){const target=paletteForSpecies(c.species==='green'?'blue':'green');swap={enabled:true,action:actionProgress!=null,progress:actionProgress||0,targetColors:target,ringRadius:switchVisual.swapRingRadius,ringWidth:switchVisual.swapRingWidth,ringGlow:switchVisual.swapRingGlow,pulseSpeed:switchVisual.swapPulseSpeed}}
  if(c.type==='imitate')mimic={enabled:true,organelles:visual.mimicOrganelles,orbitRadius:visual.mimicOrbitRadius,size:visual.mimicSize,glow:visual.mimicGlow,pulseSpeed:visual.mimicPulseSpeed,prismShift:visual.mimicPrismShift};
  renderer.drawCell({time:runtime.simTime,cell:c,visual,colors,nucleusColors,opacity,swap,mimic,shapeScale:scale});if(c.type==='brood')drawBroodNuclei(c,opacity);
}
function drawStaticCells(skip=renderSkipNodes){for(let i=0;i<occupancy.length;i++){
  const c=occupancy[i];if(!c||skip.has(i))continue;
  const pose=idleNodePose(i,c),anchor=nodeWorld[i],oldRotation=c.rotation;
  c.position[0]=pose.position[0];c.position[1]=pose.position[1];c.rotation=oldRotation+pose.rotation;
  drawNetworkCell(c,{scale:pose.scale});
  // Presentation drift must never leak into gameplay/action geometry.
  c.position[0]=anchor[0];c.position[1]=anchor[1];c.rotation=oldRotation;
}}
function drawLocalAction(){if(!localAction)return;const a=localAction,p=clamp(a.elapsed/a.duration,0,1),src=occupancy[a.source];if(!src)return;
  if(a.kind==='swap'){const from=paletteForSpecies(a.fromSpecies),to=paletteForSpecies(a.toSpecies),t=smooth01((p-.05)/.9);drawNetworkCell(src,{palette:mixPalette(from,to,t),actionProgress:p});return}
  if(a.kind==='destruct'){const target=occupancy[a.target],collapse=smooth01((p-.05)/.95),fade=1-smooth01((p-.35)/.65),scale=Math.max(.06,1-.94*collapse);drawNetworkCell(src,{scale,opacity:fade});if(target)drawNetworkCell(target,{scale,opacity:fade});return}
  if(a.kind==='imitation'){const target=occupancy[a.target],from=paletteForSpecies(a.fromSpecies),to=paletteForSpecies(a.toSpecies),t=smooth01((p-.14)/.76),boost=1+.32*Math.sin(Math.PI*p);const base=mimicVisual,v={...base,glowStrength:(base.glowStrength||1)*boost};renderer.drawCell({time:runtime.simTime,cell:src,visual:v,colors:mixPalette(from,to,t),nucleusColors:mixPalette(from,to,t),mimic:{enabled:true,organelles:v.mimicOrganelles,orbitRadius:v.mimicOrbitRadius,size:v.mimicSize,glow:v.mimicGlow*boost,pulseSpeed:v.mimicPulseSpeed,prismShift:v.mimicPrismShift}});return}
}
function drawAttachmentLips(skip=null){
  const lip=synapseProfile().lipOverlayStrength;
  for(const [i,j] of level.network.edges){
    if(skip&&((skip[0]===i&&skip[1]===j)||(skip[0]===j&&skip[1]===i)))continue;
    const [a,b]=trimmedEndpoints(i,j,nodeCell(i)?.radius||fusionVisual.radius,nodeCell(j)?.radius||fusionVisual.radius),[pa,pb]=staticEdgePalettes(i,j);
    const curve=edgeBend(i,j);
    if(nodeCell(i))synapse.draw(baseSynapseOptions(a,b,pa,pb,{curve,renderMode:1,overlayMouthSide:-1,overlayStrength:lip}));
    if(nodeCell(j))synapse.draw(baseSynapseOptions(a,b,pa,pb,{curve,renderMode:1,overlayMouthSide:1,overlayStrength:lip}));
  }
}

function frameMapper(cSource,cTarget,aSource,aTarget,bend=0){
  const cm=[(cSource[0]+cTarget[0])/2,(cSource[1]+cTarget[1])/2],am=[(aSource[0]+aTarget[0])/2,(aSource[1]+aTarget[1])/2];
  const cv=sub2(cTarget,cSource),av=sub2(aTarget,aSource),cl=Math.max(1e-6,len2(cv)),al=Math.max(1e-6,len2(av)),cu=[cv[0]/cl,cv[1]/cl],cp=[-cu[1],cu[0]],au=[av[0]/al,av[1]/al],ap=[-au[1],au[0]],scale=al/cl;
  return p=>{const q=sub2(p,cm),x=q[0]*cu[0]+q[1]*cu[1],y=q[0]*cp[0]+q[1]*cp[1],straight=add2(am,add2(mul2(au,x*scale),mul2(ap,y*scale)));return curveMappedPoint(straight,aSource,aTarget,bend)};
}

class EdgeTransport{
  constructor({sourceNode,targetNode,species,mode='fusion'}){
    this.sourceNode=sourceNode;this.targetNode=targetNode;this.species=species;this.mode=mode;this.settings=createSettings(dynamics);Object.assign(this.settings,synapseCanonical.settings);this.settings.speciesA=species;this.settings.speciesB=species;sanitizeTransportSettings(this.settings);
    this.action=createTransportAction();this.keys=new AnimationKeyframes();this.keys.load(synapseCanonical.animation||{});
    this.source=new Cell({id:8001,type:'fusion',species,position:[...nodeWorld[sourceNode]],rotation:.25,visualSeed:4.1,visualProfile:fusionVisual});
    this.target=new Cell({id:8002,type:'fusion',species,position:[...nodeWorld[targetNode]],rotation:2.15,visualSeed:7.4,visualProfile:fusionVisual});
    this.moving=new Cell({id:8003,type:'fusion',species,position:[...this.source.position],rotation:.25,visualSeed:4.1,visualProfile:fusionVisual});
    this.finalSplit=new Cell({id:8004,type:'split',species,position:[...this.target.position],rotation:0,visualSeed:8.21,visualProfile:splitVisual});
    this.actualGeom=new TransportGeometry({settings:this.settings,fusionVisual,splitVisual,transitionSettings:dynamics,leftFusion:this.source,rightFusion:this.target});
    this.cLeft=new Cell({id:8101,type:'fusion',species,visualSeed:4.1,visualProfile:fusionVisual});this.cRight=new Cell({id:8102,type:'fusion',species,visualSeed:7.4,visualProfile:fusionVisual});
    this.cGeom=new TransportGeometry({settings:this.settings,fusionVisual,splitVisual,transitionSettings:dynamics,leftFusion:this.cLeft,rightFusion:this.cRight});this.cGeom.syncEndpoints();
    this.visualCurve=edgeBend(sourceNode,targetNode);this.mapper=frameMapper(this.cLeft.position,this.cRight.position,this.source.position,this.target.position,this.visualCurve);this.mouthMapper=frameMapper(this.cLeft.position,this.cRight.position,this.source.position,this.target.position,0);this.current=null;startTransport(this.action,1,this.settings);
  }
  info(){const duration=Math.max(.001,transportTimelineDuration(this.action,this.settings)),seconds=clamp(transportTimelineTime(this.action,this.settings),0,duration);return {t:clamp(seconds/duration),seconds,duration}}
  edited(actualBase,canonicalBase,baseScale){const e=this.keys.evaluateCell(this.info().t,canonicalBase,baseScale);return {position:this.mapper(e.position),scale:e.scale}}
  endpoints(){
    const aBase=this.actualGeom.synapseEndpoints(this.action),cBase=this.cGeom.synapseEndpoints(this.action),t=this.info().t;
    const ca=this.keys.evaluateMouth('A',t,cBase[0]),cb=this.keys.evaluateMouth('B',t,cBase[1]);return [this.mouthMapper(ca),this.mouthMapper(cb)];
  }
  register(base,scale,e){this.current={basePosition:[...base],baseScale:scale,position:[...e.position],scale:e.scale}}
  opacity(){if(!this.current)return 0;const d=this.actualGeom.endpointData(1),ends=this.endpoints();return transportCellRenderOpacity({stage:this.action.stage,position:this.current.basePosition,scale:this.current.baseScale,sourceMouth:ends[0],targetMouth:ends[1],travel:d.travel,baseRadius:fusionVisual.radius})}
  params(){const raw=synapseActionParams(this.action,this.settings);if(this.current&&['intake','compression','transit','egress'].includes(this.action.stage)){const auto=pressureBulgeFromCell({position:this.current.basePosition,scale:this.current.baseScale,ends:this.endpoints(),curve:this.settings.curve,baseCellRadius:fusionVisual.radius,waist:this.settings.waist,endWidth:this.settings.endWidth,stage:this.action.stage,stageProgress:stageProgress(this.action,this.settings)});raw.transportProgress=auto.progress;raw.transportBulge=auto.bulge;raw.transportGlow=Math.max(raw.transportGlow,.16+.34*auto.coupling)}return raw}
  drawSyn(){const [a,b]=this.endpoints(),p=cohesivePalette(this.species);synapse.draw(baseSynapseOptions(a,b,p,p,{...this.params(),curve:this.visualCurve}))}
  drawScaled(scale,opacity=1,pos=this.moving.position){const s=clamp(scale,.16,1.8),v={...fusionVisual,radius:fusionVisual.radius*s,nucleusRadius:fusionVisual.nucleusRadius*s,membraneThickness:(fusionVisual.membraneThickness||.55)*s};this.moving.position=[...pos];renderer.drawCell({time:runtime.simTime,cell:this.moving,visual:v,colors:paletteForSpecies(this.species),opacity,shapeScale:s})}
  step(dt){advanceTransport(this.action,this.settings,dt*ACTION_SPEED)}
  render(){
    this.current=null;const st=this.action.stage,p=stageProgress(this.action,this.settings),ad=this.actualGeom.endpointData(1),cd=this.cGeom.endpointData(1);
    if(st==='intake'){
      const ab=lerp2(ad.source.position,this.actualGeom.intakeHalfInPosition(1),smootherstep(.04,.98,p)),cb=lerp2(cd.source.position,this.cGeom.intakeHalfInPosition(1),smootherstep(.04,.98,p)),e=this.edited(ab,cb,1);this.register(ab,1,e);const o=this.opacity();if(o>.001)this.drawScaled(e.scale,o,e.position);this.drawSyn();if(this.mode==='fusion')renderer.drawCell({time:runtime.simTime,cell:this.target,visual:fusionVisual,colors:paletteForSpecies(this.species)});return;
    }
    if(st==='compression'){
      const shrink=timingValue(this.action,this.settings,'shrinkStart'),bs=mix(1,this.settings.transportScale,smootherstep(shrink,.96,p));const ab=lerp2(this.actualGeom.intakeHalfInPosition(1),this.actualGeom.compressionDeepPosition(1),smootherstep(.02,.98,p)),cb=lerp2(this.cGeom.intakeHalfInPosition(1),this.cGeom.compressionDeepPosition(1),smootherstep(.02,.98,p)),e=this.edited(ab,cb,bs);this.register(ab,bs,e);const o=this.opacity();if(o>.001)this.drawScaled(e.scale,o,e.position);this.drawSyn();if(this.mode==='fusion')renderer.drawCell({time:runtime.simTime,cell:this.target,visual:fusionVisual,colors:paletteForSpecies(this.species)});return;
    }
    if(st==='transit'){
      const ab=this.actualGeom.transitSourcePosition(1,p),cb=this.cGeom.transitSourcePosition(1,p),e=this.edited(ab,cb,this.settings.transportScale);this.register(ab,this.settings.transportScale,e);this.drawSyn();if(this.mode==='fusion')renderer.drawCell({time:runtime.simTime,cell:this.target,visual:fusionVisual,colors:paletteForSpecies(this.species)});return;
    }
    if(st==='egress'){
      const takeover=timingValue(this.action,this.settings,'fusionTakeover'),bs=mix(this.settings.transportScale,this.settings.egressScale,smootherstep(.05,takeover,p));const ab=this.actualGeom.egressSourcePosition(1,p,this.action),cb=this.cGeom.egressSourcePosition(1,p,this.action),e=this.edited(ab,cb,bs);this.register(ab,bs,e);const o=this.opacity();if(o>.001)this.drawScaled(e.scale,o,e.position);this.drawSyn();if(this.mode==='fusion')renderer.drawCell({time:runtime.simTime,cell:this.target,visual:fusionVisual,colors:paletteForSpecies(this.species)});return;
    }
    if(st==='fusion'){
      if(this.mode==='fusion'){
        const ap=this.actualGeom.fusionPair(1,p,this.action),cp=this.cGeom.fusionPair(1,p,this.action),bs=this.actualGeom.fusionSourceScale(p,this.action),e=this.edited(ap.sourceWorld,cp.sourceWorld,bs);ap.sourceWorld=[...e.position];const center=ad.target.position,angle=Math.atan2(ad.travel[1],ad.travel[0]);ap.a=this.actualGeom.localOffset(ap.sourceWorld,center,angle);ap.sep=len2(sub2(ap.targetWorld,ap.sourceWorld));this.register(ap.sourceWorld,bs,e);this.drawSyn();const mech=this.actualGeom.mechanicsForFusion(p,ap.sep),tr=this.actualGeom.transitionDescriptor(1);renderer.drawTransition({time:runtime.simTime,transition:tr,mechanics:mech,fusionVisual,splitVisual,style:splitVisual,colors:paletteForSpecies(this.species),sourceColors:{a:paletteForSpecies(this.species),b:paletteForSpecies(this.species),hetero:false},phase:'fusing',materialProfile:materialProfiles.split,customPair:{a:ap.a,b:ap.b},sourceRadii:{a:fusionVisual.radius*e.scale,b:fusionVisual.radius},sourceShapeScales:{a:e.scale,b:1},customNuclei:{sourceRadiusA:fusionVisual.nucleusRadius*e.scale,sourceRadiusB:fusionVisual.nucleusRadius}});return;
      }
      // Split transport: preserve the authored transport edit, but finish as a Fusion cell instead of fusing into a target.
      const ag=this.actualGeom.fusionStartGeometry(1,this.action),cg=this.cGeom.fusionStartGeometry(1,this.action),ab=lerp2(ag.sourceStart,ad.target.position,smootherstep(.02,.96,p)),cb=lerp2(cg.sourceStart,cd.target.position,smootherstep(.02,.96,p)),bs=mix(this.settings.egressScale,1,smootherstep(.10,.72,p)),e=this.edited(ab,cb,bs);this.register(ab,bs,e);this.drawSyn();this.drawScaled(e.scale,1,e.position);return;
    }
    this.drawSyn();if(this.mode==='fusion'){this.finalSplit.position=[...ad.target.position];this.finalSplit.rotation=Math.atan2(ad.travel[1],ad.travel[0]);renderer.drawCell({time:runtime.simTime,cell:this.finalSplit,visual:splitVisual,colors:paletteForSpecies(this.species)})}else{this.moving.position=[...ad.target.position];renderer.drawCell({time:runtime.simTime,cell:this.moving,visual:fusionVisual,colors:paletteForSpecies(this.species)})}
  }
  get done(){return this.action.stage==='done'}
}

function createNodeCell(type,species,node,seed=0){const role=type==='imitate'?'imitation':type,c=makeCell({role,species},node,100+runtime.moves*7+seed);c.position=[...nodeWorld[node]];c.nodeId=node;return c}
function startFusion(anchor,source){const a=occupancy[anchor],b=occupancy[source];if(!a||!b||a.type!=='fusion'||b.type!=='fusion'||a.species!==b.species||!adjacent(anchor,source))return false;active=new EdgeTransport({sourceNode:source,targetNode:anchor,species:a.species,mode:'fusion'});active.context='fusion';runtime.mode='acting';runtime.moves++;clearSelection();return true}
function startSplit(source,target){const c=occupancy[source];if(!c||c.type!=='split'||occupancy[target]||!adjacent(source,target))return false;const angle=Math.atan2(nodeWorld[target][1]-nodeWorld[source][1],nodeWorld[target][0]-nodeWorld[source][0]);const tr={center:[...nodeWorld[source]],angle,finalInstancePhase:(c.visualSeed*.731)%(Math.PI*2),sourceShapePhaseA:1.1+(c.visualSeed*.731)%(Math.PI*2),sourceShapePhaseB:1.1+(c.visualSeed*1.17)%(Math.PI*2),nucleusPhaseA:.4+(c.nuclei[0]?.visualSeed||1),nucleusPhaseB:.4+(c.nuclei[1]?.visualSeed||2),sourceFluidPhaseA:c.visualSeed*.23,sourceFluidPhaseB:c.visualSeed*.41,sourceRotationA:c.rotation,sourceRotationB:c.rotation};const timer=new FusionSplitTransition(dynamics);timer.setPlaybackSpeed(ACTION_SPEED);timer.beginDivision();localDivision={source,target,species:c.species,tr,timer,startPairSep:fusionVisual.radius*.58};runtime.mode='acting';runtime.moves++;clearSelection();return true}
function startSwap(source){const c=occupancy[source];if(!c||c.type!=='swap')return false;localAction={kind:'swap',source,elapsed:0,duration:Math.max(.45,Number(switchVisual.swapDuration)||.5),fromSpecies:c.species,toSpecies:c.species==='blue'?'green':'blue'};runtime.mode='acting';runtime.moves++;clearSelection();return true}
function startDestruct(source,target){const c=occupancy[source];if(!c||c.type!=='destruct'||!occupancy[target]||!adjacent(source,target))return false;localAction={kind:'destruct',source,target,elapsed:0,duration:Math.max(.42,Number(destructVisual.destructDuration)||.5)};runtime.mode='acting';runtime.moves++;clearSelection();return true}
function startImitation(source,target){const a=occupancy[source],b=occupancy[target];if(!a||a.type!=='imitate'||!b||b.type==='imitate'||!adjacent(source,target))return false;localAction={kind:'imitation',source,target,elapsed:0,duration:Math.max(.58,Number(mimicVisual.imitationDuration)||.64),fromSpecies:a.species,toSpecies:b.species,toType:b.type};runtime.mode='acting';runtime.moves++;clearSelection();return true}
function broodRouteMap(source){const cell=occupancy[source],out=new Map();if(!cell||cell.type!=='brood')return out;const amount=occupancy.filter(c=>c?.species===cell.species).length;if(amount<=0)return out;function dfs(cur,path,used){if(path.length===amount){if(!out.has(path[path.length-1]))out.set(path[path.length-1],[...path]);return}for(const nb of neighbors(cur).sort((a,b)=>a-b)){if(used.has(nb)||occupancy[nb])continue;used.add(nb);path.push(nb);dfs(nb,path,used);path.pop();used.delete(nb)}}dfs(source,[],new Set([source]));return out}
// Brood transport contract: the mother stays on its node while all daughters are born.
// Daughters travel one-by-one from the mother through the selected simple path.
// We fill the route from farthest to nearest so a later daughter never has to pass
// through an already occupied intermediate node. This preserves the solver's final
// occupancy while matching the approved serial daughter-transport behaviour.
function startBrood(source,endpoint){
  const c=occupancy[source],routes=broodRouteMap(source),path=routes.get(endpoint);
  if(!c||c.type!=='brood'||!path)return false;
  broodSequence={source,path:[...path],species:c.species,destinationCursor:path.length-1,segmentCursor:0,currentRoute:null,daughterSerial:0};
  localAction={kind:'broodWarmup',source,elapsed:0,duration:.52};runtime.mode='acting';runtime.moves++;clearSelection();return true
}
function prepareBroodDaughter(){
  const b=broodSequence;if(!b)return false;
  if(b.destinationCursor<0)return false;
  // Route for this daughter always starts at the mother and ends at the currently
  // selected destination. Destinations are processed farthest -> nearest.
  b.currentRoute=[b.source,...b.path.slice(0,b.destinationCursor+1)];b.segmentCursor=0;b.daughterSerial++;return true
}
function startNextBroodSegment(){
  const b=broodSequence;if(!b)return;
  if(!b.currentRoute&&!prepareBroodDaughter())return;
  const from=b.currentRoute[b.segmentCursor],to=b.currentRoute[b.segmentCursor+1];
  if(from==null||to==null)return;
  active=new EdgeTransport({sourceNode:from,targetNode:to,species:b.species,mode:'move'});active.context='brood';localAction=null;runtime.mode='acting'
}
function finishBroodSequence(){
  const b=broodSequence;if(!b)return;
  occupancy[b.source]=createNodeCell('fusion',b.species,b.source,90+b.daughterSerial);
  broodSequence=null;active=null;localAction=null;runtime.mode='playing';syncNetworkBroodNuclei();
  if(pendingNetworkTransform)applyNetworkLayout();syncSockets();syncHud();runtime.goalHold=0
}
function finishLocalAction(){const a=localAction;if(!a)return;if(a.kind==='swap')occupancy[a.source]=createNodeCell('fusion',a.toSpecies,a.source,1);else if(a.kind==='destruct'){occupancy[a.source]=null;occupancy[a.target]=null}else if(a.kind==='imitation')occupancy[a.source]=createNodeCell(a.toType,a.toSpecies,a.source,2);else if(a.kind==='broodWarmup'){prepareBroodDaughter();startNextBroodSegment();syncSockets();syncHud();return}localAction=null;runtime.mode='playing';syncNetworkBroodNuclei();syncSockets();syncHud();runtime.goalHold=0}
function finishAction(){
  if(!active)return;const job=active,{sourceNode,targetNode,species,mode}=job;
  if(job.context==='brood'){
    const b=broodSequence;active=null;if(!b)return;
    b.segmentCursor++;
    if(b.segmentCursor<b.currentRoute.length-1){startNextBroodSegment();return}
    // This daughter reached its final destination. Leave it there, then birth the
    // next (nearer) daughter from the mother.
    const destination=b.currentRoute[b.currentRoute.length-1];
    occupancy[destination]=createNodeCell('fusion',species,destination,30+b.daughterSerial);
    b.destinationCursor--;b.currentRoute=null;b.segmentCursor=0;syncSockets();syncHud();
    if(b.destinationCursor>=0){localAction={kind:'broodWarmup',source:b.source,elapsed:0,duration:.24};runtime.mode='acting'}else finishBroodSequence();
    return
  }
  if(mode==='fusion'){occupancy[sourceNode]=null;occupancy[targetNode]=createNodeCell('split',species,targetNode,4)}else occupancy[targetNode]=createNodeCell('fusion',species,targetNode,5);active=null;runtime.mode='playing';syncNetworkBroodNuclei();if(pendingNetworkTransform)applyNetworkLayout();syncSockets();syncHud();runtime.goalHold=0
}
function finishDivision(){const d=localDivision;occupancy[d.source]=createNodeCell('fusion',d.species,d.source,6);localDivision=null;active=new EdgeTransport({sourceNode:d.source,targetNode:d.target,species:d.species,mode:'move'});active.context='split';syncSockets();syncHud()}
function handleNode(i){if(runtime.mode!=='playing'||runtime.paused)return;const c=occupancy[i],s=runtime.selectedNode,src=s!=null?occupancy[s]:null;
  if(runtime.targetMode){if(i===s){clearSelection();return}if(runtime.targetMode==='fusion'&&src&&c&&c.type==='fusion'&&src.type==='fusion'&&src.species===c.species&&adjacent(s,i)){startFusion(s,i);return}if(runtime.targetMode==='split'&&src&&!c&&adjacent(s,i)){startSplit(s,i);return}if(runtime.targetMode==='destruct'&&src&&c&&adjacent(s,i)){startDestruct(s,i);return}if(runtime.targetMode==='imitation'&&src&&c&&c.type!=='imitate'&&adjacent(s,i)){startImitation(s,i);return}if(runtime.targetMode==='brood'&&src&&!c&&broodRouteMap(s).has(i)){startBrood(s,i);return}clearSelection();return}
  if(!c)return;
  if(c.type==='fusion'){if(neighbors(i).some(j=>occupancy[j]?.type==='fusion'&&occupancy[j].species===c.species)){runtime.selectedNode=i;runtime.targetMode='fusion'}else hint.textContent='No connected same-colour Fusion partner.'}
  else if(c.type==='split'){if(neighbors(i).some(j=>!occupancy[j])){runtime.selectedNode=i;runtime.targetMode='split'}else hint.textContent='This Split cell needs a connected empty socket.'}
  else if(c.type==='swap'){startSwap(i);return}
  else if(c.type==='destruct'){if(neighbors(i).some(j=>occupancy[j])){runtime.selectedNode=i;runtime.targetMode='destruct'}else hint.textContent='Destruct needs a connected occupied cell.'}
  else if(c.type==='imitate'){if(neighbors(i).some(j=>occupancy[j]&&occupancy[j].type!=='imitate')){runtime.selectedNode=i;runtime.targetMode='imitation'}else hint.textContent='Imitation needs a connected non-Imitation cell.'}
  else if(c.type==='brood'){if(broodRouteMap(i).size){runtime.selectedNode=i;runtime.targetMode='brood'}else hint.textContent='There is no connected empty route long enough for this Brood cell.'}
  syncHud()
}
function pointerUp(e){e.preventDefault();const p=renderer.screenToWorld(e.clientX,e.clientY);let best=-1,dist=Infinity;for(let i=0;i<nodeWorld.length;i++){const d=Math.hypot(p[0]-nodeWorld[i][0],p[1]-nodeWorld[i][1]);if(d<dist){dist=d;best=i}}if(best>=0&&dist<nodeRadius()*1.55)handleNode(best)}
function completeLevel(){if(runtime.mode==='complete')return;runtime.mode='complete';const stars=starsForMoves(runtime.moves);progress=recordCompletion('network',progress,{levelId:level.id,levelIndex:runtime.levelIndex,moves:runtime.moves,stars,levelCount:campaign.levels.length});starsEl.textContent='★'.repeat(stars)+'☆'.repeat(3-stars);starsEl.setAttribute('aria-label',`${stars} of 3 stars`);resultSummary.textContent=`${runtime.moves} ${runtime.moves===1?'MOVE':'MOVES'} · OPTIMAL ${level.min}`;const best=progress.best[level.id];bestSummary.textContent=`BEST ${best.moves} MOVES · ${best.stars}/3 ★`;continueBtn.textContent=runtime.levelIndex<campaign.levels.length-1?'NEXT LEVEL':'CAMPAIGN COMPLETE';window.CellquationUI?.showResult(resultBackdrop,continueBtn)}
function nextLevel(){if(runtime.levelIndex<campaign.levels.length-1)startLevel(runtime.levelIndex+1);else location.href='living.html'}
function togglePause(){if(runtime.mode==='complete')return;runtime.paused=!runtime.paused;runtime.lastNow=performance.now();priorRaf=runtime.lastNow;window.CellquationUI?.setPaused(runtime.paused)}

function step(dt){if(runtime.paused)return;runtime.simTime+=dt;if(localDivision){localDivision.timer.step(dt);if(localDivision.timer.getRaw()>=1)finishDivision()}else if(active){active.step(dt);if(active.done)finishAction()}else if(localAction){localAction.elapsed+=dt*ACTION_SPEED;if(localAction.elapsed>=localAction.duration)finishLocalAction()}if(runtime.mode==='playing'&&!active&&!localDivision&&!localAction&&!broodSequence){if(goalReached()){runtime.goalHold+=dt;if(runtime.goalHold>=GOAL_CONFIRM)completeLevel()}else runtime.goalHold=0}}
function divisionRender(){const d=localDivision,p=d.timer.getRaw(),mech=evaluateFusionSplitMechanics({raw:p,phase:TransitionPhase.DIVIDING,fusionVisual,splitVisual,dynamics,startPairSep:d.startPairSep});renderer.drawTransition({time:runtime.simTime,transition:d.tr,mechanics:mech,fusionVisual,splitVisual,style:currentVisualStyle(mech.styleP),colors:paletteForSpecies(d.species),sourceColors:{a:paletteForSpecies(d.species),b:paletteForSpecies(d.species),hetero:false},phase:TransitionPhase.DIVIDING,opacity:1,materialProfile:currentMaterialStyle(mech.styleP)})}
function statsActive(){return !debug.classList.contains('off')}
function render(){const measure=statsActive(),t0=measure?performance.now():0;renderer.beginFrame();let skipEdge=null;if(active){renderSkipEdge[0]=active.sourceNode;renderSkipEdge[1]=active.targetNode;skipEdge=renderSkipEdge}drawIdleEdges(skipEdge);renderSkipNodes.clear();if(active&&active.context!=='brood'){renderSkipNodes.add(active.sourceNode);if(active.mode==='fusion')renderSkipNodes.add(active.targetNode)}if(localDivision)renderSkipNodes.add(localDivision.source);if(localAction&&localAction.kind!=='broodWarmup'){renderSkipNodes.add(localAction.source);if(localAction.kind==='destruct')renderSkipNodes.add(localAction.target)}drawStaticCells(renderSkipNodes);drawAttachmentLips(skipEdge);if(localDivision)divisionRender();if(localAction)drawLocalAction();if(active){if(active.mode==='move'&&active.context!=='brood'){const source=occupancy[active.sourceNode];if(source)drawNetworkCell(source)}active.render()}renderer.endFrame();if(measure)push(stats.renders,performance.now()-t0)}
function metricsSnapshot(){return {fps:+stats.fps.toFixed(2),frameMeanMs:+mean(stats.intervals).toFixed(3),frameP95Ms:+percentile(stats.intervals).toFixed(3),updateMeanMs:+mean(stats.updates).toFixed(3),updateP95Ms:+percentile(stats.updates).toFixed(3),renderMeanMs:+mean(stats.renders).toFixed(3),renderP95Ms:+percentile(stats.renders).toFixed(3),droppedFramePct:+(stats.total?100*stats.dropped/stats.total:0).toFixed(2),quality:runtime.quality,nodes:occupancy.length}}
function resetStats(now){stats.frames=0;stats.stamp=now;stats.fps=0;stats.intervals.length=0;stats.updates.length=0;stats.renders.length=0;stats.total=0;stats.dropped=0}
function updateDebug(now,frameMs){if(!statsActive()){if(stats.frames||stats.intervals.length||stats.updates.length||stats.renders.length)resetStats(now);return}stats.frames++;stats.total++;if(frameMs>25)stats.dropped++;push(stats.intervals,frameMs);if(now-stats.stamp>=500){stats.fps=stats.frames*1000/(now-stats.stamp);stats.frames=0;stats.stamp=now;const s=active?active.action.stage:localDivision?'division':localAction?.kind||'idle',m=metricsSnapshot();debug.innerHTML=`<strong>${m.fps.toFixed(0)} FPS</strong><br/>frame ${m.frameMeanMs.toFixed(2)} / p95 ${m.frameP95Ms.toFixed(2)} ms<br/>update ${m.updateMeanMs.toFixed(2)} / p95 ${m.updateP95Ms.toFixed(2)} ms<br/>render ${m.renderMeanMs.toFixed(2)} / p95 ${m.renderP95Ms.toFixed(2)} ms<br/>state ${s} · ${runtime.quality}<br/>perf ${mobilePerf?.state.tier||'full'} · edge ${(mobilePerf?.state.pixelRatioCap||1).toFixed(2)}x · detail ${Math.round((mobilePerf?.state.renderDetail||1)*100)}% · jank ${Math.round((mobilePerf?.state.jank||0)*100)}%<br/>nodes ${occupancy.length}`}}
function frame(now){mobilePerf?.observe(now,!!(active||localDivision||localAction||broodSequence||pendingNetworkTransform));const measure=statsActive(),frameMs=now-priorRaf;priorRaf=now;let dt=Math.min(NETWORK_MAX_DT,Math.max(0,(now-runtime.lastNow)/1000));runtime.lastNow=now;const u0=measure?performance.now():0;if(dt>0){const steps=Math.min(NETWORK_MAX_STEPS,Math.max(1,Math.ceil(dt/NETWORK_MAX_SUB))),s=dt/steps;for(let i=0;i<steps;i++)step(s)}if(measure)push(stats.updates,performance.now()-u0);render();updateDebug(now,frameMs);requestAnimationFrame(frame)}

async function init(){
  [synapseCanonical,campaign,layoutPack,visualConfig]=await Promise.all([
    fetch('./canonical/CellKit_Synapse_Animation_2026-08-17T00-32-48-952Z.json').then(r=>r.json()),
    fetch('./content/runtime/LIVING_NETWORKS_48_V28_RUNTIME.json').then(r=>r.json()),
    fetch('./content/full/LIVING_NETWORKS_LAYOUT_48_V060.json').then(r=>r.json()),
    fetch('./content/LIVING_NETWORKS_VISUAL_CONFIG_V053.json').then(r=>r.json()),
  ]);
  runtime.quality=requestedQuality();document.documentElement.dataset.quality=runtime.quality;
  renderer=new CellRenderer(canvas,errorBox);renderer.setIdleIdentity(idleProfiles);renderer.setMaterialProfiles(materialProfiles);mobilePerf=createAdaptiveMobilePerformance(renderer,{onTierChange:(state)=>{if(state.tier==='critical')document.documentElement.dataset.quality='low'}});synapse=new SynapseRendererV053(renderer);progress=loadProgress('network',campaign);
  const requested=Number(new URL(location.href).searchParams.get('level')||1)-1,start=Number.isFinite(requested)?clamp(requested,0,campaign.levels.length-1):0;startLevel(start);
  canvas.addEventListener('pointerup',pointerUp,{passive:false});sockets.addEventListener('pointerup',e=>{const el=e.target.closest('.socket');if(el){e.preventDefault();handleNode(Number(el.dataset.node))}},{passive:false});
  debug.classList.toggle('off',new URL(location.href).searchParams.get('debug')!=='1');document.getElementById('restart').addEventListener('click',()=>startLevel(runtime.levelIndex));document.getElementById('pause').addEventListener('click',togglePause);document.getElementById('debugToggle')?.addEventListener('click',()=>debug.classList.toggle('off'));document.getElementById('replay').addEventListener('click',()=>startLevel(runtime.levelIndex));continueBtn.addEventListener('click',nextLevel);
  window.addEventListener('resize',()=>{renderer.resize();if(active||localDivision||localAction||broodSequence){pendingNetworkTransform=true;positionSockets()}else applyNetworkLayout()},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){runtime.paused=true;window.CellquationUI?.setPaused(true)}runtime.lastNow=performance.now();priorRaf=runtime.lastNow});
  requestAnimationFrame(frame);window.__CELLQUATION_NETWORK__={build:BUILD_ID,get level(){return level?.id},get counts(){return countSpecies()},get mode(){return runtime.mode},get action(){return active?.action.stage||localAction?.kind||null},get quality(){return runtime.quality},get metrics(){return metricsSnapshot()}};window.__CQ_READY__=true;
}
window.addEventListener('error',e=>{errorBox.style.display='block';errorBox.textContent=String(e.error?.stack||e.message||e)});window.addEventListener('unhandledrejection',e=>{errorBox.style.display='block';errorBox.textContent=String(e.reason?.stack||e.reason||e)});init().catch(e=>{errorBox.style.display='block';errorBox.textContent=String(e.stack||e)});
