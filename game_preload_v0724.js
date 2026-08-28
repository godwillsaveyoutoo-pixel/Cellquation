/* Cellquation v0.7.6.3 — smartphone level-loader warmup.
   Runs only on level/world selection pages. It warms the HTTP/module cache
   without creating a second WebGL context or render loop. */
(function(){
  const mode=document.body?.dataset?.mode||'';
  const configs={
    foundations:{module:'./foundation_game_v0611.js?v=0.7.6.3',data:['./content/runtime/FOUNDATIONS_30_RUNTIME.json']},
    network:{module:'./network_game_v0611.js?v=0.7.6.3',data:['./canonical/CellKit_Synapse_Animation_2026-08-17T00-32-48-952Z.json','./content/runtime/LIVING_NETWORKS_48_V28_RUNTIME.json','./content/full/LIVING_NETWORKS_LAYOUT_48_V060.json','./content/LIVING_NETWORKS_VISUAL_CONFIG_V053.json']},
    threefoundations:{module:'./threecolor_foundation_game_v071.js?v=0.7.6.3',data:['./content/threecolor/FOUNDATIONS_FULL_30_V071.json']},
    threenetwork:{module:'./threecolor_network_game_v071.js?v=0.7.6.3',data:['./canonical/CellKit_Synapse_Animation_2026-08-17T00-32-48-952Z.json','./content/threecolor/LIVING_NETWORKS_FULL_48_V071.json','./content/threecolor/LIVING_NETWORKS_LAYOUT_FULL_48_V071.json','./content/LIVING_NETWORKS_VISUAL_CONFIG_V053.json']}
  };
  const cfg=configs[mode]; if(!cfg)return;
  let started=false;
  function modulePreload(href){
    if(document.querySelector(`link[rel="modulepreload"][href="${href}"]`))return;
    const l=document.createElement('link');l.rel='modulepreload';l.href=href;document.head.appendChild(l);
  }
  function warm(){
    if(started)return;started=true;
    modulePreload(cfg.module);
    // These are shared heavy modules; explicit warmup helps browsers that do
    // not recursively process all modulepreload dependencies until evaluation.
    modulePreload('./cellkit_latest/renderer.js?v=0.7.8d');
    modulePreload('./cellkit_latest/profiles.js?v=0.12.3.4');
    modulePreload('./cellkit_latest/transition.js?v=0.12.3.2');
    if(mode.includes('network')){
      modulePreload('./runtime/synapse_renderer_v053.js?v=0.7.6.4');
    }
    Promise.allSettled(cfg.data.map(url=>fetch(url,{cache:'force-cache'})));
    // Warm the tiny HUD assets too; this avoids late image decode on some phones.
    for(const src of ['./assets/ui/hud_goal_blue.png?v=0.7.7a.8','./assets/ui/hud_goal_green.png?v=0.7.7a.8','./assets/ui/hud_goal_violet.png?v=0.7.7a.8']){const img=new Image();img.decoding='async';img.src=src}
  }
  // Do not compete with first paint of the selector, but start very soon after it.
  if('requestIdleCallback' in window)requestIdleCallback(warm,{timeout:180});else setTimeout(warm,70);
  // A fast tap should immediately promote warmup instead of waiting for idle.
  document.addEventListener('pointerdown',e=>{if(e.target.closest('a[href*="play.html"]'))warm()},{passive:true,capture:true});
  window.__CQ_PRELOAD__={mode,warm,get started(){return started}};
})();
