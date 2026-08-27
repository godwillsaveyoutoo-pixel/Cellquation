# Visual Compositing Audit — v0.7.7a.1

## Failure mechanism
The game has an intentionally opaque WebGL canvas. `CellRenderer` requests WebGL with `alpha:false`, clears to opaque black, and uses additive drawing for the cells. Therefore a CSS background placed *behind* the canvas would not be visible.

The environment is consequently placed above the canvas and must use a light-only blend mode. In v0.7.6.4.12 it used `mix-blend-mode:screen`. v0.7.6.4.13 accidentally changed this to `normal` at full opacity. Since `.world-ambient` is z-index 2 and the WebGL canvas is z-index 1, the opaque PNG then covered the cells and Synapses after they were rendered.

## Corrected stack
1. WebGL canvas (`z-index:1`) — opaque black framebuffer + cells/Synapses.
2. Deep-sea PNG (`z-index:2`) — `mix-blend-mode:screen`, opacity `0.90`.
3. Network overlays / sparse ambient accents — light-only overlays.
4. Vignette / HUD / hints above gameplay.

With screen blending, the environment can brighten the black portions of the WebGL framebuffer but cannot replace/darken the already-rendered cell pixels. This preserves cell visibility while retaining the world image.

## Cache safety
All gameplay HTML pages now request `visual_environment_v076412.css?v=0.7.7a.1`. The service-worker cache name is also new, preventing the broken v0.7.7a/v0.7.6.4.13 CSS from being reused.

## Scope
Only environment compositing/cache-busting and documentation changed. Gameplay systems are intentionally untouched.
