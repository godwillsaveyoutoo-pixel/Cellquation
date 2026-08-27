import {
  paletteForSpecies,FUSION_VISUAL_DEFAULTS,SPLIT_VISUAL_DEFAULTS,BROOD_VISUAL_DEFAULTS,DESTRUCT_VISUAL_DEFAULTS,SWITCH_VISUAL_DEFAULTS,MIMIC_VISUAL_DEFAULTS,DESTRUCT_NUCLEUS_COLORS,
  CELL_TYPE_IDLE_IDENTITY_DEFAULTS,CELL_TYPE_MATERIAL_DEFAULTS,FUSION_SPLIT_TRANSITION_DEFAULTS,WORLD_DEFAULTS,cloneProfile
} from './cellkit_latest/profiles.js?v=0.12.3.4';
import {FusionSplitTransition,TransitionPhase,evaluateFusionSplitMechanics,lerp,smooth01} from './cellkit_latest/transition.js?v=0.12.3.2';
import {broodNucleusLocalPosition,broodNucleusRadius} from './cellkit_latest/brood.js?v=0.12.3.2';
import {CellRenderer} from './cellkit_latest/renderer.js?v=0.7.7a.2';
import {CellWorld} from './runtime/world_v0611.js?v=0.6.1.1';
import {loadProgress,recordCompletion} from './progress_v060.js?v=0.7.7a.6';
import {saveGameplayResume} from './resume_state_v076412.js?v=0.7.6.4.12';
import {applyVisualIdentityV062} from './visual_profiles_v062.js?v=0.7.3';
import {createAdaptiveMobilePerformance} from './runtime/mobile_performance_v0764.js?v=0.7.6.4';
const BUILD='Cellquation_Core_v0.7.7a.2_UNIFIED_WEBGL_BG_FLUORESCENCE';
const ACTION_SPEED=2.0;
const PORTRAIT_Y_STRETCH=1.20;
const canvas=document.getElementById('gl'),errorBox=document.getElementById('error'),debug=document.getElementById('debug'),hint=document.getElementById('hint'),selection=document.getElementById('selection');
const movesEl=document.getElementById('moves'),ratioEl=document.getElementById('ratioNow'),titleEl=document.getElementById('levelTitle'),metaEl=document.getElementById('levelMeta'),goalBlue=document.getElementById('goalBlue'),goalGreen=document.getElementById('goalGreen'),goalViolet=document.getElementById('goalViolet');
const resultBackdrop=document.getElementById('resultBackdrop'),resultTitle=document.getElementById('resultTitle'),starsEl=document.getElementById('stars'),resultSummary=document.getElementById('resultSummary'),bestSummary=document.getElementById('bestSummary'),continueBtn=document.getElementById('continue');

const fusionVisual=cloneProfile(FUSION_VISUAL_DEFAULTS),splitVisual=cloneProfile(SPLIT_VISUAL_DEFAULTS),broodVisual=cloneProfile(BROOD_VISUAL_DEFAULTS),destructVisual=cloneProfile(DESTRUCT_VISUAL_DEFAULTS),switchVisual=cloneProfile(SWITCH_VISUAL_DEFAULTS),mimicVisual=cloneProfile(MIMIC_VISUAL_DEFAULTS);
const idleProfiles=cloneProfile(CELL_TYPE_IDLE_IDENTITY_DEFAULTS),materialProfiles=cloneProfile(CELL_TYPE_MATERIAL_DEFAULTS),dynamics=cloneProfile(FUSION_SPLIT_TRANSITION_DEFAULTS),worldSettings=cloneProfile(WORLD_DEFAULTS);
// v0.6.1 production timing: preserve the authored curves, play action clocks at 2x.
broodVisual.broodDivisionDuration/=ACTION_SPEED;
switchVisual.swapDuration/=ACTION_SPEED;
destructVisual.destructDuration/=ACTION_SPEED;
mimicVisual.imitationDuration/=ACTION_SPEED;
Object.assign(worldSettings,{maxCells:16,fusionApproachMaxDuration:1.0,fusionApproachMinDuration:0.41,fusionApproachDistanceRate:0.88,fusionApproachEngagementDuration:0.24,fusionApproachMaxClosingSpeed:0.72,fusionApproachMaxAcceleration:1.10,fusionApproachCellMaxSpeed:0.40});
const TYPE_VISUALS={fusion:fusionVisual,split:splitVisual,brood:broodVisual,destruct:destructVisual,swap:switchVisual,imitate:mimicVisual};
applyVisualIdentityV062({materialProfiles,idleProfiles,visuals:TYPE_VISUALS});
const transition=new FusionSplitTransition(dynamics);transition.setPlaybackSpeed(ACTION_SPEED);
const world=new CellWorld({fusionVisual,splitVisual,broodVisual,destructVisual,switchVisual,mimicVisual,settings:worldSettings});world.setColorMode(3);
const renderer=new CellRenderer(canvas,errorBox);renderer.setIdleIdentity(idleProfiles);renderer.setMaterialProfiles(materialProfiles);
const mobilePerf=createAdaptiveMobilePerformance(renderer);
let campaign,progress,level,pendingDestruct=null,pendingImitate=null;
const runtime={index:0,mode:'loading',paused:false,moves:0,simTime:0,lastNow:performance.now(),goalHold:0};
let fpsFrames=0,fpsStamp=performance.now(),fps=0;
const MAX_DT=0.12,MAX_SUB=1/60,MAX_STEPS=4;

function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t}return a||1}
function counts(){let blue=0,green=0,violet=0;for(const c of world.cells){if(c.species==='blue')blue++;else if(c.species==='green')green++;else if(c.species==='violet')violet++}return {blue,green,violet}}
function gcd3(a,b,c){return gcd(gcd(a,b),c)}
function ratio(){const {blue,green,violet}=counts();if(!blue&&!green&&!violet)return '0:0:0';const g=gcd3(blue,green,violet);return `${blue/g}:${green/g}:${violet/g}`}
function goalReached(){const {blue,green,violet}=counts(),[a,b,c]=level.goal;return blue>0&&green>0&&violet>0&&blue*b===green*a&&blue*c===violet*a}
function isSettled(){return !world.isBusy}
function starsForMoves(n){return n<=level.min?3:n===level.min+1?2:1}
function syncHud(){
  movesEl.textContent=`${runtime.moves} ${runtime.moves===1?'MOVE':'MOVES'}`;ratioEl.textContent=`NOW ${ratio()}`;
  let text='';
  if(pendingDestruct)text='CHOOSE A CELL TO REMOVE';
  else if(pendingImitate)text='CHOOSE A CELL TO COPY';
  else if(world.selectedFusionCells.length===1)text='CHOOSE ANOTHER FUSION CELL';
  selection.textContent=text;selection.classList.toggle('on',!!text);
}
function syncChrome(){
  const w=campaign.worlds[level.world];titleEl.textContent=level.title.en.toUpperCase();metaEl.innerHTML=`<span>3 COLOURS · W${level.world+1}</span><span>${String(level.local+1).padStart(2,'0')}/${String(w?.count||6).padStart(2,'0')}</span>`;
  goalBlue.textContent=level.goal[0];goalGreen.textContent=level.goal[1];goalViolet.textContent=level.goal[2];hint.textContent=campaign.worlds[level.world]?.intro?.en||level.note?.en||'';resultTitle.textContent=level.title.en.toUpperCase();
  document.getElementById('levelsLink').href=`threecolor_foundations.html?world=${level.world+1}`;
}
function deterministicPositions(n){
  // Portrait-first composition: use the extra vertical field instead of compressing
  // every cell into a near-square cluster. Horizontal spacing remains unchanged.
  const patterns={
    1:[[0,0]],2:[[-.23,0],[.23,0]],3:[[0,.22],[-.23,-.16],[.23,-.16]],4:[[-.23,.20],[.23,.20],[-.23,-.20],[.23,-.20]],
    5:[[0,.28],[-.28,.08],[.28,.08],[-.18,-.25],[.18,-.25]],6:[[-.28,.25],[0,.25],[.28,.25],[-.28,-.20],[0,-.20],[.28,-.20]],
    7:[[0,.31],[-.30,.17],[.30,.17],[-.30,-.13],[.30,-.13],[-.14,-.34],[.14,-.34]]
  };
  const portrait=canvas.clientHeight>canvas.clientWidth;
  const yStretch=portrait?PORTRAIT_Y_STRETCH:1;
  const base=patterns[n]?patterns[n].map(p=>[...p]):Array.from({length:n},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/n;return [Math.cos(a)*.38,Math.sin(a)*.38]});
  return base.map(([x,y])=>[x,y*yStretch]);
}
function addSpec(spec,pos,i){
  const opts={species:spec.species,visualSeed:10.7+i*1.913,rotation:(i*.71)%6.28,physicsBlend:1};
  if(spec.role==='fusion')return world.addFusion(pos,[0,0],null,opts);
  if(spec.role==='split')return world.addSplit(pos,[0,0],opts.rotation,null,opts);
  if(spec.role==='brood')return world.addBrood(pos,[0,0],opts);
  if(spec.role==='destruct')return world.addDestruct(pos,[0,0],opts);
  if(spec.role==='swap')throw new Error('Swap is forbidden in three-colour mode');
  if(spec.role==='imitation')return world.addImitate(pos,[0,0],opts);
  throw new Error(`Unknown role ${spec.role}`);
}
function resetWorld(){
  world.cells.length=0;world.activeApproach=null;world.activeTransition=null;world.parallelFusions.length=0;world.parallelDivisions.length=0;world.activeBrood=null;world.activeDestruct=null;world.activeSwap=null;world.activeImitate=null;world.lastEvent=null;pendingDestruct=null;pendingImitate=null;
  const n=level.cells.length;renderer.setViewScale(n<=4?1.08:n<=6?1.22:1.34);renderer.resize();
  const pts=deterministicPositions(n);level.cells.forEach((s,i)=>addSpec(s,pts[i],i));world.syncBroodNuclei();
}
function syncResumeState(){saveGameplayResume({colour:'three',campaign:'threefoundations',campaignLabel:'Foundations',level,index:runtime.index})}
function startLevel(index){
  runtime.index=Math.max(0,Math.min(campaign.levels.length-1,index));level=campaign.levels[runtime.index];const url=new URL(location.href);url.searchParams.set('level',runtime.index+1);history.replaceState(null,'',url);syncResumeState();
  Object.assign(runtime,{mode:'playing',paused:false,moves:0,simTime:0,lastNow:performance.now(),goalHold:0});transition.cancel?.();resetWorld();syncChrome();syncHud();window.CellquationUI?.hideResult(resultBackdrop);window.CellquationUI?.setPaused(false);
}
function mixPalette(a,b,t){const u=Math.max(0,Math.min(1,t)),mix=(x,y)=>x.map((v,i)=>v+(y[i]-v)*u);return {deep:mix(a.deep,b.deep),mid:mix(a.mid,b.mid),bright:mix(a.bright,b.bright),glow:mix(a.glow,b.glow)}}
function swapRenderState(cell){
  if(cell.type!=='swap')return null;const p=world.getSwapProgress(cell),from=paletteForSpecies(cell.species),target=paletteForSpecies(cell.species==='green'?'blue':'green');
  if(p===null)return {palette:from,swap:{enabled:true,action:false,progress:0,targetColors:target,ringRadius:switchVisual.swapRingRadius,ringWidth:switchVisual.swapRingWidth,ringGlow:switchVisual.swapRingGlow,pulseSpeed:switchVisual.swapPulseSpeed}};
  const t=smooth01((p-.06)/.88);return {palette:mixPalette(from,target,t),swap:{enabled:true,action:true,progress:p,targetColors:target,ringRadius:switchVisual.swapRingRadius,ringWidth:switchVisual.swapRingWidth,ringGlow:switchVisual.swapRingGlow,pulseSpeed:switchVisual.swapPulseSpeed}};
}
function imitateRenderState(cell){
  if(cell.type!=='imitate')return null;const p=world.getImitateProgress(cell),base=paletteForSpecies(cell.species);if(p===null||!world.activeImitate||world.activeImitate.source!==cell)return {palette:base,glowBoost:1};
  const target=paletteForSpecies(world.activeImitate.toSpecies),t=smooth01((p-.18)/.68);return {palette:mixPalette(base,target,t),glowBoost:1+1.35*Math.sin(Math.PI*Math.min(1,p))};
}
function destructState(cell){const p=world.getDestructProgress(cell);if(p===null)return {active:false,p:0,scale:1,opacity:1};const collapse=smooth01((p-.06)/.94),fade=1-smooth01((p-.38)/.62);return {active:true,p,scale:Math.max(.06,1-.94*collapse),opacity:Math.max(0,fade)}}
function currentMaterialStyle(styleP){const a=materialProfiles.fusion,b=materialProfiles.split,t=smooth01(styleP),o={};for(const k of new Set([...Object.keys(a),...Object.keys(b)])){if(k==='enabled'){o[k]=(a.enabled||b.enabled)?1:0;continue}o[k]=lerp(Number(a[k]??0),Number(b[k]??0),t)}return o}
function currentVisualStyle(styleP){const late=smooth01((styleP-.72)/.28),general=smooth01(styleP),fluidT=dynamics.fluidReaction<=.0001?late:general,o={},fluid=new Set(['volumeDepth','densityContrast','fluidWarp','fluidSpeed','liquidLights','fineDetail']);for(const k of new Set([...Object.keys(fusionVisual),...Object.keys(splitVisual)])){if(['radius','nucleusRadius','nucleusSeparation'].includes(k))continue;const a=fusionVisual[k]??splitVisual[k]??0,b=splitVisual[k]??fusionVisual[k]??0;o[k]=lerp(a,b,fluid.has(k)?fluidT:general)}return o}
function renderBrood(t){
  for(const cell of world.cells){if(cell.type!=='brood')continue;const active=world.activeBrood?.cell===cell,colors=paletteForSpecies(cell.species),count=Math.max(1,cell.broodTargetCount??cell.liveBroodNuclei.length),nr=broodNucleusRadius(count,broodVisual);
    if(!active){for(let ni=0;ni<cell.broodNuclei.length;ni++){const n=cell.broodNuclei[ni],local=broodNucleusLocalPosition(n,t,cell.radius,broodVisual,count,ni),ds=destructState(cell),opacity=(n.retiring?(1-smooth01(n.retireAge??0)):smooth01(n.age??1))*ds.opacity;renderer.drawBroodNucleus({time:t,center:[cell.position[0]+local[0]*ds.scale,cell.position[1]+local[1]*ds.scale],radius:nr*ds.scale,parentCenter:cell.position,parentRadius:cell.radius*ds.scale,phase:n.visualSeed,opacity,clipInside:1,colors,glow:broodVisual.broodNucleusGlow})}continue}
    const st=world.getBroodActiveState();if(!st)continue;const {bud,timeline,mechanics}=st;
    for(const n of cell.broodNuclei){if(n.id===bud.nucleusId)continue;const fb=st.br.buds.find(b=>b.nucleusId===n.id),local=fb?.startLocal??[0,0];renderer.drawBroodNucleus({time:t,center:[cell.position[0]+local[0],cell.position[1]+local[1]],radius:nr,parentCenter:cell.position,parentRadius:cell.radius,phase:n.visualSeed,opacity:1,clipInside:1,colors,glow:broodVisual.broodNucleusGlow})}
    const mainSeed=cell.nuclei[0]?.visualSeed??cell.visualSeed,shapePhaseA=(cell.visualSeed*.731)%6.283,shapePhaseB=(bud.visualSeed*.731)%6.283,nucleusPhaseA=(mainSeed*.731)%6.283,nucleusPhaseB=(bud.nucleusSeed*.731)%6.283,q=timeline.wallLocal,c=Math.cos(-bud.rotation),s=Math.sin(-bud.rotation),target=[c*q[0]-s*q[1],s*q[0]+c*q[1]];
    renderer.drawBroodDivision({time:t,center:cell.position,angle:bud.rotation,parentRotation:cell.rotation||0,mechanics,fusionVisual,colors,shapePhaseA,shapePhaseB,nucleusPhaseA,nucleusPhaseB,broodStartLocal:target,smallNucleusRadius:bud.smallNucleusRadius,materialProfile:materialProfiles.brood,outerHaloStrength:0});
  }
}
function render(){const t=runtime.simTime;renderer.beginFrame();const bs=world.getBroodActiveState();for(const cell of world.cells){if(bs&&bs.br.cell===cell)continue;const base=TYPE_VISUALS[cell.type]||fusionVisual,ds=destructState(cell),visual=ds.active?{...base,radius:base.radius*ds.scale,nucleusRadius:base.nucleusRadius*ds.scale,nucleusSeparation:(base.nucleusSeparation??0)*ds.scale,nucleusGlow:(base.nucleusGlow??1)*(1+.55*smooth01(ds.p/.55)),nucleusPlasma:(base.nucleusPlasma??1)*(1+.35*smooth01(ds.p/.55))}:base,sw=swapRenderState(cell),im=imitateRenderState(cell),body=sw?.palette??im?.palette??paletteForSpecies(cell.species),nucleus=cell.type==='destruct'?DESTRUCT_NUCLEUS_COLORS:body,mimic=cell.type==='imitate'?{enabled:true,organelles:visual.mimicOrganelles,orbitRadius:visual.mimicOrbitRadius,size:visual.mimicSize,glow:(visual.mimicGlow??1)*(im?.glowBoost??1),pulseSpeed:visual.mimicPulseSpeed,prismShift:visual.mimicPrismShift}:null;renderer.drawCell({time:t,cell,visual,colors:body,nucleusColors:nucleus,opacity:ds.opacity,swap:sw?.swap??null,mimic,outerHaloStrength:0})}
  renderBrood(t);
  const jobs=[];if(world.activeTransition)jobs.push({tr:world.activeTransition,phase:world.activeTransition.kind==='fusion'?TransitionPhase.FUSING:TransitionPhase.DIVIDING,mechanics:world.activeTransition.currentMechanics});for(const j of world.parallelFusionTransitions)jobs.push({tr:j.tr,phase:TransitionPhase.FUSING,mechanics:j.tr?.currentMechanics});for(const j of world.parallelDivisionTransitions)jobs.push({tr:j.tr,phase:TransitionPhase.DIVIDING,mechanics:j.tr?.currentMechanics});
  for(const j of jobs){if(!j.tr||!j.mechanics)continue;renderer.drawTransition({time:t,transition:j.tr,mechanics:j.mechanics,fusionVisual,splitVisual,style:currentVisualStyle(j.mechanics.styleP),colors:paletteForSpecies(j.tr.species),sourceColors:{a:paletteForSpecies(j.tr.speciesA??j.tr.species),b:paletteForSpecies(j.tr.speciesB??j.tr.species),hetero:Boolean(j.tr.hetero)},phase:j.phase,opacity:1,materialProfile:currentMaterialStyle(j.mechanics.styleP),outerHaloStrength:0})}
  renderer.endFrame();if(world.activeTransition?.justStarted)world.activeTransition.justStarted=false;for(const j of world.parallelFusionTransitions)if(j.tr?.justStarted)j.tr.justStarted=false;for(const j of world.parallelDivisionTransitions)if(j.tr?.justStarted)j.tr.justStarted=false;
}
function handleEvent(){const e=world.consumeEvent();if(!e)return;syncHud()}
function finalizePrimaryTransition(now){
  const tr=world.activeTransition;if(!tr||tr.justStarted||transition.getRaw()<1)return false;
  const phase=tr.kind==='fusion'?TransitionPhase.FUSING:TransitionPhase.DIVIDING;
  const finalMechanics=evaluateFusionSplitMechanics({raw:1,phase,fusionVisual,splitVisual,dynamics,startPairSep:tr.startPairSep});
  world.recordTransitionMechanics(finalMechanics);
  if(!world.isTransitionHandoffClear(finalMechanics))return false;
  if(tr.kind==='fusion')world.completeFusion(transition,finalMechanics,now);else world.completeDivision(transition,finalMechanics,now);
  syncHud();return true;
}
function step(dt){if(runtime.paused)return;const next=runtime.simTime+dt;if(world.activeTransition&&!world.activeTransition.justStarted){transition.step(dt);const tr=world.activeTransition,phase=tr.kind==='fusion'?TransitionPhase.FUSING:TransitionPhase.DIVIDING;world.recordTransitionMechanics(evaluateFusionSplitMechanics({raw:transition.getRaw(),phase,fusionVisual,splitVisual,dynamics,startPairSep:tr.startPairSep}))}const bounds=renderer.getWorldBounds();world.update(dt,bounds,next*1000,transition);finalizePrimaryTransition(next*1000);runtime.simTime=next;handleEvent();if(runtime.mode==='playing'&&isSettled()&&goalReached()){runtime.goalHold=0;completeLevel()}else runtime.goalHold=0}
function completeLevel(){if(runtime.mode==='complete')return;runtime.mode='complete';const stars=starsForMoves(runtime.moves);progress=recordCompletion('threefoundations',progress,{levelId:level.id,levelIndex:runtime.index,moves:runtime.moves,stars,levelCount:campaign.levels.length});starsEl.textContent='★'.repeat(stars)+'☆'.repeat(3-stars);starsEl.setAttribute('aria-label',`${stars} of 3 stars`);resultSummary.textContent=`${runtime.moves} ${runtime.moves===1?'MOVE':'MOVES'} · OPTIMAL ${level.min}`;const best=progress.best[level.id];bestSummary.textContent=`BEST ${best.moves} MOVES · ${best.stars}/3 ★`;continueBtn.textContent=runtime.index<campaign.levels.length-1?'NEXT LEVEL':'CAMPAIGN COMPLETE';window.CellquationUI?.showResult(resultBackdrop,continueBtn)}
function togglePause(){if(runtime.mode==='complete')return;runtime.paused=!runtime.paused;runtime.lastNow=performance.now();window.CellquationUI?.setPaused(runtime.paused)}
function nextLevel(){if(runtime.index<campaign.levels.length-1)startLevel(runtime.index+1);else location.href='threecolor_foundations.html'}
function cancelPending(){if(pendingDestruct)pendingDestruct.setSelected(false);if(pendingImitate)pendingImitate.setSelected(false);pendingDestruct=pendingImitate=null;world.clearSelection();syncHud()}
function pointerAction(ev){ev.preventDefault();if(runtime.mode!=='playing'||runtime.paused)return;const [x,y]=renderer.screenToWorld(ev.clientX,ev.clientY),cell=world.findCellAt(x,y);
  if(pendingImitate){const src=pendingImitate;if(!cell||cell===src||cell.type==='imitate'||cell.species!==src.species){hint.textContent='Imitation copies a role from a cell of the same colour.';cancelPending();return}src.setSelected(false);pendingImitate=null;if(world.beginImitation(src,cell)){runtime.moves++;hint.textContent=`Imitation copies the ${cell.type} role and keeps its colour.`}syncHud();return}
  if(pendingDestruct){const src=pendingDestruct;if(!cell||cell===src){cancelPending();return}src.setSelected(false);pendingDestruct=null;if(world.beginDestruction(src,cell)){runtime.moves++;hint.textContent='Destruct removes itself and the chosen cell.'}syncHud();return}
  if(!cell){cancelPending();return}
  if(cell.type==='swap'){hint.textContent='Swap is not available in three-colour mode.';return}
  if(cell.type==='destruct'){if(world.isBusy)return;world.clearSelection();pendingDestruct=cell;cell.setSelected(true);syncHud();return}
  if(cell.type==='brood'){if(world.isBusy)return;if(world.cells.length+world.cells.filter(c=>c.species===cell.species).length>16){hint.textContent='Not enough room for this Brood activation.';return}world.clearSelection();if(world.beginBrooding(cell,runtime.simTime)){runtime.moves++;hint.textContent='Brood births happen serially.'}syncHud();return}
  if(cell.type==='imitate'){if(world.isBusy)return;if(!world.cells.some(c=>c!==cell&&c.type!=='imitate'&&c.species===cell.species)){hint.textContent='Imitation needs another cell of the same colour.';return}world.clearSelection();pendingImitate=cell;cell.setSelected(true);syncHud();return}
  if(cell.type==='split'){if(!world.canStartDivision||cell.state!=='idle'||world.cells.length>=16)return;world.clearSelection();if(world.beginDivision(cell,transition,runtime.simTime*1000)){runtime.moves++;syncHud()}return}
  if(cell.type!=='fusion'||cell.state!=='idle'||!world.canStartFusion)return;
  if(cell.selected){cell.setSelected(false);syncHud();return}if(world.selectedFusionCells.length>=2)world.clearSelection();cell.setSelected(true);const selected=world.selectedFusionCells;if(selected.length===2){const [a,b]=selected;world.clearSelection();if(world.beginFusion(a,b,transition,runtime.simTime*1000)){runtime.moves++;hint.textContent=a.species===b.species?'Same-colour Fusion.':'Mixed Fusion creates the third colour.'}syncHud()}else syncHud();
}
function updateDebug(now){if(debug.classList.contains('off')){fpsFrames=0;fpsStamp=now;return}fpsFrames++;if(now-fpsStamp>.75*1000){fps=fpsFrames*1000/(now-fpsStamp);fpsFrames=0;fpsStamp=now;debug.innerHTML=`<strong>${fps.toFixed(0)} FPS</strong><br/>${world.cells.length} cells<br/>perf ${mobilePerf.state.tier} · edge ${mobilePerf.state.pixelRatioCap.toFixed(2)}x · detail ${Math.round(mobilePerf.state.renderDetail*100)}% · jank ${Math.round((mobilePerf.state.jank||0)*100)}%<br/>${level?.id||''}`}}
function frame(now){mobilePerf.observe(now,world.isBusy);let dt=Math.max(0,Math.min(MAX_DT,(now-runtime.lastNow)/1000));runtime.lastNow=now;if(!runtime.paused&&dt>0){const steps=Math.min(MAX_STEPS,Math.max(1,Math.ceil(dt/MAX_SUB))),s=dt/steps;for(let i=0;i<steps;i++)step(s)}render();updateDebug(now);requestAnimationFrame(frame)}

async function init(){campaign=await fetch('./content/threecolor/FOUNDATIONS_FULL_30_V071.json').then(r=>r.json());progress=loadProgress('threefoundations',campaign);const q=Number(new URL(location.href).searchParams.get('level')||1)-1,start=Number.isFinite(q)?Math.max(0,Math.min(q,campaign.levels.length-1)):0;startLevel(start);canvas.addEventListener('pointerup',pointerAction,{passive:false});document.getElementById('restart').onclick=()=>startLevel(runtime.index);document.getElementById('pause').onclick=togglePause;document.getElementById('replay').onclick=()=>startLevel(runtime.index);continueBtn.onclick=nextLevel;document.getElementById('debugToggle').onclick=()=>debug.classList.toggle('off');document.addEventListener('visibilitychange',()=>{if(document.hidden){runtime.paused=true;window.CellquationUI?.setPaused(true)}runtime.lastNow=performance.now()});requestAnimationFrame(frame);window.__CELLQUATION_FOUNDATIONS__={build:BUILD,get level(){return level?.id},get counts(){return counts()},get mode(){return runtime.mode}}}
window.addEventListener('error',e=>{errorBox.style.display='block';errorBox.textContent=String(e.error?.stack||e.message||e)});window.addEventListener('unhandledrejection',e=>{errorBox.style.display='block';errorBox.textContent=String(e.reason?.stack||e.reason||e)});init().catch(e=>{errorBox.style.display='block';errorBox.textContent=e.stack||String(e)});
