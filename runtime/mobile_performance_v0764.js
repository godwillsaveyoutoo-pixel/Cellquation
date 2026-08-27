/* Cellquation Core v0.7.6.4 — smooth-mobile quality governor.
   Priority order is deliberate:
   1) membrane/synapse silhouette quality is protected;
   2) action timing/frame stability is protected;
   3) ambient/compositor work and internal micro-detail are reduced first.

   Unlike v0.7.6.2, mobile canvas resolution is NEVER allowed below 1 physical
   pixel per CSS pixel. High-capability devices may render above 1:1 for a
   cleaner membrane edge. Tier changes are deferred while an authored action is
   running so Fusion/Split/Brood/transport never hitch because the canvas is
   resized halfway through the choreography. */
export function createAdaptiveMobilePerformance(renderer,{onTierChange=null}={}){
  const coarse=!!(globalThis.matchMedia?.('(pointer: coarse)').matches || Number(navigator.maxTouchPoints||0)>0);
  const fixed=new URL(location.href).searchParams.has('fixedQuality');
  const enabled=coarse && !fixed;
  const dpr=Math.max(1,Math.min(2,Number(window.devicePixelRatio)||1));
  const memory=Number(navigator.deviceMemory||0);
  const cores=Number(navigator.hardwareConcurrency||0);
  /* CPU core count alone is a poor proxy for an Android GPU (older phones can
     report eight cores). Only a high memory bucket is used for an optimistic
     start; everybody else begins at protected native 1:1 and earns higher
     density from measured FPS. */
  const strongHint=memory>=8&&cores>=6;
  const veryStrongHint=memory>=8&&cores>=8;
  const desktopCap=Math.min(dpr,1.75);
  const initialCap=coarse
    ? Math.min(dpr,veryStrongHint?1.50:strongHint?1.25:1.00)
    : desktopCap;

  const state={
    enabled,tier:'full',pixelRatioCap:initialCap,renderDetail:1,fps:0,developerOverride:'auto',
    started:performance.now(),sampleStart:0,lastNow:0,frames:0,intervalSum:0,
    adjustments:0,lowSamples:0,highSamples:0,busy:false,pendingTier:null,
    longFrames:0,veryLongFrames:0,jank:0,
    deviceHint:veryStrongHint?'very-strong':strongHint?'strong':'baseline'
  };

  renderer.setPixelRatioCap(initialCap);
  renderer.setRenderDetail?.(1);
  renderer.resize();
  document.documentElement.dataset.performanceTier='full';
  document.documentElement.dataset.renderDensity=initialCap>1.40?'high':initialCap>1.10?'enhanced':'native';

  const PROFILES={
    full:{cap:null,detail:1.00},
    balanced:{cap:1.25,detail:.78},
    constrained:{cap:1.00,detail:.56},
    critical:{cap:1.00,detail:.34},
  };

  function notify(){try{onTierChange?.({...state})}catch(_){/* presentation callback only */}}

  function apply(tier,{cap=null,detail=null,allowUpgrade=false}={}){
    const p=PROFILES[tier]||PROFILES.full;
    let nextCap=cap??p.cap??state.pixelRatioCap;
    nextCap=Math.max(1.0,Math.min(dpr,1.75,nextCap));
    const nextDetail=Math.max(.28,Math.min(1,detail??p.detail));

    // During ordinary degradation we may lower density, never raise it.
    if(!allowUpgrade)nextCap=Math.min(state.pixelRatioCap,nextCap);
    const changed=tier!==state.tier||Math.abs(nextCap-state.pixelRatioCap)>.001||Math.abs(nextDetail-state.renderDetail)>.001;
    if(!changed)return false;

    state.tier=tier;state.pixelRatioCap=nextCap;state.renderDetail=nextDetail;state.adjustments++;
    renderer.setRenderDetail?.(nextDetail);
    if(Math.abs((renderer.pixelRatioCap||1)-nextCap)>.001){
      renderer.setPixelRatioCap(nextCap);
      renderer.resize();
    }
    document.documentElement.dataset.performanceTier=tier;
    document.documentElement.dataset.renderDensity=nextCap>1.40?'high':nextCap>1.10?'enhanced':'native';
    if(tier==='critical')document.documentElement.dataset.quality='low';
    else if(document.documentElement.dataset.quality==='low')delete document.documentElement.dataset.quality;
    notify();
    return true;
  }

  function maybePromoteHighEnd(){
    // Promotion is intentionally only from untouched FULL mode. Once a device
    // proved constrained during this level we keep it stable rather than hunt.
    if(state.tier!=='full'||state.busy||state.highSamples<3)return;
    let target=state.pixelRatioCap;
    if(veryStrongHint&&state.fps>=59&&target>=1.49&&target<1.75&&dpr>=1.75)target=Math.min(1.75,dpr);
    else if(state.fps>=58&&target<1.50&&dpr>=1.50)target=Math.min(1.50,dpr);
    else if(state.fps>=57&&target<1.25&&dpr>=1.25)target=Math.min(1.25,dpr);
    if(target>state.pixelRatioCap+.001){
      apply('full',{cap:target,detail:1,allowUpgrade:true});
      state.highSamples=0;
    }
  }

  function observe(now,busy=false){
    state.busy=!!busy;
    const forced=state.developerOverride&&state.developerOverride!=='auto';
    if(!enabled&&!forced)return state;
    if(!state.busy&&state.pendingTier){apply(state.pendingTier);state.pendingTier=null}
    if(!state.lastNow){state.lastNow=now;state.sampleStart=now;return state}
    const interval=now-state.lastNow;state.lastNow=now;
    if(interval<=0||interval>180)return state;
    if(now-state.started<1200){state.sampleStart=now;state.frames=0;state.intervalSum=0;return state}
    state.frames++;state.intervalSum+=interval;if(interval>24)state.longFrames++;if(interval>36)state.veryLongFrames++;
    if(now-state.sampleStart<1000||state.frames<14)return state;

    const elapsed=Math.max(1,now-state.sampleStart);
    state.fps=state.frames*1000/elapsed;
    const longRatio=state.longFrames/Math.max(1,state.frames);
    const veryLongRatio=state.veryLongFrames/Math.max(1,state.frames);
    state.jank=longRatio;
    const poor=state.fps<50||longRatio>0.16;
    if(poor){state.lowSamples++;state.highSamples=0}
    else if(state.fps>=55&&longRatio<0.08){state.highSamples++;state.lowSamples=0}
    else {state.lowSamples=0;state.highSamples=0}

    /* A tier is chosen from both throughput and frame pacing. A 42–48 FPS
       average with frequent 30–40 ms frames still feels visibly jerky, so
       those devices shed internal detail even though the game is technically
       playable. */
    if(!forced){
      if(state.lowSamples>=2){
        let wanted='balanced';
        if(state.fps<26||veryLongRatio>0.34)wanted='critical';
        else if(state.fps<40||longRatio>0.34)wanted='constrained';
        if(state.busy)state.pendingTier=wanted;else apply(wanted);
        state.lowSamples=0;
      }else if(!state.busy)maybePromoteHighEnd();
    }else{
      state.lowSamples=0;state.highSamples=0;state.pendingTier=null;
    }

    state.sampleStart=now;state.frames=0;state.intervalSum=0;state.longFrames=0;state.veryLongFrames=0;
    return state;
  }

  const api={
    state,observe,
    setPixelRatioCap(cap){
      // Manual/debug override still honours the protected 1:1 edge floor.
      const next=Math.max(1,Number(cap)||1);
      apply(next<=1?'constrained':'full',{cap:next,detail:next<=1?.56:1,allowUpgrade:true});
    },
    setDeveloperTier(tier='auto'){
      const allowed=['auto','full','balanced','constrained','critical'];
      if(!allowed.includes(tier))tier='auto';
      state.developerOverride=tier;
      state.pendingTier=null;state.lowSamples=0;state.highSamples=0;
      state.sampleStart=performance.now();state.frames=0;state.intervalSum=0;state.longFrames=0;state.veryLongFrames=0;
      if(tier==='auto'){
        apply('full',{cap:initialCap,detail:1,allowUpgrade:true});
      }else if(tier==='full'){
        apply('full',{cap:Math.min(dpr,1.75),detail:1,allowUpgrade:true});
      }else{
        const p=PROFILES[tier];
        apply(tier,{cap:p.cap,detail:p.detail,allowUpgrade:true});
      }
      notify();
      return {...state};
    }
  };
  if(typeof window!=='undefined')window.__CELLQUATION_PERF__=api;
  return api;
}
