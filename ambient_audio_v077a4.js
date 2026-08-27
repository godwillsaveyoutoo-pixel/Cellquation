/* Cellquation v0.7.7a.4 — reliable session-continuous underwater ambience.
   Browser pages cannot keep one HTMLAudioElement alive across full navigations,
   so phase is persisted and resumed instead of restarting from 0. Audio starts
   on the first gesture allowed by the browser and exposes pause-menu controls. */
(()=>{
  'use strict';
  const SRC='assets/audio/underwater_ambience.mp3';
  const KEY='cellquation.ambient.v077a4';
  const VOL_KEY='cellquation.ambient.volume';
  const MUTE_KEY='cellquation.ambient.muted';
  const DEFAULT_VOLUME=0.62;
  let audio=null;
  let duration=0;
  let armed=false;
  let desired=true;
  const gestureTypes=['pointerdown','touchstart','keydown'];

  const read=()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||'{}')}catch{return {}}};
  const write=v=>{try{sessionStorage.setItem(KEY,JSON.stringify(v))}catch{}};
  function getStoredVolume(){
    try{
      const raw=localStorage.getItem(VOL_KEY);
      if(raw===null||raw==='')return DEFAULT_VOLUME; // v0.7.7a.3 bug: Number(null) became 0.
      const n=Number(raw);
      return Number.isFinite(n)?Math.max(0,Math.min(1,n)):DEFAULT_VOLUME;
    }catch{return DEFAULT_VOLUME}
  }
  function getStoredMuted(){try{return localStorage.getItem(MUTE_KEY)==='1'}catch{return false}}

  function ensure(){
    if(audio)return audio;
    audio=new Audio(SRC);
    audio.loop=true;
    audio.preload='auto';
    audio.volume=getStoredVolume();
    audio.muted=getStoredMuted();
    audio.setAttribute('playsinline','');
    audio.addEventListener('loadedmetadata',()=>{
      duration=Number.isFinite(audio.duration)?audio.duration:0;
      syncPhase();syncControls();
    });
    ['play','pause','volumechange','canplay'].forEach(type=>audio.addEventListener(type,syncControls));
    audio.addEventListener('error',()=>{console.warn('[Cellquation ambience] audio failed to load');syncControls('error')});
    return audio;
  }

  function targetPhase(){
    const st=read();
    if(st.active!==true)return Number(st.phase)||0;
    const elapsed=Math.max(0,(Date.now()-(Number(st.epoch)||Date.now()))/1000);
    const base=Number(st.phase)||0;
    return duration>0?(base+elapsed)%duration:base+elapsed;
  }
  function syncPhase(){
    const a=ensure();
    if(!Number.isFinite(a.duration)||a.duration<=0)return;
    const t=targetPhase()%a.duration;
    if(Math.abs((a.currentTime||0)-t)>1.15){try{a.currentTime=t}catch{}}
  }
  function markActive(){
    const a=ensure();
    write({active:true,phase:Number(a.currentTime)||targetPhase()||0,epoch:Date.now()});
  }

  async function start(){
    if(!desired)return false;
    const a=ensure();
    syncPhase();
    // Persist intent before awaiting play(): a navigation caused by this same
    // gesture can otherwise unload the page before the promise resolves.
    markActive();
    try{
      await a.play();
      markActive();
      disarm();
      syncControls();
      return true;
    }catch{
      arm();
      syncControls();
      return false;
    }
  }

  function saveAndPause(){
    if(!audio)return;
    const wasActive=desired && read().active===true;
    if(wasActive)write({active:true,phase:Number(audio.currentTime)||0,epoch:Date.now()});
    try{audio.pause()}catch{}
  }
  function gesture(){
    if(!desired)return;
    markActive();
    start();
  }
  function arm(){
    if(armed)return;
    armed=true;
    gestureTypes.forEach(t=>window.addEventListener(t,gesture,{capture:true,passive:true}));
  }
  function disarm(){
    if(!armed)return;
    armed=false;
    gestureTypes.forEach(t=>window.removeEventListener(t,gesture,{capture:true}));
  }

  function setVolume(v){
    const n=Math.max(0,Math.min(1,Number(v)||0));
    try{localStorage.setItem(VOL_KEY,String(n))}catch{}
    const a=ensure();a.volume=n;
    if(n>0&&desired)start();
    syncControls();
  }
  function setMuted(muted){
    const m=!!muted;
    try{localStorage.setItem(MUTE_KEY,m?'1':'0')}catch{}
    const a=ensure();a.muted=m;
    if(!m&&desired)start();
    syncControls();
  }

  function syncControls(forceStatus=''){
    const a=audio;
    const vol=Math.round((a?.volume??getStoredVolume())*100);
    const muted=a?.muted??getStoredMuted();
    document.querySelectorAll('[data-cq-ambient-volume]').forEach(el=>{if(document.activeElement!==el)el.value=String(vol);el.setAttribute('aria-valuetext',`${vol}%`)});
    document.querySelectorAll('[data-cq-ambient-value]').forEach(el=>el.textContent=`${vol}%`);
    document.querySelectorAll('[data-cq-ambient-toggle]').forEach(el=>{el.textContent=muted?'Unmute':'Mute';el.setAttribute('aria-pressed',String(muted))});
    let status=forceStatus==='error'?'Audio unavailable':muted?'Muted':a&&!a.paused?'Playing':'Tap to start';
    document.querySelectorAll('[data-cq-ambient-status]').forEach(el=>el.textContent=status);
  }
  function bindControls(){
    document.querySelectorAll('[data-cq-ambient-volume]').forEach(el=>{
      el.value=String(Math.round(getStoredVolume()*100));
      el.addEventListener('input',()=>setVolume(Number(el.value)/100));
      el.addEventListener('change',()=>start());
    });
    document.querySelectorAll('[data-cq-ambient-toggle]').forEach(el=>el.addEventListener('click',()=>setMuted(!(ensure().muted))));
    syncControls();
  }

  window.CellquationAmbient={
    play:start,
    pause(){desired=false;const a=ensure();a.pause();write({active:false,phase:Number(a.currentTime)||0,epoch:Date.now()});syncControls()},
    resume(){desired=true;markActive();return start()},
    setVolume,getVolume(){return ensure().volume},setMuted,getMuted(){return ensure().muted},
    get playing(){return !!audio&&!audio.paused},get status(){return {playing:!!audio&&!audio.paused,muted:audio?.muted??getStoredMuted(),volume:audio?.volume??getStoredVolume()}}
  };

  window.addEventListener('pagehide',saveAndPause);
  window.addEventListener('pageshow',()=>{desired=true;const st=read();if(st.active===true)start();else arm()});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden')saveAndPause();
    else if(read().active===true){desired=true;start()}
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindControls,{once:true});else bindControls();

  // Autoplay is attempted for sessions that were already active. If the browser
  // blocks it, the persistent gesture listeners keep retrying until one succeeds.
  if(read().active===true)start();else arm();
})();
