# Cellquation v0.7.8 — Release Candidate

## Scope
Stabilization only. No new puzzle mechanics or menu features were introduced after v0.7.7a.14.

## Release changes
- Standardized browser cache-busting to `0.7.8-rc1` for active JS/CSS references.
- Raised the service-worker cache to `cellquation-v0.7.8-rc1`.
- Corrected the PWA orientation from `portrait-primary` to `landscape`.
- Updated `run.sh` and the main document title to v0.7.8 Release Candidate.
- Removed superseded legacy ambience scripts and the unused former single-track ambience MP3.
- Preserved the v0.7.7a.14 independent Ambience/FX mixer, final water success cue, background selection, carousel fixes and audio continuity protections.

## RC acceptance focus
- Settings trigger remains a compact 48 × 48 px utility control on menu top bars.
- Background choice propagates to both CSS shell and WebGL playfield.
- Background and audio carousels wrap through all five choices in both directions.
- Gameplay actions do not restart or seek the nature ambience.
- Level success plays only the separate FX cue.
- Both volume preferences persist in localStorage.
- 2-colour/3-colour Foundations and Living Networks load without missing production assets.
- Compact landscape layouts remain usable at 640 × 360 and 780 × 360.

## Remaining real-device gate
The final GPU/frame-pacing verdict still belongs on the target Android devices (especially low-end hardware). Browser automation can validate layout/state/runtime wiring but cannot substitute for actual device thermals, audio hardware and sustained WebGL performance.
