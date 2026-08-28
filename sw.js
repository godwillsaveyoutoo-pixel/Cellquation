/* Cellquation v0.7.8i — ratio clarity cache. */
const CACHE='cellquation-v0.7.8i';
const CORE=[
  './',
  './assets/app/icon-192.png',
  './assets/app/icon-512.png',
  './ambient_audio_host_v078e.js',
  './ambient_audio_v078e.js',
  './app_shell_guard_v078e.js',
  './app_shell_v078e.js',
  './settings_v077a12.js',
  './settings_v077a12.css',
  './success_sfx_v077a14.js',
  './audio_settings_v077a14.css',
  './menu_luminance_v077a7.css',
  './assets/backgrounds/options/abyss_void.png',
  './assets/backgrounds/options/bioluminescent_reef.png',
  './assets/backgrounds/options/midnight_trench.png',
  './assets/backgrounds/options/emerald_depths.png',
  './assets/backgrounds/options/quiet_ocean.png',
  './assets/backgrounds/thumbs/abyss_void.jpg',
  './assets/backgrounds/thumbs/bioluminescent_reef.jpg',
  './assets/backgrounds/thumbs/midnight_trench.jpg',
  './assets/backgrounds/thumbs/emerald_depths.jpg',
  './assets/backgrounds/thumbs/quiet_ocean.jpg',
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
  './home.html',
  './living.html',
  './living_levels.html',
  './living_play.html',
  './manifest.webmanifest',
  './menu_architecture_v078h.js',
  './menu_architecture_v078i.js',
  './menu_live_minis_v078h.js',
  './menu_scaling_v078h.css',
  './ratio_clarity_v078i.css',
  './network_game_v0611.js',
  './play.html',
  './progress_v060.js',
  './resume_state_v076412.js',
  './runtime/mobile_performance_v0764.js',
  './runtime/network_orientation_layout_v078b.js',
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
  './tutorial_v078i.js',
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
  // Let the browser handle media byte-range requests directly. This avoids stale/partial
  // service-worker audio responses and makes track seeking/resume more reliable.
  if(request.destination==='audio'||new URL(request.url).pathname.includes('/assets/audio/'))return;
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
