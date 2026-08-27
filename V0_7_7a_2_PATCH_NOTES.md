# Cellquation v0.7.7a.2 — Unified WebGL Background & Fluorescence Recovery

## Purpose
Repair the two regressions visible on Android/Brave after the v0.7.6.4.13 / v0.7.7a compositing changes:

1. Living Networks could show the HUD/background while cells and synapses failed to become visibly usable or appeared extremely slow.
2. The former fluorescent Cellquation identity had been reduced too aggressively together with the unwanted broad colour haze.

## Rendering pipeline fix
- The deep-sea PNG is no longer a fullscreen CSS image blended over the live WebGL canvas.
- `CellRenderer` now owns one static WebGL background texture.
- At the start of each frame the renderer draws the deep-sea plate directly into the same framebuffer.
- Synapses and cells are then rendered above it using the existing luminous passes.
- The old `.world-ambient` DOM layer now carries only lightweight particles; it has no background image.
- Fullscreen `screen` blend modes were removed from the stage-light overlay and Living Networks aura/particle layers.

This eliminates the fragile browser compositor path where a changing WebGL surface and a fullscreen blended PNG had to be recomposited every frame.

## Fluorescence recovery
Living Networks recovers the local fluorescent identity without recovering the broad haze:

- Cell outer halo default: `0.14 -> 0.46`.
  - Foundations remains `0` because both 2-colour and 3-colour Foundations explicitly pass `outerHaloStrength: 0`.
- Synapse rim tint: `1.32 -> 1.44` (v0.7.6.4.12 was `1.46`).
- Synapse flow tint: `1.46 -> 1.60` (v0.7.6.4.12 was `1.64`).
- Synapse glow scale: `1.08 -> 1.34` (v0.7.6.4.12 was `1.48`).
- Contact pulse: `0.12 -> 0.15` (v0.7.6.4.12 was `0.16`).

Broad CSS atmosphere remains strongly suppressed:

- node alpha `0.042` vs `0.22` in v0.7.6.4.12;
- edge alpha `0.022` vs `0.17`;
- component alpha `0.018` vs `0.15`.

So the recovered light is concentrated on the actual biological object and synapse, not spread as a large coloured cloud.

## Cache safety
- Renderer import query bumped to `v=0.7.7a.2`.
- PWA cache ID bumped to `cellquation-v0.7.7a.2-unified-webgl-bg-fluorescence`.
- `run.sh` identifies the new build.

## Intentionally unchanged
- campaign data;
- cell aesthetic preset;
- CellKit profiles and action choreography;
- Synapse geometry/choreography;
- gameplay rules and level data;
- menu architecture;
- v0.7.7a audio remains absent by design while the separate listening lab is evaluated.
