/* Cellquation v0.7.7a.14 — global short FX bus + final level-success cue. */
(function(){
  'use strict';
  const SRC='assets/audio/sfx/level_success_water.wav';
  const VOL_KEY='cellquation.fx.volume';
  const DEFAULT_VOLUME=.72;
  let audio=null,lastPlayed=0;
  const clamp01=n=>Math.max(0,Math.min(1,n));
  function storedVolume(){
    try{const raw=localStorage.getItem(VOL_KEY);if(raw===null||raw==='')return DEFAULT_VOLUME;const n=Number(raw);return Number.isFinite(n)?clamp01(n):DEFAULT_VOLUME}catch{return DEFAULT_VOLUME}
  }
  function applyVolume(){if(audio)audio.volume=storedVolume()}
  function ensure(){if(audio)return audio;audio=new Audio(SRC);audio.preload='auto';audio.volume=storedVolume();audio.setAttribute('playsinline','');return audio}
  function setVolume(v){const value=clamp01(Number(v)||0);try{localStorage.setItem(VOL_KEY,String(value))}catch{};applyVolume();return value}
  function success(){
    const now=performance.now();if(now-lastPlayed<900)return;lastPlayed=now;
    const a=ensure();applyVolume();if(a.volume<=0)return;
    try{a.pause();a.currentTime=0;const p=a.play();if(p?.catch)p.catch(()=>{})}catch{}
  }
  window.addEventListener('cellquation:fxvolumechange',e=>{const n=Number(e.detail?.volume);if(Number.isFinite(n)){if(audio)audio.volume=clamp01(n)}});
  window.addEventListener('storage',e=>{if(e.key===VOL_KEY)applyVolume()});
  window.CellquationSFX={success,setVolume,getVolume:storedVolume,preload(){ensure().load?.()}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>ensure(),{once:true});else ensure();
})();
