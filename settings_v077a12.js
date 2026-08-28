/* Cellquation v0.7.7a.13 — unified Settings + persistent playfield backgrounds. */
(function(){
  'use strict';
  const BG_KEY='cellquation.settings.background.v1';
  const BACKGROUNDS=[
    {id:'abyss',title:'Abyss Void',desc:'Deep, sparse and calm.',src:'assets/backgrounds/options/abyss_void.png',thumb:'assets/backgrounds/thumbs/abyss_void.jpg',pos:'50% 50%'},
    {id:'reef',title:'Bioluminescent Reef',desc:'Lively glowing life and stronger contrast.',src:'assets/backgrounds/options/bioluminescent_reef.png',thumb:'assets/backgrounds/thumbs/bioluminescent_reef.jpg',pos:'50% 50%'},
    {id:'trench',title:'Midnight Trench',desc:'Very dark, quiet and focused.',src:'assets/backgrounds/options/midnight_trench.png',thumb:'assets/backgrounds/thumbs/midnight_trench.jpg',pos:'50% 52%'},
    {id:'emerald',title:'Emerald Depths',desc:'Teal-green flora with organic depth.',src:'assets/backgrounds/options/emerald_depths.png',thumb:'assets/backgrounds/thumbs/emerald_depths.jpg',pos:'50% 50%'},
    {id:'quiet',title:'Quiet Ocean',desc:'Soft open water with minimal visual noise.',src:'assets/backgrounds/options/quiet_ocean.png',thumb:'assets/backgrounds/thumbs/quiet_ocean.jpg',pos:'50% 48%'}
  ];
  let currentIndex=normalizeIndex(readStoredIndex());
  let backgroundRequest=0;
  let bgScrollIntent=false,bgSuppressScroll=false,bgScrollTimer=0;
  function backgroundDetail(i=currentIndex){
    const index=normalizeIndex(i),bg=BACKGROUNDS[index];
    const bits=String(bg.pos||'50% 50%').trim().split(/\s+/);
    const y=Number(String(bits[1]||'50%').replace('%',''));
    return {...bg,index,positionY:Number.isFinite(y)?Math.max(0,Math.min(1,y/100)):0.5};
  }
  function announceBackground(i=currentIndex){
    const detail=backgroundDetail(i);
    window.CellquationBackgroundState=detail;
    try{window.dispatchEvent(new CustomEvent('cellquation:backgroundchange',{detail}))}catch{}
    return detail;
  }
  function normalizeIndex(v){const n=Number(v);return Number.isFinite(n)?((Math.round(n)%BACKGROUNDS.length)+BACKGROUNDS.length)%BACKGROUNDS.length:0}
  function readStoredIndex(){try{const id=localStorage.getItem(BG_KEY);const i=BACKGROUNDS.findIndex(x=>x.id===id);return i>=0?i:0}catch{return 0}}
  function saveIndex(i){try{localStorage.setItem(BG_KEY,BACKGROUNDS[i].id)}catch{}}
  function cssUrl(src){return `url("${String(src).replace(/"/g,'%22')}")`}
  function applyNow(i){
    currentIndex=normalizeIndex(i);const bg=BACKGROUNDS[currentIndex],root=document.documentElement;
    root.style.setProperty('--cq-playfield-bg',cssUrl(bg.src));
    root.style.setProperty('--cq-playfield-pos',bg.pos||'50% 50%');
    root.dataset.cqBackground=bg.id;
    saveIndex(currentIndex);announceBackground(currentIndex);syncBackgroundUI();
  }
  function selectBackground(i,{preload=true,scroll=true}={}){
    i=normalizeIndex(i);const bg=BACKGROUNDS[i];const token=++backgroundRequest;
    if(scroll)scrollBackgroundTo(i,true);
    if(!preload){applyNow(i);return Promise.resolve(bg)}
    document.documentElement.classList.add('cq-background-loading');
    return new Promise(resolve=>{
      const image=new Image();
      image.onload=()=>{if(token===backgroundRequest)applyNow(i);document.documentElement.classList.remove('cq-background-loading');resolve(bg)};
      image.onerror=()=>{document.documentElement.classList.remove('cq-background-loading');resolve(bg)};
      image.src=bg.src;
    });
  }
  // Apply the persisted choice immediately so there is no default-background flash.
  {const bg=BACKGROUNDS[currentIndex],root=document.documentElement;root.style.setProperty('--cq-playfield-bg',cssUrl(bg.src));root.style.setProperty('--cq-playfield-pos',bg.pos);root.dataset.cqBackground=bg.id;window.CellquationBackgroundState=backgroundDetail(currentIndex);}

  function gearSvg(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.12.38.35.72.66.98.31.26.7.4 1.1.42H21v4h-.1a1.7 1.7 0 0 0-1.5.6Z"/></svg>'}
  function ensureMenuTriggers(){
    if(document.body.dataset.screen==='play')return;
    const homeTools=document.querySelector('.cq-home-tools');
    if(homeTools&&!homeTools.querySelector('[data-cq-settings-open]')){
      homeTools.innerHTML=`<button type="button" class="cq-icon-button cq-settings-trigger" data-cq-settings-open aria-label="Open settings">${gearSvg()}<span>Settings</span></button>`;
    }
    const topbar=document.querySelector('.cq-topbar');
    if(topbar&&!topbar.querySelector('[data-cq-settings-open]')){
      const b=document.createElement('button');b.type='button';b.className='cq-icon-button cq-settings-trigger';b.dataset.cqSettingsOpen='';b.setAttribute('aria-label','Open settings');b.innerHTML=gearSvg()+'<span>Settings</span>';topbar.append(b);
    }
  }
  function menuOverlay(){
    let overlay=document.getElementById('settingsOverlay');if(overlay)return overlay;
    overlay=document.createElement('div');overlay.id='settingsOverlay';overlay.className='pause-overlay cq-menu-settings-overlay';overlay.hidden=true;overlay.setAttribute('aria-hidden','true');overlay.innerHTML=`<section class="pause-card" role="dialog" aria-modal="true" aria-labelledby="settingsTitle"><small>SETTINGS</small><h2 id="settingsTitle">Preferences</h2><div class="pause-audio" aria-label="Nature sound settings"><div class="pause-audio__head"><label for="ambientVolume">Ambience</label><span data-cq-ambient-status>Tap once to start</span></div><div class="pause-audio__row"><input id="ambientVolume" data-cq-ambient-volume type="range" min="0" max="100" step="1" value="62" aria-label="Ambient volume"><output data-cq-ambient-value>62%</output><button type="button" data-cq-ambient-toggle aria-pressed="false">Mute</button></div></div><div class="pause-actions"><button type="button" id="settingsDone" class="primary">Done</button></div></section>`;
    document.body.append(overlay);return overlay;
  }
  function backgroundCard(bg,i){
    return `<button type="button" class="cq-background-card" data-cq-background-index="${i}" role="option" aria-selected="false"><img src="${bg.thumb}" alt=""><span class="cq-background-card__count">${String(i+1).padStart(2,'0')} / ${String(BACKGROUNDS.length).padStart(2,'0')}</span><strong>${bg.title}</strong><small>${bg.desc}</small></button>`;
  }
  function displayMarkup(){return `<section class="cq-display-settings" aria-label="Display settings"><div class="cq-display-head"><div><span>PLAYFIELD BACKGROUND</span><strong data-cq-background-title>${BACKGROUNDS[currentIndex].title}</strong></div><em>Swipe to choose</em></div><div class="cq-background-carousel-shell"><button type="button" class="cq-background-nav" data-cq-background-prev aria-label="Previous background">‹</button><div class="cq-background-carousel" data-cq-background-carousel role="listbox" aria-label="Playfield backgrounds">${BACKGROUNDS.map(backgroundCard).join('')}</div><button type="button" class="cq-background-nav" data-cq-background-next aria-label="Next background">›</button></div><div class="cq-display-actions"><button type="button" data-cq-fullscreen><span class="cq-fullscreen-icon">⛶</span><span data-fs-label>Fullscreen</span></button></div></section>`}
  function upgradeSettingsCard(){
    const isPlay=document.body.dataset.screen==='play';let overlay=isPlay?document.getElementById('pauseOverlay'):menuOverlay();if(!overlay)return;
    const card=overlay.querySelector('.pause-card');if(!card||card.dataset.cqUnifiedSettings==='1')return;card.dataset.cqUnifiedSettings='1';
    const title=card.querySelector('h2');if(title)title.textContent='Preferences';
    const audio=card.querySelector('.pause-audio,.cq-sound-settings');if(!audio)return;
    const tabs=document.createElement('div');tabs.className='cq-settings-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Settings sections');tabs.innerHTML='<button type="button" class="is-active" data-cq-settings-tab="sound" role="tab" aria-selected="true">Sound</button><button type="button" data-cq-settings-tab="display" role="tab" aria-selected="false">Display</button>';
    const soundPanel=document.createElement('div');soundPanel.className='cq-settings-panel';soundPanel.dataset.cqSettingsPanel='sound';audio.before(soundPanel);soundPanel.append(audio);
    const displayPanel=document.createElement('div');displayPanel.className='cq-settings-panel';displayPanel.dataset.cqSettingsPanel='display';displayPanel.hidden=true;displayPanel.innerHTML=displayMarkup();soundPanel.before(tabs);soundPanel.after(displayPanel);
    const actions=card.querySelector('.pause-actions');if(actions){actions.querySelectorAll('[data-cq-fullscreen]').forEach(b=>b.remove())}
    bindCard(card);syncBackgroundUI();setTimeout(()=>scrollBackgroundTo(currentIndex,false),0);window.CellquationUI?.syncFullscreen?.();
  }
  function setTab(card,name){
    card.querySelectorAll('[data-cq-settings-tab]').forEach(b=>{const on=b.dataset.cqSettingsTab===name;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',String(on))});
    card.querySelectorAll('[data-cq-settings-panel]').forEach(p=>p.hidden=p.dataset.cqSettingsPanel!==name);
    if(name==='display')setTimeout(()=>scrollBackgroundTo(currentIndex,false),0);
  }
  function bindCard(card){
    card.querySelectorAll('[data-cq-settings-tab]').forEach(b=>b.addEventListener('click',()=>setTab(card,b.dataset.cqSettingsTab)));
    card.querySelectorAll('[data-cq-background-index]').forEach(b=>b.addEventListener('click',()=>selectBackground(Number(b.dataset.cqBackgroundIndex),{preload:true,scroll:true})));
    card.querySelector('[data-cq-background-prev]')?.addEventListener('click',()=>selectBackground(currentIndex-1,{preload:true,scroll:true}));
    card.querySelector('[data-cq-background-next]')?.addEventListener('click',()=>selectBackground(currentIndex+1,{preload:true,scroll:true}));
    const carousel=card.querySelector('[data-cq-background-carousel]');if(carousel){
      const mark=()=>{bgScrollIntent=true;bgSuppressScroll=false};carousel.addEventListener('pointerdown',mark,{passive:true});carousel.addEventListener('touchstart',mark,{passive:true});carousel.addEventListener('wheel',mark,{passive:true});
      carousel.addEventListener('scroll',()=>{if(bgSuppressScroll||!bgScrollIntent)return;clearTimeout(bgScrollTimer);bgScrollTimer=setTimeout(()=>{if(bgSuppressScroll||!bgScrollIntent)return;const cards=[...carousel.querySelectorAll('[data-cq-background-index]')];if(!cards.length)return;const cr=carousel.getBoundingClientRect(),center=cr.left+cr.width/2;let best=cards[0],dist=Infinity;cards.forEach(c=>{const r=c.getBoundingClientRect(),d=Math.abs((r.left+r.width/2)-center);if(d<dist){best=c;dist=d}});bgScrollIntent=false;const i=Number(best.dataset.cqBackgroundIndex);if(Number.isFinite(i)&&i!==currentIndex)selectBackground(i,{preload:true,scroll:false})},170)},{passive:true});
    }
  }
  function scrollBackgroundTo(i,smooth=true){
    const carousel=document.querySelector('[data-cq-background-carousel]');const card=carousel?.querySelector(`[data-cq-background-index="${normalizeIndex(i)}"]`);if(!carousel||!card)return;
    bgSuppressScroll=true;bgScrollIntent=false;clearTimeout(bgScrollTimer);
    const cr=carousel.getBoundingClientRect(),rr=card.getBoundingClientRect();
    const delta=(rr.left+rr.width/2)-(cr.left+cr.width/2);
    const maxLeft=Math.max(0,carousel.scrollWidth-carousel.clientWidth);
    const left=Math.max(0,Math.min(maxLeft,carousel.scrollLeft+delta));
    try{carousel.scrollTo({left,behavior:smooth?'smooth':'auto'})}catch{carousel.scrollLeft=left}
    setTimeout(()=>{bgSuppressScroll=false},smooth?500:70);
  }
  function syncBackgroundUI(){
    document.querySelectorAll('[data-cq-background-index]').forEach(b=>{const on=Number(b.dataset.cqBackgroundIndex)===currentIndex;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',String(on))});
    document.querySelectorAll('[data-cq-background-title]').forEach(x=>x.textContent=BACKGROUNDS[currentIndex].title);
  }
  function openMenuSettings(){const overlay=document.getElementById('settingsOverlay');if(!overlay)return;overlay.hidden=false;overlay.setAttribute('aria-hidden','false');document.body.classList.add('is-settings-open');requestAnimationFrame(()=>overlay.querySelector('[data-cq-settings-tab]')?.focus())}
  function closeMenuSettings(){const overlay=document.getElementById('settingsOverlay');if(!overlay)return;const wasInside=overlay.contains(document.activeElement);overlay.hidden=true;overlay.setAttribute('aria-hidden','true');document.body.classList.remove('is-settings-open');if(wasInside)document.querySelector('[data-cq-settings-open]')?.focus()}
  function bindMenuOverlay(){
    document.querySelectorAll('[data-cq-settings-open]').forEach(b=>b.addEventListener('click',openMenuSettings));
    document.getElementById('settingsDone')?.addEventListener('click',closeMenuSettings);
    document.getElementById('settingsOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeMenuSettings()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('settingsOverlay')?.hidden){e.preventDefault();closeMenuSettings()}});
  }
  function init(){ensureMenuTriggers();upgradeSettingsCard();bindMenuOverlay();syncBackgroundUI()}
  window.CellquationSettings={backgrounds:BACKGROUNDS.map((_,i)=>backgroundDetail(i)),get background(){return backgroundDetail(currentIndex)},selectBackground};
  window.CellquationBackgrounds={get current(){return backgroundDetail(currentIndex)},get options(){return BACKGROUNDS.map((_,i)=>backgroundDetail(i))},select(i){return selectBackground(i,{preload:true,scroll:true})}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
