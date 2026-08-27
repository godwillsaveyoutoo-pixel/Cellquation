/* Cellquation v0.7.3 — direct CellKit aesthetic-preset adapter.
   The user-approved CellKit export is the source of truth. No additional
   Core glow/material tuning is layered on top of it. */
import {USER_AESTHETIC_PRESET} from './user_aesthetic_preset_v073.js?v=0.7.3';

const clone = value => JSON.parse(JSON.stringify(value));

export function applyVisualIdentityV062({materialProfiles, idleProfiles, visuals}){
  const preset=USER_AESTHETIC_PRESET;
  for(const [type,values] of Object.entries(preset.idleIdentity||{})){
    if(idleProfiles?.[type]) Object.assign(idleProfiles[type],clone(values));
  }
  for(const [type,values] of Object.entries(preset.materials||{})){
    if(materialProfiles?.[type]) Object.assign(materialProfiles[type],clone(values));
  }
  const profileMap={fusion:'fusion',split:'split',brood:'brood',destruct:'destruct',swap:'swap',imitation:'imitate'};
  for(const [presetType,visualType] of Object.entries(profileMap)){
    const values=preset.profiles?.[presetType];
    if(values && visuals?.[visualType]) Object.assign(visuals[visualType],clone(values));
  }
}

export {USER_AESTHETIC_PRESET};
