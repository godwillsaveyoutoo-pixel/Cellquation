/* Cellquation v0.7.7a.9 — continuous ambient audio hotfix.
   Invariant: gameplay/UI actions must never restart or reseek ambience.
   A persisted session phase is applied once per document/audio element only. */
(()=>{
  'use strict';
  const SRC='assets/audio/underwater_ambience.mp3';
  const KEY='cellquation.ambient.v077a4'; // preserve existing user/session state
  const VOL_KEY='cellquation.ambient.volume';
  const MUTE_KEY='cellquation.ambient.muted';
  const DEFAULT_VOLUME=0.62;
  const gestureTypes=['pointerdown','touchstart','keydown'];
  let audio=null,armed=false,desired=true,startPromise=null;
  let initialPhaseApplied=false,phaseReady=false;

  const read=()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||'{}')}catch{return {}}};
  const write=v=>{try{sessionStorage.setItem(KEY,JSON.stringify(v))}catch{}};
  const clamp01=n=>Math.max(0,Math.min(1,n));
  function getStoredVolume(){
    try{const raw=localStorage.getItem(VOL_KEY);if(raw===null||raw==='')return DEFAULT_VOLUME;const n=Number(raw);return Number.isFinite(n)?clamp01(n):DEFAULT_VOLUME}catch{return DEFAULT_VOLUME}
  }
  function getStoredMuted(){try{return localStorage.getItem(MUTE_KEY)==='1'}catch{return false}}

  function syncControls(forceStatus=''){
    const a=audio,vol=Math.round((a?.volume??getStoredVolume())*100),muted=a?.muted??getStoredMuted();
    document.querySelectorAll('[data-cq-ambient-volume]').forEach(el=>{if(document.activeElement!==el)el.value=String(vol);el.setAttribute('aria-valuetext',`${vol}%`)});
    document.querySelectorAll('[data-cq-ambient-value]').forEach(el=>el.textContent=`${vol}%`);
    document.querySelectorAll('[data-cq-ambient-toggle]').forEach(el=>{el.textContent=muted?'Unmute':'Mute';el.setAttribute('aria-pressed',String(muted))});
    const status=forceStatus==='error'?'Audio unavailable':muted?'Muted':a&&!a.paused?'Playing':'Tap to start';
    document.querySelectorAll('[data-cq-ambient-status]').forEach(el=>el.textContent=status);
  }

  function ensure(){
    if(audio)return audio;
    audio=new Audio(SRC);
    audio.loop=true;audio.preload='auto';audio.volume=getStoredVolume();audio.muted=getStoredMuted();audio.setAttribute('playsinline','');
    ['play','pause','volumechange','canplay'].forEach(type=>audio.addEventListener(type,()=>syncControls()));
    audio.addEventListener('error',()=>{console.warn('[Cellquation ambience] audio failed to load');syncControls('error')});
    // Keep the persisted checkpoint fresh without ever seeking the live element.
    audio.addEventListener('timeupdate',()=>{
      if(!desired||audio.paused||!phaseReady)return;
      const st=read();
      if(st.active===true)write({active:true,phase:Number(audio.currentTime)||0,epoch:Date.now()});
    });
    return audio;
  }

  function waitForMetadata(a){
    if(Number.isFinite(a.duration)&&a.duration>0&&a.readyState>=1)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const clean=()=>{a.removeEventListener('loadedmetadata',ok);a.removeEventListener('durationchange',ok);a.removeEventListener('error',bad)};
      const ok=()=>{if(Number.isFinite(a.duration)&&a.duration>0){clean();resolve()}};
      const bad=()=>{clean();reject(new Error('ambient metadata unavailable'))};
      a.addEventListener('loadedmetadata',ok);a.addEventListener('durationchange',ok);a.addEventListener('error',bad,{once:true});
      // load() is allowed only before the first phase restore, never during live playback.
      if(!initialPhaseApplied){try{a.load()}catch{}}
    });
  }

  function targetPhase(duration){
    const st=read(),base=Number(st.phase)||0;
    if(st.active!==true)return duration>0?base%duration:base;
    const elapsed=Math.max(0,(Date.now()-(Number(st.epoch)||Date.now()))/1000);
    const t=base+elapsed;
    return duration>0?t%duration:t;
  }

  async function applyInitialSessionPhase(a){
    if(initialPhaseApplied)return;
    await waitForMetadata(a);
    if(initialPhaseApplied)return;
    const t=targetPhase(a.duration);
    if(Number.isFinite(t)){try{a.currentTime=t}catch{}}
    initialPhaseApplied=true;phaseReady=true;
    if(a.seeking)await new Promise(resolve=>{a.addEventListener('seeked',resolve,{once:true});setTimeout(resolve,260)});
  }

  function markIntent(){
    const st=read();
    if(st.active===true)return;
    const phase=phaseReady&&audio&&Number.isFinite(audio.currentTime)?Number(audio.currentTime):(Number(st.phase)||0);
    write({active:true,phase,epoch:Date.now()});
  }
  function markActive(a=ensure()){
    const phase=phaseReady&&Number.isFinite(a.currentTime)?Number(a.currentTime):(Number(read().phase)||0);
    write({active:true,phase,epoch:Date.now()});
  }

  async function start(){
    if(!desired)return false;
    const a=ensure();

    // CRITICAL v0.7.7a.9 invariant: repeated calls from any click/action are no-ops.
    // Do not seek, load, pause, clone, or call play() again while ambience is live.
    if(!a.paused&&!a.ended){disarm();syncControls();return true;}
    if(startPromise)return startPromise;

    markIntent();
    startPromise=(async()=>{
      try{
        await applyInitialSessionPhase(a);
        if(!desired)return false;
        // A second event may have started playback while metadata was resolving.
        if(a.paused||a.ended)await a.play();
        markActive(a);disarm();syncControls();return true;
      }catch{
        arm();syncControls();return false;
      }finally{startPromise=null;}
    })();
    return startPromise;
  }

  function saveAndPause(){
    if(!audio)return;
    const st=read();
    if(desired&&st.active===true){
      const phase=phaseReady&&Number.isFinite(audio.currentTime)?Number(audio.currentTime):(Number(st.phase)||0);
      write({active:true,phase,epoch:Date.now()});
    }
    try{audio.pause()}catch{}
  }
  function gesture(){if(!desired)return;start()}
  function arm(){if(armed)return;armed=true;gestureTypes.forEach(t=>window.addEventListener(t,gesture,{capture:true,passive:true}))}
  function disarm(){if(!armed)return;armed=false;gestureTypes.forEach(t=>window.removeEventListener(t,gesture,{capture:true}))}

  function setVolume(v){const n=clamp01(Number(v)||0);try{localStorage.setItem(VOL_KEY,String(n))}catch{};const a=ensure();a.volume=n;if(n>0&&desired&&a.paused)start();syncControls()}
  function setMuted(muted){const m=!!muted;try{localStorage.setItem(MUTE_KEY,m?'1':'0')}catch{};const a=ensure();a.muted=m;if(!m&&desired&&a.paused)start();syncControls()}
  function bindControls(){
    document.querySelectorAll('[data-cq-ambient-volume]').forEach(el=>{el.value=String(Math.round(getStoredVolume()*100));el.addEventListener('input',()=>setVolume(Number(el.value)/100));el.addEventListener('change',()=>{if(ensure().paused)start()})});
    document.querySelectorAll('[data-cq-ambient-toggle]').forEach(el=>el.addEventListener('click',()=>setMuted(!ensure().muted)));
    syncControls();
  }

  window.CellquationAmbient={
    play:start,
    pause(){desired=false;const a=ensure();try{a.pause()}catch{};write({active:false,phase:Number(a.currentTime)||0,epoch:Date.now()});syncControls()},
    resume(){desired=true;markIntent();return start()},
    setVolume,getVolume(){return ensure().volume},setMuted,getMuted(){return ensure().muted},
    get playing(){return !!audio&&!audio.paused},
    get status(){return {playing:!!audio&&!audio.paused,muted:audio?.muted??getStoredMuted(),volume:audio?.volume??getStoredVolume(),currentTime:Number(audio?.currentTime)||0}}
  };

  window.addEventListener('pagehide',saveAndPause);
  window.addEventListener('pageshow',()=>{desired=true;if(read().active===true)start();else arm()});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden')saveAndPause();
    else if(read().active===true){desired=true;start();}
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindControls,{once:true});else bindControls();
  if(read().active===true)start();else arm();
})();
