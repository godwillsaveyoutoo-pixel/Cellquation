# Cellquation v0.7.7a.1 — Visual Compositing Fix

## Root cause
v0.7.6.4.13 changed the deep-sea `.world-ambient` layer from `mix-blend-mode: screen` to `mix-blend-mode: normal` while keeping it above the opaque WebGL canvas (`z-index:2` vs canvas `z-index:1`). Because the PNG is opaque and the CellKit renderer deliberately uses an opaque black WebGL framebuffer, the normal-blended background covered the rendered cells and Synapses.

## Fix
- Restore `mix-blend-mode: screen` for `.world-ambient`.
- Set background opacity to `0.90` in all performance tiers.
- Keep the brighter v0.7.6.4.13 deep-sea PNG.
- Bump the environment stylesheet query to `v=0.7.7a.1`.
- Bump the service-worker cache to `cellquation-v0.7.7a.1-visual-compositing-fix` so a stale broken CSS file cannot survive on the phone.

## Protected systems
No changes to CellKit renderer, Synapse renderer/choreography, campaign data, gameplay JavaScript, cell profiles, aesthetic preset, or animations.
