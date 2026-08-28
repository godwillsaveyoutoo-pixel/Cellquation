# Cellquation Core v0.7.7a.9 — Continuous Ambient Audio Hotfix

## Fixed
- Ambient music can no longer restart/reseek because of ordinary gameplay or UI actions.
- `CellquationAmbient.play()` is now idempotent: when ambience is already playing it is a strict no-op.
- The persisted cross-page phase is applied only once to a newly created audio element.
- `Audio.load()` is restricted to the initial metadata phase and cannot run during live playback.
- Repeated pointer/touch/key events no longer re-enter the seek/play path once the track is live.
- Volume/mute controls only request playback when the audio is actually paused.
- The service-worker cache was bumped so GitHub Pages does not keep serving the older ambient controller.

## Preserved
- v0.7.7a.8 target-cell restyle.
- v0.7.7a.8 stronger Living Networks wobble.
- v0.7.7a.8 background glow cleanup.
- Session continuity between menus/game pages.
