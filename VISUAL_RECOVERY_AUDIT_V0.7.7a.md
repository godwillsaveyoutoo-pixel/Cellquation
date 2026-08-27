# v0.7.7a Visual Recovery Audit

## Recovery strategy

The safest response to the reported v0.7.7 visual regression is **not to patch the audio build**. v0.7.7a is branched directly from the last known visual baseline:

**v0.7.6.4.13 — Glow Reduction & World Readability**

No v0.7.7 audio runtime is loaded and no v0.7.7 audio CSS is present.

## Byte-identical visual/game files

The following active systems are intentionally byte-identical to v0.7.6.4.13:

- `cellkit_latest/renderer.js`
- `cellkit_latest/profiles.js`
- `user_aesthetic_preset_v073.js`
- `runtime/synapse_renderer_v053.js`
- `visual_environment_v076412.css`
- `ui_production_v076412.css`
- all four gameplay HTML files
- all four gameplay JavaScript files
- all campaign data files
- both deep-sea PNG background plates
- CellKit/Synapse canonical choreography data

This means v0.7.7a does not attempt to “fix” cell visibility with another CSS override. It restores the exact pre-audio presentation stack.

## Service-worker recovery

The service-worker cache ID is intentionally bumped to `cellquation-v0.7.7a-visual-recovery`.

On activation it deletes older `cellquation-*` caches. This prevents a previously tested v0.7.7 page/audio runtime from remaining active because of stale PWA cache state on the phone.

## Audio state

There is **no `assets/audio/` directory** and no `audio_runtime_v077.js` in the active package.

Therefore:

- no ambience starts;
- no music starts;
- no audio UI is injected;
- no audio preload can compete with startup;
- no v0.7.7 audio script can affect the gameplay launch path.

This is deliberate. Audio returns only after the research prototype is approved.
