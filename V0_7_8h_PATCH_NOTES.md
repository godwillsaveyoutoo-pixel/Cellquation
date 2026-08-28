# Cellquation Core v0.7.8h — Menu Scaling Hardfix

## Why this pass exists
v0.7.8f/g exposed two independent menu rendering failures on real devices:

1. nucleus-free target-cell images could appear at or near their intrinsic 256×256 size because the repeatedly-mutated legacy UI stylesheet could be supplied from an older service-worker cache;
2. the Foundations / Living Networks semantic thumbnails used one WebGL context per campaign card, which proved fragile and could leave the card canvas blank.

## Changes
- Added `menu_scaling_v078h.css` as a **new physical stylesheet filename**. This intentionally bypasses any stale cached copy of `ui_production_v076412.css`.
- Added hard, isolated size contracts for three separate visual roles:
  - Home 2/3-colour selector cells: 28 px desktop/tablet, 25 px compact portrait, 23 px compact landscape.
  - Level-select ratio cells: 30 px standard, 28 px compact portrait, 24 px compact landscape.
  - Campaign thumbnail viewport: 86 px standard, 76 px compact portrait, 66 px compact landscape.
- Copied the menu controller to the new physical filename `menu_architecture_v078h.js`, so the new ratio-cell markup cannot be confused with a stale cached menu controller.
- Replaced the two-per-card WebGL miniature implementation with `menu_live_minis_v078h.js`:
  - exactly **one shared CellKit WebGL context**;
  - renders a real Foundations composition or real Living Network using the actual CellRenderer / SynapseRenderer;
  - captures one frame with `readPixels` and copies it into the visible card canvas;
  - no continuous animation loop and no persistent per-card WebGL contexts;
  - CSS/Canvas fallback remains available if WebGL creation fails.
- Service-worker cache bumped to `cellquation-v0.7.8h` and now precaches the new physical CSS/JS files.

## Unchanged
Gameplay, campaign content, persistent audio, Scott Buckley default track, Settings, backgrounds, Fusion source→target, dual-orientation Living Networks and the Brood-count visual fix are unchanged.
