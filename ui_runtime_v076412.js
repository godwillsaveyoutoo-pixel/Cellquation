/* Cellquation v0.7.6.4.12 — shared lightweight browser/UI runtime. */
(function(){
  'use strict';
  const api={};
  const doc=document;
  let resultReturnFocus=null;
  function fsDoc(){try{return window.top&&window.top.document?window.top.document:doc}catch{return doc}}
  function fsElement(){const d=fsDoc();return d.fullscreenElement||d.webkitFullscreenElement||null}
  function fsSupported(){const d=fsDoc();return !!(d.documentElement.requestFullscreen||d.documentElement.webkitRequestFullscreen)}
  async function toggleFullscreen(){
    try{
      const d=fsDoc();
      if(fsElement()){const exit=d.exitFullscreen||d.webkitExitFullscreen;if(exit)await exit.call(d)}
      else{const req=d.documentElement.requestFullscreen||d.documentElement.webkitRequestFullscreen;if(req){try{await req.call(d.documentElement,{navigationUI:'hide'})}catch(_){await req.call(d.documentElement)}}}
    }catch(e){console.warn('Fullscreen unavailable',e)}
    syncFullscreen();
  }
  function syncFullscreen(){
    const active=!!fsElement();
    doc.querySelectorAll('[data-cq-fullscreen]').forEach(b=>{
      b.hidden=!fsSupported();b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');
      const label=b.querySelector('[data-fs-label]');if(label)label.textContent=active?'Exit fullscreen':'Fullscreen';
    });
  }
  function setPaused(paused){
    doc.body.classList.toggle('is-paused',!!paused);
    const overlay=doc.getElementById('pauseOverlay'),button=doc.getElementById('pause'),active=doc.activeElement;
    if(overlay){const wasInside=overlay.contains(active);overlay.hidden=!paused;overlay.setAttribute('aria-hidden',String(!paused));if(paused)requestAnimationFrame(()=>doc.getElementById('resumeOverlay')?.focus());else if(wasInside)requestAnimationFrame(()=>doc.getElementById('gl')?.focus())}
    if(button){button.textContent='Settings';button.setAttribute('aria-pressed',String(!!paused));button.setAttribute('aria-expanded',String(!!paused));button.setAttribute('aria-label',paused?'Close settings':'Open settings')}
  }
  function showResult(backdrop,focusTarget){
    if(!backdrop)return;resultReturnFocus=doc.activeElement;backdrop.classList.add('show');backdrop.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>{(focusTarget||backdrop.querySelector('button,[href],[tabindex="0"]'))?.focus()});
  }
  function hideResult(backdrop,{restoreFocus=false}={}){
    if(!backdrop)return;const wasInside=backdrop.contains(doc.activeElement);backdrop.classList.remove('show');backdrop.setAttribute('aria-hidden','true');
    if(restoreFocus&&resultReturnFocus&&resultReturnFocus.isConnected)resultReturnFocus.focus();else if(wasInside)requestAnimationFrame(()=>doc.getElementById('gl')?.focus());resultReturnFocus=null;
  }
  function trapDialog(e){
    if(e.key!=='Tab')return;const dialog=e.currentTarget.querySelector('[role="dialog"]')||e.currentTarget;
    const items=[...dialog.querySelectorAll('button:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])')].filter(x=>!x.hidden);
    if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus()}
  }
  function registerServiceWorker(){
    if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
  function init(){
    registerServiceWorker();
    doc.addEventListener('click',e=>{const b=e.target.closest?.('[data-cq-fullscreen]');if(!b)return;e.preventDefault();toggleFullscreen()});
    doc.getElementById('resumeOverlay')?.addEventListener('click',()=>doc.getElementById('pause')?.click());
    doc.querySelectorAll('.pause-overlay,.result-backdrop').forEach(x=>x.addEventListener('keydown',trapDialog));
    doc.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const pause=doc.getElementById('pauseOverlay');if(pause&&!pause.hidden){e.preventDefault();doc.getElementById('pause')?.click();}});
    syncFullscreen();
  }
  api.toggleFullscreen=toggleFullscreen;api.setPaused=setPaused;api.showResult=showResult;api.hideResult=hideResult;api.syncFullscreen=syncFullscreen;
  window.CellquationUI=api;
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
  doc.addEventListener('fullscreenchange',syncFullscreen);doc.addEventListener('webkitfullscreenchange',syncFullscreen);try{const d=fsDoc();if(d!==doc){d.addEventListener('fullscreenchange',syncFullscreen);d.addEventListener('webkitfullscreenchange',syncFullscreen)}}catch{}
})();
