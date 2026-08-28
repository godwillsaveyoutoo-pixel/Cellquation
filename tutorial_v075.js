import {
  paletteForSpecies,FUSION_VISUAL_DEFAULTS,SPLIT_VISUAL_DEFAULTS,BROOD_VISUAL_DEFAULTS,DESTRUCT_VISUAL_DEFAULTS,SWITCH_VISUAL_DEFAULTS,MIMIC_VISUAL_DEFAULTS,DESTRUCT_NUCLEUS_COLORS,
  CELL_TYPE_IDLE_IDENTITY_DEFAULTS,CELL_TYPE_MATERIAL_DEFAULTS,FUSION_SPLIT_TRANSITION_DEFAULTS,WORLD_DEFAULTS,cloneProfile
} from './cellkit_latest/profiles.js?v=0.12.3.4';
import {FusionSplitTransition,TransitionPhase,evaluateFusionSplitMechanics,lerp,smooth01} from './cellkit_latest/transition.js?v=0.12.3.2';
import {broodNucleusLocalPosition,broodNucleusRadius} from './cellkit_latest/brood.js?v=0.12.3.2';
import {CellRenderer} from './cellkit_latest/renderer.js?v=0.7.7a.13';
import {CellWorld} from './runtime/world_v0611.js?v=0.6.1.1';
import {applyVisualIdentityV062} from './visual_profiles_v062.js?v=0.7.3';
import {createAdaptiveMobilePerformance} from './runtime/mobile_performance_v0764.js?v=0.7.6.4';

const ACTION_SPEED=2.0;
const q=new URL(location.href).searchParams;
let mode=q.get('mode')||'2f';
if(mode==='2n'){ location.replace('living.html'); throw new Error('Network tutorial removed'); }
if(mode==='3n'){ location.replace('threecolor_living.html'); throw new Error('Network tutorial removed'); }
if(mode!=='2f'&&mode!=='3f') mode='2f';
const three=mode==='3f';

const STEPS_2=[
  {title:'Fusion becomes Split',text:'Tap both glowing Blue Fusion cells. They move together and fuse with the same animation as in the game. The result is one Blue Split cell.',label:'TAP BOTH FUSION CELLS',kind:'fusion',specs:[['fusion','blue',-.29,.03],['fusion','blue',.29,.03]]},
  {title:'Split becomes two Fusion cells',text:'Tap the glowing Green Split cell. It divides into two Green Fusion cells using the real split animation.',label:'TAP THE SPLIT CELL',kind:'split',specs:[['split','green',0,0]]},
  {title:'Swap changes colour — then becomes Fusion',text:'Tap the Blue Swap cell. It changes to Green during the real Swap animation. When the action is finished, it is a Green Fusion cell — not another Swap cell.',label:'TAP THE BLUE SWAP CELL',kind:'swap',specs:[['swap','blue',0,0]]},
  {title:'Brood counts its own colour',text:'There are three Green cells here: the Brood cell plus two other Green cells. Tap Brood. It therefore births three new Green Fusion cells, one after another, and the parent itself becomes Fusion.',label:'3 GREEN CELLS → 3 BIRTHS',kind:'brood',specs:[['brood','green',0,.24],['fusion','green',-.43,-.25],['split','green',.43,-.25],['fusion','blue',0,-.48]]},
  {title:'Destruct removes two cells',text:'First tap the glowing Destruct cell. Then tap the marked target. The real Destruct action removes the chosen cell and the Destruct cell itself.',label:'DESTRUCT → CHOOSE TARGET',kind:'destruct',specs:[['destruct','blue',-.28,0],['split','green',.28,0],['fusion','blue',0,.38]]},
  {title:'Imitation copies role and colour',text:'First tap the Blue Imitation cell, then the Green Split cell. In 2 Colour Foundations, Imitation copies both the target role and its colour. The source becomes a Green Split cell; the target stays where it is.',label:'IMITATION → CHOOSE TARGET',kind:'imitate2',specs:[['imitate','blue',-.29,0],['split','green',.29,0],['fusion','blue',0,.38]]}
];
const STEPS_3=[
  {title:'Mixed Fusion creates the third colour',text:'Tap the Blue Fusion cell and the Green Fusion cell. They fuse with the real game animation and become one Violet Split cell.',label:'BLUE + GREEN → VIOLET',kind:'fusion',specs:[['fusion','blue',-.29,.03],['fusion','green',.29,.03]]},
  {title:'Same-colour Fusion stays that colour',text:'Tap both Violet Fusion cells. Violet + Violet becomes one Violet Split cell.',label:'VIOLET + VIOLET',kind:'fusion',specs:[['fusion','violet',-.29,.03],['fusion','violet',.29,.03]]},
  {title:'Split works the same way',text:'Tap the Violet Split cell. It divides into two Violet Fusion cells with the same split animation used in the game.',label:'TAP THE VIOLET SPLIT',kind:'split',specs:[['split','violet',0,0]]},
  {title:'Brood still counts its own colour',text:'There are three Violet cells here: the Brood cell plus two other Violet cells. Tap Brood. It births three Violet Fusion cells serially, then the parent becomes Fusion.',label:'3 VIOLET CELLS → 3 BIRTHS',kind:'brood',specs:[['brood','violet',0,.24],['fusion','violet',-.43,-.25],['split','violet',.43,-.25],['fusion','green',0,-.48]]},
  {title:'Destruct removes itself and its target',text:'Tap the Violet Destruct cell, then the marked Green target. Both are removed by the real Destruct animation.',label:'DESTRUCT → CHOOSE TARGET',kind:'destruct',specs:[['destruct','violet',-.28,0],['split','green',.28,0],['fusion','blue',0,.38]]},
  {title:'Imitation copies a same-colour role',text:'In 3 Colour, Imitation may copy only a non-Imitation cell of the same colour. Tap the Violet Imitation cell, then the Violet Split cell. It stays Violet and becomes Split. There is no Swap cell in 3 Colour.',label:'IMITATION → SAME COLOUR TARGET',kind:'imitate3',specs:[['imitate','violet',-.31,0],['split','violet',.31,0],['split','green',0,.40]]}
];
const steps=three?STEPS_3:STEPS_2;

const $=id=>document.getElementById(id);
const back=$('back'),eyebrow=$('eyebrow'),title=$('title'),panel=$('panel'),demo=$('demo'),canvas=$('tutorialGl'),sceneLabel=$('sceneLabel'),stepcount=$('stepcount'),stepTitle=$('stepTitle'),stepText=$('stepText'),tryHint=$('tryHint'),prev=$('prev'),next=$('next'),errorBox=$('error');
back.href=three?'index.html?mode=3':'index.html?mode=2';
eyebrow.textContent=three?'3 COLOUR · FOUNDATIONS TUTORIAL':'2 COLOUR · FOUNDATIONS TUTORIAL';
title.textContent='FOUNDATIONS';
if(three)panel.classList.add('three');

const fusionVisual=cloneProfile(FUSION_VISUAL_DEFAULTS),splitVisual=cloneProfile(SPLIT_VISUAL_DEFAULTS),broodVisual=cloneProfile(BROOD_VISUAL_DEFAULTS),destructVisual=cloneProfile(DESTRUCT_VISUAL_DEFAULTS),switchVisual=cloneProfile(SWITCH_VISUAL_DEFAULTS),mimicVisual=cloneProfile(MIMIC_VISUAL_DEFAULTS);
const idleProfiles=cloneProfile(CELL_TYPE_IDLE_IDENTITY_DEFAULTS),materialProfiles=cloneProfile(CELL_TYPE_MATERIAL_DEFAULTS),dynamics=cloneProfile(FUSION_SPLIT_TRANSITION_DEFAULTS),worldSettings=cloneProfile(WORLD_DEFAULTS);
broodVisual.broodDivisionDuration/=ACTION_SPEED;
switchVisual.swapDuration/=ACTION_SPEED;
destructVisual.destructDuration/=ACTION_SPEED;
mimicVisual.imitationDuration/=ACTION_SPEED;
Object.assign(worldSettings,{maxCells:16,fusionApproachMaxDuration:1.0,fusionApproachMinDuration:0.41,fusionApproachDistanceRate:0.88,fusionApproachEngagementDuration:0.24,fusionApproachMaxClosingSpeed:0.72,fusionApproachMaxAcceleration:1.10,fusionApproachCellMaxSpeed:0.40,driftSpeed:0.004});
const TYPE_VISUALS={fusion:fusionVisual,split:splitVisual,brood:broodVisual,destruct:destructVisual,swap:switchVisual,imitate:mimicVisual};
applyVisualIdentityV062({materialProfiles,idleProfiles,visuals:TYPE_VISUALS});
const transition=new FusionSplitTransition(dynamics);transition.setPlaybackSpeed(ACTION_SPEED);
const world=new CellWorld({fusionVisual,splitVisual,broodVisual,destructVisual,switchVisual,mimicVisual,settings:worldSettings});
world.setColorMode(three?3:2);
const renderer=new CellRenderer(canvas,errorBox);renderer.setIdleIdentity(idleProfiles);renderer.setMaterialProfiles(materialProfiles);renderer.setPixelRatioCap(1.0);renderer.setViewScale(1.28);
const mobilePerf=createAdaptiveMobilePerformance(renderer);

let stepIndex=0,slots=[],pending=null,actionStarted=false,completed=false,settledSince=null;
const runtime={simTime:0,lastNow:performance.now()};
const MAX_DT=0.12,MAX_SUB=1/60,MAX_STEPS=4;

function addSpec([type,species,x,y],i){
  const opts={species,visualSeed:5.7+i*2.173,rotation:(i*.73)%6.28,physicsBlend:1};
  if(type==='fusion')return world.addFusion([x,y],[0,0],null,opts);
  if(type==='split')return world.addSplit([x,y],[0,0],opts.rotation,null,opts);
  if(type==='brood')return world.addBrood([x,y],[0,0],opts);
  if(type==='destruct')return world.addDestruct([x,y],[0,0],opts);
  if(type==='swap')return world.addSwap([x,y],[0,0],opts);
  if(type==='imitate')return world.addImitate([x,y],[0,0],opts);
  throw new Error(`Unknown tutorial cell type: ${type}`);
}
function resetWorld(){
  transition.cancel?.();
  world.cells.length=0;world.activeApproach=null;world.activeTransition=null;world.parallelFusions.length=0;world.parallelDivisions.length=0;world.activeBrood=null;world.activeDestruct=null;world.activeSwap=null;world.activeImitate=null;world.lastEvent=null;world.clearSelection();
  pending=null;actionStarted=false;completed=false;settledSince=null;
  slots=steps[stepIndex].specs.map(addSpec);world.syncBroodNuclei();renderer.resize();
}
function currentGuideCell(){
  const k=steps[stepIndex].kind;
  if(completed||actionStarted)return null;
  if(k==='fusion'){const sel=world.selectedFusionCells[0];return !sel?slots[0]:(sel===slots[0]?slots[1]:slots[0]);}
  if(k==='destruct') return pending==='destruct'?slots[1]:slots[0];
  if(k==='imitate2'||k==='imitate3') return pending==='imitate'?slots[1]:slots[0];
  return slots[0]||null;
}
function renderStep(){
  const s=steps[stepIndex];stepcount.textContent=`${stepIndex+1} / ${steps.length}`;stepTitle.textContent=s.title;stepText.textContent=s.text;sceneLabel.textContent=s.label;
  prev.disabled=stepIndex===0;prev.style.opacity=stepIndex===0?'.38':'1';next.disabled=true;next.textContent='TRY IT';tryHint.textContent='TRY THE ACTION ABOVE';demo.classList.remove('done');resetWorld();
}
function markComplete(){
  if(completed)return;completed=true;demo.classList.add('done');tryHint.textContent='GOOD — THAT WAS THE REAL GAME ACTION';next.disabled=false;next.textContent=stepIndex===steps.length-1?'PLAY FIRST LEVEL':'NEXT';
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
    renderer.drawBroodDivision({time:t,center:cell.position,angle:bud.rotation,parentRotation:cell.rotation||0,mechanics,fusionVisual,colors,shapePhaseA,shapePhaseB,nucleusPhaseA,nucleusPhaseB,broodStartLocal:target,smallNucleusRadius:bud.smallNucleusRadius,materialProfile:materialProfiles.brood});
  }
}
function render(){
  const t=runtime.simTime;renderer.beginFrame();const bs=world.getBroodActiveState();
  for(const cell of world.cells){if(bs&&bs.br.cell===cell)continue;const base=TYPE_VISUALS[cell.type]||fusionVisual,ds=destructState(cell),visual=ds.active?{...base,radius:base.radius*ds.scale,nucleusRadius:base.nucleusRadius*ds.scale,nucleusSeparation:(base.nucleusSeparation??0)*ds.scale,nucleusGlow:(base.nucleusGlow??1)*(1+.55*smooth01(ds.p/.55)),nucleusPlasma:(base.nucleusPlasma??1)*(1+.35*smooth01(ds.p/.55))}:base,sw=swapRenderState(cell),im=imitateRenderState(cell),body=sw?.palette??im?.palette??paletteForSpecies(cell.species),nucleus=cell.type==='destruct'?DESTRUCT_NUCLEUS_COLORS:body,mimic=cell.type==='imitate'?{enabled:true,organelles:visual.mimicOrganelles,orbitRadius:visual.mimicOrbitRadius,size:visual.mimicSize,glow:(visual.mimicGlow??1)*(im?.glowBoost??1),pulseSpeed:visual.mimicPulseSpeed,prismShift:visual.mimicPrismShift}:null;renderer.drawCell({time:t,cell,visual,colors:body,nucleusColors:nucleus,opacity:ds.opacity,swap:sw?.swap??null,mimic})}
  renderBrood(t);
  const jobs=[];if(world.activeTransition)jobs.push({tr:world.activeTransition,phase:world.activeTransition.kind==='fusion'?TransitionPhase.FUSING:TransitionPhase.DIVIDING,mechanics:world.activeTransition.currentMechanics});for(const j of world.parallelFusionTransitions)jobs.push({tr:j.tr,phase:TransitionPhase.FUSING,mechanics:j.tr?.currentMechanics});for(const j of world.parallelDivisionTransitions)jobs.push({tr:j.tr,phase:TransitionPhase.DIVIDING,mechanics:j.tr?.currentMechanics});
  for(const j of jobs){if(!j.tr||!j.mechanics)continue;renderer.drawTransition({time:t,transition:j.tr,mechanics:j.mechanics,fusionVisual,splitVisual,style:currentVisualStyle(j.mechanics.styleP),colors:paletteForSpecies(j.tr.species),sourceColors:{a:paletteForSpecies(j.tr.speciesA??j.tr.species),b:paletteForSpecies(j.tr.speciesB??j.tr.species),hetero:Boolean(j.tr.hetero)},phase:j.phase,opacity:1,materialProfile:currentMaterialStyle(j.mechanics.styleP)})}
  renderer.endFrame();if(world.activeTransition?.justStarted)world.activeTransition.justStarted=false;for(const j of world.parallelFusionTransitions)if(j.tr?.justStarted)j.tr.justStarted=false;for(const j of world.parallelDivisionTransitions)if(j.tr?.justStarted)j.tr.justStarted=false;
}
function finalizePrimaryTransition(now){
  const tr=world.activeTransition;if(!tr||tr.justStarted||transition.getRaw()<1)return false;const phase=tr.kind==='fusion'?TransitionPhase.FUSING:TransitionPhase.DIVIDING;const finalMechanics=evaluateFusionSplitMechanics({raw:1,phase,fusionVisual,splitVisual,dynamics,startPairSep:tr.startPairSep});world.recordTransitionMechanics(finalMechanics);if(!world.isTransitionHandoffClear(finalMechanics))return false;if(tr.kind==='fusion')world.completeFusion(transition,finalMechanics,now);else world.completeDivision(transition,finalMechanics,now);return true;
}
function resultCorrect(){
  const k=steps[stepIndex].kind;
  if(k==='fusion'){const c=world.cells.find(c=>c.type==='split');if(!c)return false;if(three&&stepIndex===0)return c.species==='violet';return true}
  if(k==='split')return world.cells.filter(c=>c.type==='fusion').length===2;
  if(k==='swap')return world.cells.length===1&&world.cells[0].type==='fusion'&&world.cells[0].species==='green';
  if(k==='brood'){const species=three?'violet':'green';return world.cells.filter(c=>c.species===species).length===6&&world.cells.every(c=>c.type!=='brood')}
  if(k==='destruct')return world.cells.length===1&&world.cells[0]===slots[2];
  if(k==='imitate2')return slots[0]?.type==='split'&&slots[0]?.species==='green'&&world.cells.includes(slots[0])&&world.cells.includes(slots[1]);
  if(k==='imitate3')return slots[0]?.type==='split'&&slots[0]?.species==='violet'&&world.cells.includes(slots[0])&&world.cells.includes(slots[1]);
  return false;
}
function stepSim(dt){
  const nextTime=runtime.simTime+dt;if(world.activeTransition&&!world.activeTransition.justStarted){transition.step(dt);const tr=world.activeTransition,phase=tr.kind==='fusion'?TransitionPhase.FUSING:TransitionPhase.DIVIDING;world.recordTransitionMechanics(evaluateFusionSplitMechanics({raw:transition.getRaw(),phase,fusionVisual,splitVisual,dynamics,startPairSep:tr.startPairSep}))}
  const bounds=renderer.getWorldBounds();world.update(dt,bounds,nextTime*1000,transition);finalizePrimaryTransition(nextTime*1000);runtime.simTime=nextTime;world.consumeEvent();
  if(actionStarted&&!completed&&!world.isBusy&&resultCorrect()){if(settledSince===null)settledSince=runtime.simTime;if(runtime.simTime-settledSince>.22)markComplete()}else if(!completed)settledSince=null;
}
function isCell(cell,slot){return Boolean(cell&&slot&&cell===slot&&world.cells.includes(cell))}
function miss(){tryHint.textContent='USE THE GLOWING CELL';}
function pointerAction(ev){
  ev.preventDefault();if(completed||actionStarted)return;const [x,y]=renderer.screenToWorld(ev.clientX,ev.clientY),cell=world.findCellAt(x,y),k=steps[stepIndex].kind;
  if(!cell){miss();return}
  if(k==='fusion'){
    if(!isCell(cell,slots[0])&&!isCell(cell,slots[1])){miss();return}
    if(cell.selected){cell.setSelected(false);tryHint.textContent='TRY THE ACTION ABOVE';return}
    if(world.selectedFusionCells.length===0){cell.setSelected(true);tryHint.textContent='NOW TAP THE OTHER FUSION CELL';return}
    const a=world.selectedFusionCells[0],b=cell;if(a===b)return;world.clearSelection();if(world.beginFusion(a,b,transition,runtime.simTime*1000)){actionStarted=true;tryHint.textContent='FUSION IN PROGRESS…'}return;
  }
  if(k==='split'){
    if(!isCell(cell,slots[0])){miss();return}if(world.beginDivision(cell,transition,runtime.simTime*1000)){actionStarted=true;tryHint.textContent='SPLITTING…'}return;
  }
  if(k==='swap'){
    if(!isCell(cell,slots[0])){miss();return}if(world.beginSwap(cell)){actionStarted=true;tryHint.textContent='COLOUR SHIFT IN PROGRESS…'}return;
  }
  if(k==='brood'){
    if(!isCell(cell,slots[0])){miss();return}if(world.beginBrooding(cell,runtime.simTime)){actionStarted=true;tryHint.textContent='BIRTHS HAPPEN ONE BY ONE…'}return;
  }
  if(k==='destruct'){
    if(pending!=='destruct'){if(!isCell(cell,slots[0])){miss();return}world.clearSelection();cell.setSelected(true);pending='destruct';tryHint.textContent='NOW TAP THE MARKED TARGET';return}
    if(!isCell(cell,slots[1])){tryHint.textContent='CHOOSE THE MARKED TARGET';return}slots[0].setSelected(false);pending=null;if(world.beginDestruction(slots[0],slots[1])){actionStarted=true;tryHint.textContent='BOTH CELLS ARE BEING REMOVED…'}return;
  }
  if(k==='imitate2'||k==='imitate3'){
    if(pending!=='imitate'){if(!isCell(cell,slots[0])){miss();return}world.clearSelection();cell.setSelected(true);pending='imitate';tryHint.textContent=k==='imitate3'?'NOW TAP THE VIOLET TARGET':'NOW TAP THE GREEN TARGET';return}
    if(!isCell(cell,slots[1])){tryHint.textContent=k==='imitate3'?'IMITATION NEEDS THE MARKED SAME-COLOUR TARGET':'CHOOSE THE MARKED TARGET';return}slots[0].setSelected(false);pending=null;if(world.beginImitation(slots[0],slots[1])){actionStarted=true;tryHint.textContent='IMITATION IN PROGRESS…'}return;
  }
}
function frame(now){
  mobilePerf.observe(now,world.isBusy||actionStarted&&!completed);
  let dt=Math.max(0,Math.min(MAX_DT,(now-runtime.lastNow)/1000));runtime.lastNow=now;if(dt>0){const n=Math.min(MAX_STEPS,Math.max(1,Math.ceil(dt/MAX_SUB))),s=dt/n;for(let i=0;i<n;i++)stepSim(s)}render();requestAnimationFrame(frame);
}

demo.addEventListener('pointerup',pointerAction,{passive:false});
demo.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!completed){e.preventDefault();const c=currentGuideCell();if(!c)return;const r=canvas.getBoundingClientRect(),fit=Math.min(r.width,r.height),vs=renderer.viewScale||1.28;pointerAction({preventDefault(){},clientX:r.left+r.width/2+(c.position[0]/vs)*fit,clientY:r.top+r.height/2-(c.position[1]/vs)*fit})}});
prev.onclick=()=>{if(stepIndex>0){stepIndex--;renderStep()}};
next.onclick=()=>{if(!completed)return;if(stepIndex<steps.length-1){stepIndex++;renderStep()}else location.href=three?'threecolor_play.html?level=1':'play.html?level=1'};
window.addEventListener('error',e=>{errorBox.style.display='block';errorBox.textContent=String(e.error?.stack||e.message||e)});
window.addEventListener('unhandledrejection',e=>{errorBox.style.display='block';errorBox.textContent=String(e.reason?.stack||e.reason||e)});
renderStep();requestAnimationFrame(frame);
window.__CELLQUATION_TUTORIAL__={build:'v0.7.6.4.12-production-tutorial',mode,get step(){return stepIndex},get world(){return world},get completed(){return completed}};
