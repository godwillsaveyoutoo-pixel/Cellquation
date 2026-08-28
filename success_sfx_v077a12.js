/* Cellquation v0.7.7a.12 — completion cue. Separate from ambience by design. */
(function(){
  'use strict';
  const SRC='assets/audio/sfx/level_success_harp.mp3';
  let audio=null,lastPlayed=0;
  function ensure(){if(audio)return audio;audio=new Audio(SRC);audio.preload='auto';audio.volume=.58;return audio}
  function success(){
    const now=performance.now();if(now-lastPlayed<900)return;lastPlayed=now;
    const a=ensure();try{a.pause();a.currentTime=0;const p=a.play();if(p?.catch)p.catch(()=>{})}catch{}
  }
  window.CellquationSFX={success,preload(){ensure().load?.()}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>ensure(),{once:true});else ensure();
})();
