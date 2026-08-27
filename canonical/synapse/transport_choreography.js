import {clamp,mix,smootherstep} from './math2d.js?v=synapse0.8.7';

export const TRANSPORT_STAGES=Object.freeze(['idle','intake','compression','transit','egress','fusion','recovery','done']);

export const TRANSPORT_DEFAULTS=Object.freeze({
  // Geometry / action response
  transportScale:0.40,
  exitRetraction:0.160,
  egressScale:0.48,
  fusionTakeover:0.80,
  fusionGrowEnd:0.56,
  mouthAction:0.44,

  // Timing & choreography. These are deliberately separated from geometry so
  // the user can tune rhythm without breaking positional continuity.
  globalSpeed:1.00,
  intakeDuration:0.78,
  compressionDuration:0.52,
  transitDuration:0.88,
  egressDuration:0.64,
  recoveryDuration:0.22,
  shrinkStart:0.18,
  egressVisibleStart:0.03,
  synapseReturnStart:0.26,
});

export const TIMING_KEYS=Object.freeze([
  'globalSpeed','intakeDuration','compressionDuration','transitDuration','egressDuration',
  'fusionDuration','recoveryDuration','fusionTakeover','fusionGrowEnd','shrinkStart',
  'egressVisibleStart','synapseReturnStart',
]);

export function sanitizeTransportSettings(settings){
  settings.globalSpeed=clamp(Number(settings.globalSpeed)||1,.55,1.60);
  settings.intakeDuration=clamp(Number(settings.intakeDuration)||.78,.30,1.80);
  settings.compressionDuration=clamp(Number(settings.compressionDuration)||.52,.22,1.30);
  settings.transitDuration=clamp(Number(settings.transitDuration)||.88,.40,2.40);
  settings.egressDuration=clamp(Number(settings.egressDuration)||.64,.34,1.60);
  settings.fusionDuration=Math.max(1.5,clamp(Number(settings.fusionDuration)||1.5,1.5,4.0));
  settings.recoveryDuration=clamp(Number(settings.recoveryDuration)||.22,.10,1.20);
  settings.shrinkStart=clamp(Number(settings.shrinkStart)||.18,.02,.68);
  settings.egressVisibleStart=clamp(Number(settings.egressVisibleStart)||.03,0,.34);
  // Keep enough egress time after the first visible frame to avoid a pop at takeover.
  settings.fusionTakeover=clamp(Number(settings.fusionTakeover)||.80,Math.max(.54,settings.egressVisibleStart+.24),.96);
  settings.fusionGrowEnd=clamp(Number(settings.fusionGrowEnd)||.56,.38,.90);
  settings.synapseReturnStart=clamp(Number(settings.synapseReturnStart)||.26,.06,.68);
  return settings;
}

function timingSnapshot(settings){
  const safe=sanitizeTransportSettings({...settings});
  return Object.fromEntries(TIMING_KEYS.map(key=>[key,safe[key]]));
}

export function createTransportAction(){
  return {active:false,stage:'idle',direction:1,elapsed:0,timing:null};
}

export function startTransport(action,direction,settings=null){
  action.active=true;
  action.stage='intake';
  action.direction=direction>=0?1:-1;
  action.elapsed=0;
  action.timing=settings?timingSnapshot(settings):null;
}

export function resetTransport(action){
  action.active=false;
  action.stage='idle';
  action.direction=1;
  action.elapsed=0;
  action.timing=null;
}

/* Timing sliders are snapshotted at action start. Moving a timing slider while
   an animation is running therefore affects the NEXT run, never the current
   frame. This is an important anti-jump guardrail for the lab. */
export function timingValue(action,settings,key){
  return action?.timing && key in action.timing ? action.timing[key] : settings[key];
}

export function stageLimit(stage,settings,action=null){
  if(stage==='intake')return timingValue(action,settings,'intakeDuration');
  if(stage==='compression')return timingValue(action,settings,'compressionDuration');
  if(stage==='transit')return timingValue(action,settings,'transitDuration');
  // fusionTakeover is the normalized handoff point inside the egress timeline.
  if(stage==='egress')return timingValue(action,settings,'egressDuration')*timingValue(action,settings,'fusionTakeover');
  if(stage==='fusion')return timingValue(action,settings,'fusionDuration');
  if(stage==='recovery')return timingValue(action,settings,'recoveryDuration');
  return Infinity;
}


const SEEKABLE_STAGES=Object.freeze(['intake','compression','transit','egress','fusion','recovery']);

function totalRawDuration(action,settings){
  return SEEKABLE_STAGES.reduce((sum,stage)=>sum+stageLimit(stage,settings,action),0);
}

export function transportTimelineTime(action,settings){
  if(!action||action.stage==='idle')return 0;
  const speed=Math.max(.001,timingValue(action,settings,'globalSpeed')||1);
  if(action.stage==='done')return totalRawDuration(action,settings)/speed;
  let raw=0;
  for(const stage of SEEKABLE_STAGES){
    if(stage===action.stage){raw+=Math.max(0,action.elapsed||0);break;}
    raw+=stageLimit(stage,settings,action);
  }
  return raw/speed;
}

export function transportTimelineDuration(action,settings){
  const speed=Math.max(.001,timingValue(action,settings,'globalSpeed')||1);
  return totalRawDuration(action,settings)/speed;
}

/* Absolute, reversible seek for the frame inspector. Timing is taken from the
   action snapshot, so slider edits cannot change a frame that already exists. */
export function seekTransport(action,settings,wallSeconds){
  if(!action)return;
  if(!action.timing)action.timing=timingSnapshot(settings);
  const speed=Math.max(.001,timingValue(action,settings,'globalSpeed')||1);
  const totalRaw=totalRawDuration(action,settings);
  let raw=clamp(Number(wallSeconds)||0,0,totalRaw/speed)*speed;
  action.active=true;
  for(const stage of SEEKABLE_STAGES){
    const limit=stageLimit(stage,settings,action);
    if(raw<limit-1e-9){
      action.stage=stage;
      action.elapsed=Math.max(0,raw);
      return;
    }
    raw-=limit;
  }
  action.stage='done';
  action.elapsed=0;
  action.active=false;
}

export function stageProgress(action,settings){
  if(action.stage==='egress')return clamp(action.elapsed/Math.max(.001,timingValue(action,settings,'egressDuration')));
  const limit=stageLimit(action.stage,settings,action);
  return Number.isFinite(limit)?clamp(action.elapsed/Math.max(.001,limit)):0;
}

const NEXT_STAGE={intake:'compression',compression:'transit',transit:'egress',egress:'fusion',fusion:'recovery',recovery:'done'};

/* Consume the complete dt, including fractions that cross a stage edge. A
   global speed multiplier changes only clock rate; it cannot alter handoff
   positions, scales or shader state. */
export function advanceTransport(action,settings,dt){
  if(!action.active||dt<=0)return;
  const speed=timingValue(action,settings,'globalSpeed')||1;
  let remaining=dt*speed;
  let guard=0;
  while(remaining>1e-7&&action.active&&guard++<8){
    const limit=stageLimit(action.stage,settings,action);
    if(!Number.isFinite(limit)){action.active=false;break;}
    const room=Math.max(0,limit-action.elapsed);
    if(remaining<room-1e-7){action.elapsed+=remaining;remaining=0;break;}
    remaining=Math.max(0,remaining-room);
    const next=NEXT_STAGE[action.stage];
    if(!next){action.active=false;break;}
    action.stage=next;
    action.elapsed=0;
    if(next==='done'){action.active=false;remaining=0;}
  }
}

export function estimatedActionDuration(settings){
  const s=sanitizeTransportSettings({...settings});
  const raw=s.intakeDuration+s.compressionDuration+s.transitDuration+s.egressDuration*s.fusionTakeover+s.fusionDuration+s.recoveryDuration;
  return raw/s.globalSpeed;
}

export function stageLabel(stage){
  return ({
    idle:'rust',
    intake:'groot naar mond',
    compression:'krimpen ín opening',
    transit:'verborgen cel door synaps + automatische bult',
    egress:'cel komt uit + uitgang trekt terug',
    fusion:'bestaande Fusion→Split',
    recovery:'laatste synaps-settle',
    done:'klaar',
  })[stage]||stage;
}

/* Normalized shortening of the receiving half. The target mouth only makes a
   tiny anticipatory retreat in late transit; most shortening happens while the
   emerging cell is already visible. */
export function exitRetractionFactor(action,settings){
  const p=stageProgress(action,settings);
  if(action.stage==='transit')return .06*smootherstep(.84,1,p);
  if(action.stage==='egress')return mix(.06,1,smootherstep(.08,.72,p));
  if(action.stage==='fusion'||action.stage==='recovery')return 1;
  if(action.stage==='done')return 0;
  return 0;
}

/* Pure shader-action choreography. Adjacent stage endpoints are deliberately
   matched. Timing sliders only change how long these curves are traversed, not
   their boundary values. */
export function synapseActionParams(action,settings){
  const dir=action.direction;
  const p=stageProgress(action,settings);
  const fusionTakeover=timingValue(action,settings,'fusionTakeover');
  const returnStart=timingValue(action,settings,'synapseReturnStart');
  if(action.stage==='idle'||action.stage==='done'||action.stage==='recovery'){
    return {actionMode:0,transportDirection:dir,transportProgress:.5,transportBulge:0,mouthDilationA:0,mouthDilationB:0,mouthReachA:0,mouthReachB:0,transportGlow:0};
  }

  let progress=dir===1?0:1,bulge=0,dA=0,dB=0,rA=0,rB=0,glow=0;
  const setSource=(dilation,reach=0)=>{if(dir===1){dA=dilation;rA=reach;}else{dB=dilation;rB=reach;}};
  const setTarget=(dilation,reach=0)=>{if(dir===1){dB=dilation;rB=reach;}else{dA=dilation;rA=reach;}};

  if(action.stage==='intake'){
    const open=smootherstep(.08,.82,p);
    progress=dir===1?.035:.965;
    glow=.16*smootherstep(.48,1,p);
    setSource(settings.mouthAction*open,settings.mouthAction*.10*open);
  }else if(action.stage==='compression'){
    const squeeze=1-.20*smootherstep(.18,.95,p);
    progress=dir===1?mix(.035,.13,smootherstep(0,1,p)):mix(.965,.87,smootherstep(0,1,p));
    bulge=settings.transportScale*mix(0,.72,smootherstep(.48,1,p));
    glow=mix(.16,.44,smootherstep(.30,1,p));
    setSource(settings.mouthAction*squeeze,settings.mouthAction*.10*squeeze*(1-.45*p));
  }else if(action.stage==='transit'){
    const travel=smootherstep(0,1,p);
    progress=dir===1?mix(.13,.94,travel):mix(.87,.06,travel);
    bulge=settings.transportScale*(.72+.12*Math.sin(Math.PI*p));
    glow=.44+.10*Math.sin(Math.PI*p);
    setSource(settings.mouthAction*.80*(1-smootherstep(0,.22,p)));
    setTarget(settings.mouthAction*.32*smootherstep(.72,1,p));
  }else if(action.stage==='egress'){
    progress=dir===1?.94:.06;
    bulge=settings.transportScale*.72*(1-smootherstep(.30,.92,p));
    glow=.44*(1-smootherstep(.38,1,p));
    setTarget(settings.mouthAction*mix(.32,.68,smootherstep(.06,.62,p)));
  }else if(action.stage==='fusion'){
    progress=dir===1?.94:.06;
    const releaseEnd=Math.min(.76,Math.max(.34,returnStart+.28));
    const release=1-smootherstep(.02,releaseEnd,p);
    const handoffBulge=.72*(1-smootherstep(.30,.92,fusionTakeover));
    const handoffGlow=.44*(1-smootherstep(.38,1,fusionTakeover));
    bulge=settings.transportScale*handoffBulge*release;
    glow=handoffGlow*release;
    setTarget(settings.mouthAction*.68*release);
  }
  return {actionMode:1,transportDirection:dir,transportProgress:progress,transportBulge:bulge,mouthDilationA:dA,mouthDilationB:dB,mouthReachA:rA,mouthReachB:rB,transportGlow:glow};
}

export function transportTimelineMarkers(action,settings){
  const labels={intake:'Intake',compression:'Compression',transit:'Transit',egress:'Egress',fusion:'Fusion',recovery:'Recovery'};
  const total=Math.max(.001,totalRawDuration(action,settings));
  let raw=0;
  const out=[{normalized:0,label:'Start'}];
  for(const stage of SEEKABLE_STAGES){
    if(raw>0)out.push({normalized:clamp(raw/total),label:labels[stage]||stage});
    raw+=stageLimit(stage,settings,action);
  }
  out.push({normalized:1,label:'Einde'});
  return out;
}
