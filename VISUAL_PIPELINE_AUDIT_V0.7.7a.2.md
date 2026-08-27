# Visual Pipeline Audit — v0.7.7a.2

## Root cause addressed
The v0.7.6.4.13 world-readability pass placed the deep-sea PNG as a fullscreen DOM layer over an opaque WebGL canvas. v0.7.7a.1 changed that layer back to `mix-blend-mode: screen`, which prevented literal opaque covering, but still required Brave/Android to composite a fullscreen blended image over a continuously changing WebGL surface. Living Networks adds a second WebGL synapse renderer plus DOM aura/particles, making it the first place where this became visibly unreliable/slow.

## New pipeline
The active frame order is now:

1. clear one opaque WebGL framebuffer;
2. draw the static deep-sea PNG with a one-texture-sample fullscreen WebGL pass;
3. draw the existing Synapse renderer;
4. draw the existing CellKit cell renderer;
5. overlay only small DOM particles, sockets, hints and HUD.

There is no longer a fullscreen CSS background image over WebGL and no fullscreen `screen` blend for the network aura.

## Background implementation
`cellkit_latest/renderer.js` now contains a dedicated tiny texture program. The source PNG remains:

`assets/backgrounds/deepsea_playfield_v076413.png` (720×1000)

The shader performs a CSS-like `cover` crop based on canvas and image aspect ratios. The plate is mixed against the abyss base at 0.94 opacity. If the image has not loaded yet, gameplay safely renders against the dark clear colour; cells are never blocked waiting for the texture.

## Fluorescence strategy
The unwanted v0.7.6.4.13 effect was caused by reducing both broad haze and useful local emission together. v0.7.7a.2 separates those concepts:

- local CellKit halo: partial recovery only (`0.46`, not historical `1.0`);
- membrane/body material profiles: unchanged;
- synapse rim/flow: recovered close to the v0.7.6.4.12 values;
- node/edge/component DOM auras: remain far below v0.7.6.4.12.

Relative to v0.7.6.4.12:

| Property | v0.7.6.4.12 | v0.7.7a.2 | retained |
|---|---:|---:|---:|
| synapse rimTint | 1.46 | 1.44 | 98.6% |
| synapse flowTint | 1.64 | 1.60 | 97.6% |
| synapse glowScale | 1.48 | 1.34 | 90.5% |
| contactPulse | 0.16 | 0.15 | 93.8% |
| node aura alpha | 0.22 | 0.042 | 19.1% |
| edge aura alpha | 0.17 | 0.022 | 12.9% |
| component aura alpha | 0.15 | 0.018 | 12.0% |

This is deliberate: the object should fluoresce; the whole screen should not.

## Foundations isolation
Both Foundations game renderers still explicitly call CellKit with `outerHaloStrength: 0` for idle cells, transitions and Brood division. Therefore the Living Networks recovery does not reintroduce the broad Foundations halo removed earlier.

## Performance reasoning
The new background pass is one fullscreen texture fetch per framebuffer pixel and does not require a separate browser compositing surface or fullscreen CSS blend. On weak devices the renderer already caps resolution and internal detail. The static background does not add noise/FBM/blur/DSP; it is a single sampled RGB plate.

## Browser test limitation
A real automated WebGL screenshot could not be produced in the managed container because its Chromium GPU process rejects the available ANGLE/GL implementation before the page gets a usable context. This is an environment limitation, not reported as a passed test. Static/runtime-source checks are green; the physical Android/Brave test remains the decisive rendering gate.
