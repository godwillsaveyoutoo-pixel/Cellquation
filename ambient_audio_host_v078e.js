/* Cellquation v0.7.8e — persistent top-level audio host.
   This script lives in index.html, outside the navigated app iframe.
   Invariant: after the first allowed user gesture, menu/game navigation never
   destroys, reloads, restarts or reseeks the live Audio object. */
(()=>{
  'use strict';
  if(window.CellquationAmbientHost)return;

  const TRACKS=[
    {
      id:'scott-things', src:'assets/audio/music/scott_buckley_the_things_that_keep_us_here.mp3',
      title:'The Things That Keep Us Here', kind:'Ambient piano & synth', where:'Monomyth · 2019',
      detail:'Scott Buckley', artist:'Scott Buckley', year:'2019', duration:266.031,
      sourceLabel:'Scott Buckley Music Library', license:'CC BY 4.0', gain:0.87
    },
    {
      id:'daugava', src:'assets/audio/nature/nature_daugava_latvia.mp3',
      title:'Daugava River', kind:'River field recording', where:'Daugavpils, Latvia',
      detail:'River Daugava', artist:'alas23/sala', year:'2025', duration:215.232,
      sourceLabel:'radio aporee', license:'Source metadata', gain:1
    },
    {
      id:'saline-pools', src:'assets/audio/nature/nature_saline_pools_chile.mp3',
      title:'Pacific Saline Pools', kind:'Saline rock pools by the Pacific', where:'Chañaral, Chile',
      detail:'Granite coastal pools', artist:'Diane Barbé & Selu Herraiz', year:'2024', duration:186.984,
      sourceLabel:'radio aporee', license:'Source metadata', gain:1
    },
    {
      id:'aknysteles-underwater', src:'assets/audio/nature/nature_aknysteles_underwater_lithuania.mp3',
      title:'Pond Underwater', kind:'Underwater pond recording', where:'Aknystėlės, Lithuania',
      detail:'Hydrophone / underwater listening', artist:'alas23/sala', year:'2024', duration:313.032,
      sourceLabel:'radio aporee', license:'Source metadata', gain:1
    },
    {
      id:'lake-saiko', src:'assets/audio/nature/nature_lake_saiko_japan.mp3',
      title:'Lake Saiko Waves', kind:'Lakeshore waves', where:'Fujikawaguchiko, Yamanashi, Japan',
      detail:'Lake Saiko', artist:'Mike Blow', year:'2026', duration:218.400,
      sourceLabel:'radio aporee', license:'Source metadata', gain:1
    },
    {
      id:'upo-dawn', src:'assets/audio/nature/nature_upo_wetland_dawn_korea.mp3',
      title:'Early Summer Dawn', kind:'Wetland dawn soundscape', where:'Upo Wetland, South Korea',
      detail:'Early summer dawn near the wetland', artist:'abyssence', year:'2026', duration:785.688,
      sourceLabel:'radio aporee', license:'Source metadata', gain:1
    }
  ];

  const SESSION_KEY='cellquation.audioHost.session.v2';
  const OLD_SESSION_KEY='cellquation.natureAudio.session.v1';
  const VOL_KEY='cellquation.ambient.volume';
  const MUTE_KEY='cellquation.ambient.muted';
  const MODE_KEY='cellquation.natureAudio.mode';
  const TRACK_KEY='cellquation.natureAudio.track';
  const FX_VOL_KEY='cellquation.fx.volume';
  const DEFAULT_MIGRATION_KEY='cellquation.audio.defaultScott.v078e';
  const DEFAULT_VOLUME=.62;
  const DEFAULT_FX_VOLUME=.72;
  const clamp01=n=>Math.max(0,Math.min(1,n));
  const safeGet=(store,key)=>{try{return store.getItem(key)}catch{return null}};
  const safeSet=(store,key,value)=>{try{store.setItem(key,value)}catch{}};

  let audio=null, desired=true, startPromise=null, changingTrack=false, trackChangeToken=0;
  // One-time v0.7.8e default migration: Scott Buckley becomes the standard selection
  // for a new session, while an already-live legacy session can still resume its track.
  if(safeGet(localStorage,DEFAULT_MIGRATION_KEY)!=='1'){safeSet(localStorage,TRACK_KEY,'scott-things');safeSet(localStorage,DEFAULT_MIGRATION_KEY,'1')}
  let currentIndex=storedTrackIndex();

  function getMode(){return safeGet(localStorage,MODE_KEY)==='single'?'single':'playlist'}
  function storedTrackIndex(){
    const id=safeGet(localStorage,TRACK_KEY);
    const i=TRACKS.findIndex(t=>t.id===id);
    return i>=0?i:0; // fresh install defaults to Scott Buckley
  }
  function storeTrackIndex(i){
    currentIndex=((Number(i)||0)%TRACKS.length+TRACKS.length)%TRACKS.length;
    safeSet(localStorage,TRACK_KEY,TRACKS[currentIndex].id);
  }
  function getStoredVolume(){
    const raw=safeGet(localStorage,VOL_KEY);if(raw===null||raw==='')return DEFAULT_VOLUME;
    const n=Number(raw);return Number.isFinite(n)?clamp01(n):DEFAULT_VOLUME;
  }
  function getStoredMuted(){return safeGet(localStorage,MUTE_KEY)==='1'}
  function getStoredFxVolume(){
    const raw=safeGet(localStorage,FX_VOL_KEY);if(raw===null||raw==='')return DEFAULT_FX_VOLUME;
    const n=Number(raw);return Number.isFinite(n)?clamp01(n):DEFAULT_FX_VOLUME;
  }
  function applyEffectiveVolume(){
    if(!audio)return;
    const gain=Number(TRACKS[currentIndex]?.gain)||1;
    audio.volume=clamp01(getStoredVolume()*gain);
    audio.muted=getStoredMuted();
  }
  function readSession(){
    try{
      const raw=sessionStorage.getItem(SESSION_KEY);if(raw)return JSON.parse(raw)||{};
      const old=JSON.parse(sessionStorage.getItem(OLD_SESSION_KEY)||'{}');
      if(old&&old.active===true){
        const migrated={active:true,trackId:old.trackId||TRACKS[currentIndex].id,phase:Math.max(0,Number(old.phase)||0),mode:old.mode||getMode()};
        writeSession(migrated);return migrated;
      }
    }catch{}
    return {};
  }
  function writeSession(v){try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(v))}catch{}}
  function emit(){
    try{window.dispatchEvent(new CustomEvent('cellquation:audiohostchange',{detail:status()}))}catch{}
  }
  function ensure(){
    if(audio)return audio;
    audio=new Audio();audio.preload='auto';audio.playsInline=true;audio.setAttribute('playsinline','');applyEffectiveVolume();
    audio.addEventListener('play',()=>{saveLiveCheckpoint();emit()});
    audio.addEventListener('pause',emit);
    audio.addEventListener('timeupdate',()=>{if(desired&&!audio.paused&&!changingTrack)saveLiveCheckpoint()});
    audio.addEventListener('ended',()=>{
      if(!desired)return;
      if(getMode()==='single')selectTrack(currentIndex,0,{autoplay:true});
      else selectTrack((currentIndex+1)%TRACKS.length,0,{autoplay:true});
    });
    audio.addEventListener('error',()=>{console.warn('[Cellquation audio host] unavailable',TRACKS[currentIndex]?.src);emit()});
    return audio;
  }
  function waitForMetadata(a){
    if(Number.isFinite(a.duration)&&a.duration>0&&a.readyState>=1)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      let done=false;
      const clean=()=>{a.removeEventListener('loadedmetadata',ok);a.removeEventListener('durationchange',ok);a.removeEventListener('error',bad)};
      const ok=()=>{if(done)return;if(Number.isFinite(a.duration)&&a.duration>0){done=true;clean();resolve()}};
      const bad=()=>{if(done)return;done=true;clean();reject(new Error('track metadata unavailable'))};
      a.addEventListener('loadedmetadata',ok);a.addEventListener('durationchange',ok);a.addEventListener('error',bad,{once:true});
      setTimeout(()=>{if(!done&&Number.isFinite(a.duration)&&a.duration>0)ok()},900);
    });
  }
  function sessionPosition(){
    const st=readSession();const i=TRACKS.findIndex(t=>t.id===st.trackId);
    return {index:i>=0?i:storedTrackIndex(),phase:Math.max(0,Number(st.phase)||0),active:st.active===true};
  }
  function loadTrack(i,phase=0){
    const a=ensure();storeTrackIndex(i);const t=TRACKS[currentIndex];changingTrack=true;
    if(a.src!==new URL(t.src,document.baseURI).href){a.src=t.src;a.load()}
    applyEffectiveVolume();
    return waitForMetadata(a).then(()=>{
      const d=Number.isFinite(a.duration)&&a.duration>0?a.duration:t.duration;
      const p=d>0?Math.max(0,phase)%d:Math.max(0,phase);
      try{a.currentTime=p}catch{}
      changingTrack=false;emit();return a;
    }).catch(err=>{changingTrack=false;throw err});
  }
  function saveLiveCheckpoint(){
    if(!audio)return;
    const prior=readSession();
    writeSession({active:prior.active===true||(!audio.paused&&desired),trackId:TRACKS[currentIndex].id,phase:Number(audio.currentTime)||0,mode:getMode()});
  }
  function markIntent(){
    const st=readSession();if(st.active===true)return;
    writeSession({active:true,trackId:TRACKS[currentIndex].id,phase:Math.max(0,Number(st.phase)||0),mode:getMode()});
  }
  async function play(){
    if(!desired)return false;const a=ensure();
    // The host lives above iframe navigation: once live, every later play request is a strict no-op.
    if(!a.paused&&!a.ended&&!changingTrack){emit();return true}
    if(startPromise)return startPromise;
    markIntent();
    startPromise=(async()=>{
      try{
        const pos=sessionPosition();
        if(!a.src||currentIndex!==pos.index||a.readyState===0)await loadTrack(pos.index,pos.phase);
        else if(a.paused&&Number.isFinite(pos.phase)&&Math.abs((a.currentTime||0)-pos.phase)>.75){try{a.currentTime=pos.phase}catch{}}
        if(!desired)return false;
        if(a.paused||a.ended)await a.play();
        writeSession({active:true,trackId:TRACKS[currentIndex].id,phase:Number(a.currentTime)||0,mode:getMode()});emit();return true;
      }catch(err){console.warn('[Cellquation audio host] waiting for user gesture',err?.message||err);emit();return false}
      finally{startPromise=null}
    })();
    return startPromise;
  }
  async function selectTrack(index,phase=0,{autoplay=true}={}){
    const target=((Number(index)||0)%TRACKS.length+TRACKS.length)%TRACKS.length;
    const token=++trackChangeToken;const a=ensure();const wasActive=readSession().active===true||(!a.paused&&desired);
    changingTrack=true;try{if(!a.paused)a.pause()}catch{}
    try{
      await loadTrack(target,phase);if(token!==trackChangeToken)return false;
      writeSession({active:wasActive||autoplay,trackId:TRACKS[currentIndex].id,phase:Number(a.currentTime)||0,mode:getMode()});
      if(autoplay&&desired){try{await a.play()}catch{}}
      emit();return true;
    }finally{if(token===trackChangeToken)changingTrack=false}
  }
  function setMode(mode){const next=mode==='single'?'single':'playlist';safeSet(localStorage,MODE_KEY,next);const st=readSession();writeSession({...st,mode:next,trackId:TRACKS[currentIndex].id,phase:Number(audio?.currentTime)||Number(st.phase)||0});emit()}
  function setVolume(v){safeSet(localStorage,VOL_KEY,String(clamp01(Number(v)||0)));ensure();applyEffectiveVolume();emit()}
  function setMuted(m){safeSet(localStorage,MUTE_KEY,m?'1':'0');ensure();applyEffectiveVolume();emit()}
  function setFxVolume(v){const value=clamp01(Number(v)||0);safeSet(localStorage,FX_VOL_KEY,String(value));try{window.dispatchEvent(new CustomEvent('cellquation:fxvolumechange',{detail:{volume:value}}))}catch{};emit();return value}
  function pause(){desired=false;const a=ensure();saveLiveCheckpoint();try{a.pause()}catch{};const st=readSession();writeSession({...st,active:false,trackId:TRACKS[currentIndex].id,phase:Number(a.currentTime)||0,mode:getMode()});emit()}
  function resume(){desired=true;markIntent();return play()}
  function status(){
    const st=readSession(),a=audio;
    return {playing:!!a&&!a.paused,active:st.active===true,muted:a?.muted??getStoredMuted(),volume:getStoredVolume(),effectiveVolume:a?.volume??getStoredVolume(),fxVolume:getStoredFxVolume(),index:currentIndex,track:{...TRACKS[currentIndex]},mode:getMode(),currentTime:Number(a?.currentTime)||Number(st.phase)||0,changingTrack};
  }

  window.CellquationAmbientHost={
    play,pause,resume,setVolume,getVolume:getStoredVolume,setMuted,getMuted:getStoredMuted,
    setFxVolume,getFxVolume:getStoredFxVolume,setMode,getMode,
    previousTrack(){return selectTrack(currentIndex-1,0,{autoplay:true})},
    nextTrack(){return selectTrack(currentIndex+1,0,{autoplay:true})},
    selectTrack(i){return selectTrack(i,0,{autoplay:true})},
    get tracks(){return TRACKS.map(t=>({...t}))},get status(){return status()}
  };
  // Compatibility for any code that runs in the shell itself.
  window.CellquationAmbient=window.CellquationAmbientHost;

  window.addEventListener('pagehide',()=>{saveLiveCheckpoint()});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden'){saveLiveCheckpoint();return}
    desired=true;if(readSession().active===true&&audio?.paused)play();
  });
  if(readSession().active===true)play();
})();
