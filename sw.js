/* Cellquation v0.7.7a.8 — Target Cell + Wobble + Background Cleanup cache. */
const CACHE='cellquation-v0.7.7a.8-target-wobble-glow-cleanup';
const CORE=[
  './',
  './assets/app/icon-192.png',
  './assets/app/icon-512.png',
  './assets/audio/underwater_ambience.mp3',
  './ambient_audio_v077a7.js',
  './menu_luminance_v077a7.css',
  './assets/backgrounds/deepsea_playfield_v076413.png',
  './assets/backgrounds/deepsea_playfield_v07646.png',
  './assets/ui/hud_goal_blue.png',
  './assets/ui/hud_goal_green.png',
  './assets/ui/hud_goal_violet.png',
  './canonical/CellKit_Synapse_Animation_2026-08-17T00-32-48-952Z.json',
  './canonical/synapse/animation_keyframes.js',
  './canonical/synapse/math2d.js',
  './canonical/synapse/settings.js',
  './canonical/synapse/transport_choreography.js',
  './canonical/synapse/transport_deformation.js',
  './canonical/synapse/transport_geometry.js',
  './canonical/synapse/transport_visibility.js',
  './cellkit_latest/brood.js',
  './cellkit_latest/cell.js',
  './cellkit_latest/profiles.js',
  './cellkit_latest/renderer.js',
  './cellkit_latest/transition.js',
  './content/LIVING_NETWORKS_VISUAL_CONFIG_V053.json',
  './content/full/LIVING_NETWORKS_LAYOUT_48_V060.json',
  './content/runtime/FOUNDATIONS_30_RUNTIME.json',
  './content/runtime/LIVING_NETWORKS_48_V28_RUNTIME.json',
  './content/threecolor/FOUNDATIONS_FULL_30_V071.json',
  './content/threecolor/LIVING_NETWORKS_FULL_48_V071.json',
  './content/threecolor/LIVING_NETWORKS_LAYOUT_FULL_48_V071.json',
  './developer_quality_v07642.js',
  './foundation_game_v0611.js',
  './foundation_levels.html',
  './foundations.html',
  './game_preload_v0724.js',
  './index.html',
  './living.html',
  './living_levels.html',
  './living_play.html',
  './manifest.webmanifest',
  './menu_architecture_v076412.js',
  './network_game_v0611.js',
  './play.html',
  './progress_v060.js',
  './resume_state_v076412.js',
  './runtime/mobile_performance_v0764.js',
  './runtime/synapse_renderer_v053.js',
  './runtime/world_v0611.js',
  './threecolor.html',
  './threecolor_foundation_game_v071.js',
  './threecolor_foundation_levels.html',
  './threecolor_foundations.html',
  './threecolor_living.html',
  './threecolor_living_levels.html',
  './threecolor_living_play.html',
  './threecolor_network_game_v071.js',
  './threecolor_play.html',
  './tutorial.html',
  './tutorial_v075.js',
  './twocolor.html',
  './ui_production_v076412.css',
  './ui_runtime_v076412.js',
  './user_aesthetic_preset_v073.js',
  './visual_environment_v076412.css',
  './visual_identity_v062.js',
  './visual_identity_v072.js',
  './visual_profiles_v062.js'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(key=>key.startsWith('cellquation-')&&key!==CACHE).map(key=>caches.delete(key))
  )).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const request=event.request;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});}
      return response;
    }).catch(async()=>{
      return (await caches.match(request,{ignoreSearch:true}))||(await caches.match('./index.html'))||new Response('Offline',{status:503,statusText:'Offline'});
    }));
    return;
  }
  event.respondWith(caches.match(request,{ignoreSearch:true}).then(cached=>cached||fetch(request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});}
    return response;
  })));
});
