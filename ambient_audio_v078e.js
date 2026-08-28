/* Cellquation v0.7.8e — settings/client bridge to the persistent top-level audio host. */
(()=>{
  'use strict';
  let HOST=null;try{HOST=(window.parent&&window.parent!==window)?window.parent.CellquationAmbientHost:null}catch{}
  if(!HOST){console.warn('[Cellquation audio] persistent host unavailable');return}
  const TRACKS=HOST.tracks;
  let currentIndex=Math.max(0,Math.min(TRACKS.length-1,Number(HOST.status.index)||0));
  let uiBound=false,scrollTimer=0,userScrollIntent=false,suppressScrollSelection=false,pollTimer=0;
  const gestureTypes=['pointerdown','touchstart','keydown'];let armed=false;
  const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=i=>((Math.trunc(Number(i)||0)%TRACKS.length)+TRACKS.length)%TRACKS.length;
  function cardFoot(t){return t.id==='scott-things'?`${escapeHtml(t.artist)} · ${escapeHtml(t.year)} · CC BY 4.0`:`${escapeHtml(t.artist)} · ${escapeHtml(t.year)} · ${escapeHtml(t.sourceLabel||'radio aporee')}`}
  function trackCardMarkup(t,i){return `<button type="button" class="cq-nature-card" data-cq-track-index="${i}" role="option" aria-selected="false"><span class="cq-nature-card__count">${String(i+1).padStart(2,'0')} / ${String(TRACKS.length).padStart(2,'0')}</span><strong>${escapeHtml(t.title)}</strong><span class="cq-nature-card__kind">${escapeHtml(t.kind)}</span><span class="cq-nature-card__where">${escapeHtml(t.where)}</span><small>${cardFoot(t)}</small></button>`}
  function buildSettingsUI(){
    const card=document.querySelector('.pause-card');if(!card)return;
    const eyebrow=card.querySelector(':scope > small');if(eyebrow)eyebrow.textContent='SETTINGS';
    const title=card.querySelector('h2');if(title&&!card.dataset.cqUnifiedSettings)title.textContent='Soundscape';
    const old=card.querySelector('.pause-audio');
    if(old){
      old.className='cq-sound-settings';old.setAttribute('aria-label','Background audio settings');
      old.innerHTML=`<div class="cq-sound-head"><div><span>BACKGROUND AUDIO</span><strong data-cq-now-title>${escapeHtml(TRACKS[currentIndex].title)}</strong></div><em data-cq-ambient-status>Tap to start</em></div><div class="cq-sound-mode" role="group" aria-label="Playback mode"><button type="button" data-cq-audio-mode="playlist">↻ Continuous playlist</button><button type="button" data-cq-audio-mode="single">1 One sound</button></div><div class="cq-nature-carousel-shell"><button type="button" class="cq-nature-nav" data-cq-track-prev aria-label="Previous sound">‹</button><div class="cq-nature-carousel" data-cq-track-carousel role="listbox" aria-label="Background sounds">${TRACKS.map(trackCardMarkup).join('')}</div><button type="button" class="cq-nature-nav" data-cq-track-next aria-label="Next sound">›</button></div><div class="cq-sound-volume"><label for="ambientVolume">Ambience</label><input id="ambientVolume" data-cq-ambient-volume type="range" min="0" max="100" step="1" value="62" aria-label="Background audio volume"><output data-cq-ambient-value>62%</output><button type="button" data-cq-ambient-toggle aria-pressed="false">Mute</button></div><div class="cq-sound-volume cq-fx-volume"><label for="fxVolume">FX</label><input id="fxVolume" data-cq-fx-volume type="range" min="0" max="100" step="1" value="72" aria-label="Sound effects volume"><output data-cq-fx-value>72%</output><span class="cq-fx-caption">Effects</span></div>`;
    }
    const done=card.querySelector('#resumeOverlay');if(done)done.textContent='Done';
  }
  function hostStatus(){try{return HOST.status}catch{return {index:currentIndex,playing:false,active:false,volume:.62,fxVolume:.72,muted:false,mode:'playlist',track:TRACKS[currentIndex]}}}
  function syncControls({followTrack=false}={}){
    const st=hostStatus(),next=normalize(st.index);const changed=next!==currentIndex;currentIndex=next;
    const vol=Math.round((Number(st.volume)||0)*100),fx=Math.round((Number(st.fxVolume)||0)*100);
    document.querySelectorAll('[data-cq-ambient-volume]').forEach(el=>{if(document.activeElement!==el)el.value=String(vol);el.setAttribute('aria-valuetext',`${vol}%`)});
    document.querySelectorAll('[data-cq-ambient-value]').forEach(el=>el.textContent=`${vol}%`);
    document.querySelectorAll('[data-cq-fx-volume]').forEach(el=>{if(document.activeElement!==el)el.value=String(fx);el.setAttribute('aria-valuetext',`${fx}%`)});
    document.querySelectorAll('[data-cq-fx-value]').forEach(el=>el.textContent=`${fx}%`);
    document.querySelectorAll('[data-cq-ambient-toggle]').forEach(el=>{el.textContent=st.muted?'Unmute':'Mute';el.setAttribute('aria-pressed',String(!!st.muted))});
    document.querySelectorAll('[data-cq-audio-mode]').forEach(el=>{const on=el.dataset.cqAudioMode===st.mode;el.classList.toggle('is-active',on);el.setAttribute('aria-pressed',String(on))});
    document.querySelectorAll('[data-cq-track-index]').forEach(el=>{const on=Number(el.dataset.cqTrackIndex)===currentIndex;el.classList.toggle('is-active',on);el.setAttribute('aria-selected',String(on))});
    document.querySelectorAll('[data-cq-now-title]').forEach(el=>el.textContent=TRACKS[currentIndex]?.title||'Background audio');
    const label=st.muted?'Muted':st.playing?'Playing':st.active?'Ready to resume':'Tap once to start';document.querySelectorAll('[data-cq-ambient-status]').forEach(el=>el.textContent=label);
    if(st.playing)disarm();else if(!st.active)arm();
    if((followTrack&&changed))scrollToTrack(currentIndex,false);
  }
  function scrollToTrack(i,smooth=true){
    const carousel=document.querySelector('[data-cq-track-carousel]'),card=carousel?.querySelector(`[data-cq-track-index="${normalize(i)}"]`);if(!carousel||!card)return;
    suppressScrollSelection=true;userScrollIntent=false;clearTimeout(scrollTimer);
    const cr=carousel.getBoundingClientRect(),rr=card.getBoundingClientRect(),delta=(rr.left+rr.width/2)-(cr.left+cr.width/2),max=Math.max(0,carousel.scrollWidth-carousel.clientWidth),left=Math.max(0,Math.min(max,carousel.scrollLeft+delta));
    try{carousel.scrollTo({left,behavior:smooth?'smooth':'auto'})}catch{carousel.scrollLeft=left}
    setTimeout(()=>{suppressScrollSelection=false},smooth?520:80);
  }
  async function selectTrack(i,{scroll=true}={}){await HOST.selectTrack(normalize(i));syncControls();if(scroll)scrollToTrack(currentIndex,false)}
  async function navigate(delta){const base=Number(hostStatus().index)||0;await selectTrack(base+delta,{scroll:true})}
  function bindSettingsUI(){
    if(uiBound)return;uiBound=true;buildSettingsUI();
    document.querySelectorAll('[data-cq-ambient-volume]').forEach(el=>el.addEventListener('input',()=>{HOST.setVolume(Number(el.value)/100);syncControls()}));
    document.querySelectorAll('[data-cq-ambient-toggle]').forEach(el=>el.addEventListener('click',()=>{HOST.setMuted(!hostStatus().muted);syncControls()}));
    document.querySelectorAll('[data-cq-fx-volume]').forEach(el=>el.addEventListener('input',()=>{const v=Number(el.value)/100;HOST.setFxVolume(v);try{window.dispatchEvent(new CustomEvent('cellquation:fxvolumechange',{detail:{volume:v}}))}catch{};syncControls()}));
    document.querySelectorAll('[data-cq-audio-mode]').forEach(el=>el.addEventListener('click',()=>{HOST.setMode(el.dataset.cqAudioMode);syncControls()}));
    document.querySelectorAll('[data-cq-track-index]').forEach(el=>el.addEventListener('click',()=>selectTrack(Number(el.dataset.cqTrackIndex),{scroll:true})));
    document.querySelector('[data-cq-track-prev]')?.addEventListener('click',()=>navigate(-1));
    document.querySelector('[data-cq-track-next]')?.addEventListener('click',()=>navigate(1));
    const carousel=document.querySelector('[data-cq-track-carousel]');if(carousel){
      const mark=()=>{userScrollIntent=true;suppressScrollSelection=false};carousel.addEventListener('pointerdown',mark,{passive:true});carousel.addEventListener('touchstart',mark,{passive:true});carousel.addEventListener('wheel',mark,{passive:true});
      carousel.addEventListener('scroll',()=>{if(suppressScrollSelection||!userScrollIntent)return;clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{if(suppressScrollSelection||!userScrollIntent)return;const cards=[...carousel.querySelectorAll('[data-cq-track-index]')];if(!cards.length)return;const cr=carousel.getBoundingClientRect(),center=cr.left+cr.width/2;let best=cards[0],dist=Infinity;for(const c of cards){const r=c.getBoundingClientRect(),d=Math.abs((r.left+r.width/2)-center);if(d<dist){dist=d;best=c}}userScrollIntent=false;const i=Number(best.dataset.cqTrackIndex);if(Number.isFinite(i)&&i!==currentIndex)selectTrack(i,{scroll:false})},180)},{passive:true});
    }
    syncControls();setTimeout(()=>scrollToTrack(currentIndex,false),0);
    pollTimer=setInterval(()=>syncControls({followTrack:true}),350);
  }
  function gesture(){HOST.play().then(()=>syncControls()).catch(()=>{});}
  function arm(){if(armed)return;armed=true;gestureTypes.forEach(t=>window.addEventListener(t,gesture,{capture:true,passive:true}))}
  function disarm(){if(!armed)return;armed=false;gestureTypes.forEach(t=>window.removeEventListener(t,gesture,{capture:true}))}
  window.CellquationAmbient={
    play:()=>HOST.play(),pause:()=>HOST.pause(),resume:()=>HOST.resume(),setVolume:v=>HOST.setVolume(v),getVolume:()=>HOST.getVolume(),setMuted:m=>HOST.setMuted(m),getMuted:()=>HOST.getMuted(),setFxVolume:v=>{const n=HOST.setFxVolume(v);try{window.dispatchEvent(new CustomEvent('cellquation:fxvolumechange',{detail:{volume:Number(v)||0}}))}catch{};return n},getFxVolume:()=>HOST.getFxVolume(),setMode:m=>HOST.setMode(m),getMode:()=>HOST.getMode(),previousTrack:()=>HOST.previousTrack(),nextTrack:()=>HOST.nextTrack(),selectTrack:i=>HOST.selectTrack(i),get tracks(){return HOST.tracks},get playing(){return HOST.status.playing},get status(){return HOST.status}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindSettingsUI,{once:true});else bindSettingsUI();
  if(!hostStatus().playing)arm();
  window.addEventListener('pagehide',()=>{if(pollTimer)clearInterval(pollTimer)});
})();
