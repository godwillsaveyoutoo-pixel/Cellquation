/* Cellquation v0.7.7a.13 — persistent nature playlist + deterministic carousel navigation.
   Core invariant: ordinary gameplay/UI actions never restart or reseek live audio.
   Music starts after the first allowed user gesture, then resumes the same track + phase
   across Cellquation document navigation. Track/mode changes are explicit user actions. */
(()=>{
  'use strict';

  const TRACKS=[
    {
      id:'daugava', src:'assets/audio/nature/nature_daugava_latvia.mp3',
      title:'Daugava River', kind:'River field recording', where:'Daugavpils, Latvia',
      detail:'River Daugava', artist:'alas23/sala', year:'2025', duration:215.232
    },
    {
      id:'saline-pools', src:'assets/audio/nature/nature_saline_pools_chile.mp3',
      title:'Pacific Saline Pools', kind:'Saline rock pools by the Pacific', where:'Chañaral, Chile',
      detail:'Granite coastal pools', artist:'Diane Barbé & Selu Herraiz', year:'2024', duration:186.984
    },
    {
      id:'aknysteles-underwater', src:'assets/audio/nature/nature_aknysteles_underwater_lithuania.mp3',
      title:'Pond Underwater', kind:'Underwater pond recording', where:'Aknystėlės, Lithuania',
      detail:'Hydrophone / underwater listening', artist:'alas23/sala', year:'2024', duration:313.032
    },
    {
      id:'lake-saiko', src:'assets/audio/nature/nature_lake_saiko_japan.mp3',
      title:'Lake Saiko Waves', kind:'Lakeshore waves', where:'Fujikawaguchiko, Yamanashi, Japan',
      detail:'Lake Saiko', artist:'Mike Blow', year:'2026', duration:218.400
    },
    {
      id:'upo-dawn', src:'assets/audio/nature/nature_upo_wetland_dawn_korea.mp3',
      title:'Early Summer Dawn', kind:'Wetland dawn soundscape', where:'Upo Wetland, South Korea',
      detail:'Early summer dawn near the wetland', artist:'abyssence', year:'2026', duration:785.688
    }
  ];

  const SESSION_KEY='cellquation.natureAudio.session.v1';
  const OLD_SESSION_KEY='cellquation.ambient.v077a4';
  const VOL_KEY='cellquation.ambient.volume';
  const MUTE_KEY='cellquation.ambient.muted';
  const MODE_KEY='cellquation.natureAudio.mode';
  const TRACK_KEY='cellquation.natureAudio.track';
  const DEFAULT_VOLUME=.62;
  const gestureTypes=['pointerdown','touchstart','keydown'];

  let audio=null, armed=false, desired=true, startPromise=null, changingTrack=false;
  let uiBound=false, scrollTimer=0, requestedIndex=null, userScrollIntent=false, suppressScrollSelection=false, trackChangeToken=0;

  const clamp01=n=>Math.max(0,Math.min(1,n));
  const safeGet=(store,key)=>{try{return store.getItem(key)}catch{return null}};
  const safeSet=(store,key,value)=>{try{store.setItem(key,value)}catch{}};
  let currentIndex=storedTrackIndex();
  requestedIndex=currentIndex;

  function readSession(){
    try{
      const raw=sessionStorage.getItem(SESSION_KEY);
      if(raw)return JSON.parse(raw)||{};
      // One-time migration from the old single-track ambience: preserve the user's
      // expectation that an already-started soundscape keeps playing after updating.
      const old=JSON.parse(sessionStorage.getItem(OLD_SESSION_KEY)||'{}');
      if(old.active===true){
        const migrated={active:true,trackId:TRACKS[currentIndex].id,phase:0,mode:getMode()};
        writeSession(migrated);return migrated;
      }
    }catch{}
    return {};
  }
  function writeSession(v){try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(v))}catch{}}
  function getStoredVolume(){
    const raw=safeGet(localStorage,VOL_KEY);if(raw===null||raw==='')return DEFAULT_VOLUME;
    const n=Number(raw);return Number.isFinite(n)?clamp01(n):DEFAULT_VOLUME;
  }
  function getStoredMuted(){return safeGet(localStorage,MUTE_KEY)==='1'}
  function getMode(){return safeGet(localStorage,MODE_KEY)==='single'?'single':'playlist'}
  function storedTrackIndex(){
    const id=safeGet(localStorage,TRACK_KEY);const i=TRACKS.findIndex(t=>t.id===id);return i>=0?i:0;
  }
  function storeTrackIndex(i){currentIndex=(i+TRACKS.length)%TRACKS.length;safeSet(localStorage,TRACK_KEY,TRACKS[currentIndex].id)}
  function normalizeTrackIndex(i){const n=Number(i);return ((Number.isFinite(n)?Math.trunc(n):0)%TRACKS.length+TRACKS.length)%TRACKS.length}
  function navigateTrack(delta){
    const base=Number.isFinite(requestedIndex)?requestedIndex:currentIndex;
    const target=normalizeTrackIndex(base+delta);
    requestedIndex=target;
    return explicitTrackChange(target,0,{autoplay:true,scroll:true});
  }

  function sessionPosition(){
    const st=readSession();
    const i=TRACKS.findIndex(t=>t.id===st.trackId);
    return {index:i>=0?i:storedTrackIndex(),phase:Math.max(0,Number(st.phase)||0),active:st.active===true};
  }

  function ensure(){
    if(audio)return audio;
    audio=new Audio();
    audio.preload='auto';audio.playsInline=true;audio.setAttribute('playsinline','');
    audio.volume=getStoredVolume();audio.muted=getStoredMuted();
    audio.addEventListener('play',()=>{syncControls();saveLiveCheckpoint()});
    audio.addEventListener('pause',syncControls);
    audio.addEventListener('volumechange',syncControls);
    audio.addEventListener('timeupdate',()=>{
      if(desired&&!audio.paused&&!changingTrack)saveLiveCheckpoint();
    });
    audio.addEventListener('ended',()=>{
      if(!desired)return;
      if(getMode()==='single')explicitTrackChange(currentIndex,0,{autoplay:true,scroll:false});
      else explicitTrackChange((currentIndex+1)%TRACKS.length,0,{autoplay:true,scroll:true});
    });
    audio.addEventListener('error',()=>{console.warn('[Cellquation nature audio] track unavailable',TRACKS[currentIndex]?.src);syncControls('error')});
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
      setTimeout(()=>{if(!done&&Number.isFinite(a.duration)&&a.duration>0)ok()},800);
    });
  }

  function loadTrack(i,phase=0){
    const a=ensure();storeTrackIndex(i);
    const t=TRACKS[currentIndex];
    changingTrack=true;
    if(a.src!==new URL(t.src,document.baseURI).href){a.src=t.src;a.load()}
    return waitForMetadata(a).then(()=>{
      const d=Number.isFinite(a.duration)&&a.duration>0?a.duration:t.duration;
      const p=d>0?Math.max(0,phase)%d:Math.max(0,phase);
      try{a.currentTime=p}catch{}
      changingTrack=false;syncControls();return a;
    }).catch(err=>{changingTrack=false;throw err});
  }

  function saveLiveCheckpoint(){
    if(!audio)return;
    const prior=readSession();
    writeSession({
      active:prior.active===true||(!audio.paused&&desired),
      trackId:TRACKS[currentIndex].id,
      phase:Number.isFinite(audio.currentTime)?Number(audio.currentTime):Math.max(0,Number(prior.phase)||0),
      mode:getMode()
    });
  }
  function markIntent(){
    const st=readSession();
    if(st.active===true)return;
    writeSession({active:true,trackId:TRACKS[currentIndex].id,phase:Math.max(0,Number(st.phase)||0),mode:getMode()});
  }

  async function start(){
    if(!desired)return false;
    const a=ensure();
    // HARD CONTINUITY INVARIANT: repeated actions while live are strict no-ops.
    if(!a.paused&&!a.ended&&!changingTrack){disarm();syncControls();return true}
    if(startPromise)return startPromise;
    markIntent();
    startPromise=(async()=>{
      try{
        const pos=sessionPosition();
        if(!a.src||currentIndex!==pos.index||a.readyState===0)await loadTrack(pos.index,pos.phase);
        else if(a.paused&&Number.isFinite(pos.phase)&&Math.abs((a.currentTime||0)-pos.phase)>.75){try{a.currentTime=pos.phase}catch{}}
        if(!desired)return false;
        if(a.paused||a.ended)await a.play();
        writeSession({active:true,trackId:TRACKS[currentIndex].id,phase:Number(a.currentTime)||0,mode:getMode()});
        disarm();syncControls();return true;
      }catch(err){
        console.warn('[Cellquation nature audio] waiting for user gesture',err?.message||err);
        arm();syncControls();return false;
      }finally{startPromise=null}
    })();
    return startPromise;
  }

  async function explicitTrackChange(index,phase=0,{autoplay=true,scroll=true}={}){
    const target=normalizeTrackIndex(index);
    const token=++trackChangeToken;
    requestedIndex=target;
    const a=ensure();const wasActive=readSession().active===true||(!a.paused&&desired);
    changingTrack=true;
    try{if(!a.paused)a.pause()}catch{}
    try{
      await loadTrack(target,phase);
      if(token!==trackChangeToken)return false;
      writeSession({active:wasActive||autoplay,trackId:TRACKS[currentIndex].id,phase:Number(a.currentTime)||0,mode:getMode()});
      if(scroll)scrollToTrack(currentIndex,false);
      if(autoplay&&desired){
        try{await a.play();disarm()}catch{arm()}
      }
      return true;
    }finally{if(token===trackChangeToken){changingTrack=false;syncControls()}}
  }

  function setMode(mode){
    const next=mode==='single'?'single':'playlist';safeSet(localStorage,MODE_KEY,next);
    const st=readSession();writeSession({...st,mode:next,trackId:TRACKS[currentIndex].id,phase:Number(audio?.currentTime)||Number(st.phase)||0});
    syncControls();
  }
  function setVolume(v){
    const n=clamp01(Number(v)||0);safeSet(localStorage,VOL_KEY,String(n));const a=ensure();a.volume=n;
    if(n>0&&desired&&a.paused&&readSession().active===true)start();syncControls();
  }
  function setMuted(muted){
    const m=!!muted;safeSet(localStorage,MUTE_KEY,m?'1':'0');const a=ensure();a.muted=m;
    if(!m&&desired&&a.paused&&readSession().active===true)start();syncControls();
  }

  function pauseForDocumentExit(){
    if(!audio)return;
    saveLiveCheckpoint();try{audio.pause()}catch{}
  }
  function gesture(){if(desired)start()}
  function arm(){if(armed)return;armed=true;gestureTypes.forEach(t=>window.addEventListener(t,gesture,{capture:true,passive:true}))}
  function disarm(){if(!armed)return;armed=false;gestureTypes.forEach(t=>window.removeEventListener(t,gesture,{capture:true}))}

  function trackCardMarkup(t,i){
    return `<button type="button" class="cq-nature-card" data-cq-track-index="${i}" role="option" aria-selected="false">
      <span class="cq-nature-card__count">${String(i+1).padStart(2,'0')} / ${String(TRACKS.length).padStart(2,'0')}</span>
      <strong>${escapeHtml(t.title)}</strong>
      <span class="cq-nature-card__kind">${escapeHtml(t.kind)}</span>
      <span class="cq-nature-card__where">${escapeHtml(t.where)}</span>
      <small>${escapeHtml(t.artist)} · ${escapeHtml(t.year)} · radio aporee</small>
    </button>`;
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function buildSettingsUI(){
    const card=document.querySelector('.pause-card');if(!card)return;
    const eyebrow=card.querySelector(':scope > small');if(eyebrow)eyebrow.textContent='SETTINGS';
    const title=card.querySelector('h2');if(title&&!card.dataset.cqUnifiedSettings)title.textContent='Soundscape';
    const old=card.querySelector('.pause-audio');
    if(old){
      old.className='cq-sound-settings';
      old.setAttribute('aria-label','Nature sound settings');
      old.innerHTML=`
        <div class="cq-sound-head"><div><span>NATURE SOUNDS</span><strong data-cq-now-title>${escapeHtml(TRACKS[currentIndex].title)}</strong></div><em data-cq-ambient-status>Tap to start</em></div>
        <div class="cq-sound-mode" role="group" aria-label="Playback mode">
          <button type="button" data-cq-audio-mode="playlist">↻ Continuous playlist</button>
          <button type="button" data-cq-audio-mode="single">1 One sound</button>
        </div>
        <div class="cq-nature-carousel-shell">
          <button type="button" class="cq-nature-nav" data-cq-track-prev aria-label="Previous nature sound">‹</button>
          <div class="cq-nature-carousel" data-cq-track-carousel role="listbox" aria-label="Nature sounds">
            ${TRACKS.map(trackCardMarkup).join('')}
          </div>
          <button type="button" class="cq-nature-nav" data-cq-track-next aria-label="Next nature sound">›</button>
        </div>
        <div class="cq-sound-volume">
          <label for="ambientVolume">Volume</label>
          <input id="ambientVolume" data-cq-ambient-volume type="range" min="0" max="100" step="1" value="62" aria-label="Nature sound volume">
          <output data-cq-ambient-value>62%</output>
          <button type="button" data-cq-ambient-toggle aria-pressed="false">Mute</button>
        </div>`;
    }
    const done=card.querySelector('#resumeOverlay');if(done)done.textContent='Done';
  }

  function bindSettingsUI(){
    if(uiBound)return;uiBound=true;buildSettingsUI();
    document.querySelectorAll('[data-cq-ambient-volume]').forEach(el=>{
      el.value=String(Math.round(getStoredVolume()*100));
      el.addEventListener('input',()=>setVolume(Number(el.value)/100));
    });
    document.querySelectorAll('[data-cq-ambient-toggle]').forEach(el=>el.addEventListener('click',()=>setMuted(!ensure().muted)));
    document.querySelectorAll('[data-cq-audio-mode]').forEach(el=>el.addEventListener('click',()=>setMode(el.dataset.cqAudioMode)));
    document.querySelectorAll('[data-cq-track-index]').forEach(el=>el.addEventListener('click',()=>{
      const i=Number(el.dataset.cqTrackIndex);if(i===currentIndex&&readSession().active===true)return;explicitTrackChange(i,0,{autoplay:true,scroll:true});
    }));
    document.querySelector('[data-cq-track-prev]')?.addEventListener('click',()=>navigateTrack(-1));
    document.querySelector('[data-cq-track-next]')?.addEventListener('click',()=>navigateTrack(1));
    const carousel=document.querySelector('[data-cq-track-carousel]');
    if(carousel){
      // Only a real user swipe/wheel may turn scrolling into a track selection.
      // scrollToTrack() itself must never feed back into selection.
      const markUserScroll=()=>{userScrollIntent=true;suppressScrollSelection=false};
      carousel.addEventListener('pointerdown',markUserScroll,{passive:true});
      carousel.addEventListener('touchstart',markUserScroll,{passive:true});
      carousel.addEventListener('wheel',markUserScroll,{passive:true});
      carousel.addEventListener('scroll',()=>{
        if(suppressScrollSelection||!userScrollIntent)return;
        clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{
          if(suppressScrollSelection||!userScrollIntent)return;
          const cards=[...carousel.querySelectorAll('[data-cq-track-index]')];if(!cards.length)return;
          const cr=carousel.getBoundingClientRect(),center=cr.left+cr.width/2;
          let best=cards[0],dist=Infinity;
          cards.forEach(c=>{const r=c.getBoundingClientRect(),d=Math.abs((r.left+r.width/2)-center);if(d<dist){best=c;dist=d}});
          const i=Number(best.dataset.cqTrackIndex);
          userScrollIntent=false;
          if(Number.isFinite(i)&&i!==currentIndex){requestedIndex=i;explicitTrackChange(i,0,{autoplay:true,scroll:false})}
        },180);
      },{passive:true});
    }
    syncControls();setTimeout(()=>scrollToTrack(currentIndex,false),0);
  }

  function scrollToTrack(i,smooth=true){
    const carousel=document.querySelector('[data-cq-track-carousel]');const card=carousel?.querySelector(`[data-cq-track-index="${normalizeTrackIndex(i)}"]`);if(!carousel||!card)return;
    suppressScrollSelection=true;
    userScrollIntent=false;
    clearTimeout(scrollTimer);
    const cr=carousel.getBoundingClientRect(),rr=card.getBoundingClientRect();
    const delta=(rr.left+rr.width/2)-(cr.left+cr.width/2);
    const maxLeft=Math.max(0,carousel.scrollWidth-carousel.clientWidth);
    const left=Math.max(0,Math.min(maxLeft,carousel.scrollLeft+delta));
    try{carousel.scrollTo({left,behavior:smooth?'smooth':'auto'})}catch{carousel.scrollLeft=left}
    setTimeout(()=>{suppressScrollSelection=false},smooth?520:80);
  }

  function syncControls(forceStatus=''){
    const a=audio,vol=Math.round((a?.volume??getStoredVolume())*100),muted=a?.muted??getStoredMuted();
    const st=readSession();const active=st.active===true;
    document.querySelectorAll('[data-cq-ambient-volume]').forEach(el=>{if(document.activeElement!==el)el.value=String(vol);el.setAttribute('aria-valuetext',`${vol}%`)});
    document.querySelectorAll('[data-cq-ambient-value]').forEach(el=>el.textContent=`${vol}%`);
    document.querySelectorAll('[data-cq-ambient-toggle]').forEach(el=>{el.textContent=muted?'Unmute':'Mute';el.setAttribute('aria-pressed',String(muted))});
    document.querySelectorAll('[data-cq-audio-mode]').forEach(el=>{const on=el.dataset.cqAudioMode===getMode();el.classList.toggle('is-active',on);el.setAttribute('aria-pressed',String(on))});
    document.querySelectorAll('[data-cq-track-index]').forEach(el=>{const on=Number(el.dataset.cqTrackIndex)===currentIndex;el.classList.toggle('is-active',on);el.setAttribute('aria-selected',String(on))});
    document.querySelectorAll('[data-cq-now-title]').forEach(el=>el.textContent=TRACKS[currentIndex].title);
    const status=forceStatus==='error'?'Audio unavailable':muted?'Muted':a&&!a.paused?'Playing':active?'Ready to resume':'Tap once to start';
    document.querySelectorAll('[data-cq-ambient-status]').forEach(el=>el.textContent=status);
  }

  window.CellquationAmbient={
    play:start,
    pause(){desired=false;const a=ensure();saveLiveCheckpoint();try{a.pause()}catch{};const st=readSession();writeSession({...st,active:false,trackId:TRACKS[currentIndex].id,phase:Number(a.currentTime)||0,mode:getMode()});syncControls()},
    resume(){desired=true;markIntent();return start()},
    setVolume,getVolume(){return ensure().volume},setMuted,getMuted(){return ensure().muted},
    setMode,getMode,
    previousTrack(){return navigateTrack(-1)},
    nextTrack(){return navigateTrack(1)},
    selectTrack(i){return explicitTrackChange(normalizeTrackIndex(i),0,{autoplay:true,scroll:true})},
    get tracks(){return TRACKS.map(t=>({...t}))},
    get playing(){return !!audio&&!audio.paused},
    get status(){return {playing:!!audio&&!audio.paused,muted:audio?.muted??getStoredMuted(),volume:audio?.volume??getStoredVolume(),track:TRACKS[currentIndex],mode:getMode(),currentTime:Number(audio?.currentTime)||Number(readSession().phase)||0}}
  };

  window.addEventListener('pagehide',pauseForDocumentExit);
  window.addEventListener('pageshow',()=>{desired=true;if(readSession().active===true)start();else arm()});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden')pauseForDocumentExit();
    else if(readSession().active===true){desired=true;start()}
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindSettingsUI,{once:true});else bindSettingsUI();
  if(readSession().active===true)start();else arm();
})();
