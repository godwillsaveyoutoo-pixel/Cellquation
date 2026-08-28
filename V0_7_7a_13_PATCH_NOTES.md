# Cellquation Core v0.7.7a.13 — Final Regression & Low-End Pass

## UI hotfix carried forward
- Campaign/browser Settings is locked to a compact 48 × 48 px right-hand utility target.
- Hiding campaign progress on compact landscape can no longer stretch the Settings control across the topbar.

## Regression hardening
- Retains v0.7.7a.12.1 background-to-WebGL synchronization: the selected deep-sea background is the actual playfield texture.
- Retains deterministic 5-track nature carousel navigation and the hard ambient-audio no-restart invariant.
- Retains the independent level-success harp SFX without interrupting or seeking the nature track.
- Retains unified Settings, fullscreen under Display, background persistence, playlist/single modes and completion-status UI.

## Low-end / release hygiene
- Removed three legacy deep-sea PNGs that are no longer referenced by runtime code.
- Removed those obsolete assets from the service-worker install list, reducing install/package overhead without reducing the five selectable backgrounds.
- Kept all five selectable backgrounds as static assets; only the selected full-resolution playfield is decoded by gameplay.
- Service-worker cache bumped to `cellquation-v0.7.7a.13`.

No new gameplay mechanics or campaign content were introduced in this pass.
