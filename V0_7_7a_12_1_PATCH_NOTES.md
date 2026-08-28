# Cellquation Core v0.7.7a.12.1 — Background Playfield + Audio Carousel Hotfix

## Fixed

- Background selection now updates the **WebGL playfield texture itself**, not only the CSS/HUD layer behind it.
- The renderer listens to the same persistent background state used by Settings and swaps textures live without dropping to a blank frame.
- Old WebGL background textures are deleted after a successful swap to avoid accumulating GPU memory.
- Nature-sound carousel centering no longer relies on `offsetLeft` from an ambiguous offset parent. Tracks **1 and 2 are now reachable visually after 5 → 1 wrap**.
- Rapid track navigation is protected with a latest-request token so stale metadata callbacks cannot overwrite a newer track choice.
- Background carousel centering uses the same corrected geometry.
- Service-worker cache bumped to `cellquation-v0.7.7a.12.1`.

## Audio continuity

The v0.7.7a.9+ invariant remains unchanged: ordinary gameplay actions do not restart or reseek the active nature recording.
