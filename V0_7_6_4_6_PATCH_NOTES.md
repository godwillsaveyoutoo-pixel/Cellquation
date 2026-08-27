# Cellquation Core v0.7.6.4.6 — Deep-Sea PNG Background Integration

## Goal
Move atmospheric rendering out of runtime CSS effects and into a lightweight static deep-sea art plate, preserving GPU budget for cell silhouettes and action animation.

## Changes
- added `assets/backgrounds/deepsea_playfield_v07646.png` (720×1000, optimized PNG);
- gameplay ambience now uses this static PNG as the main environmental layer;
- removed the animated procedural arc/gradient layers from v0.7.6.4.5;
- reduced live motes/glints; constrained/critical retire those before touching cell quality;
- HUD/hint styling retained as static, blur-free layers;
- Foundations and Living Networks, 2-colour and 3-colour, all use the same deep-sea plate.

## Preservation
`cellkit_latest/renderer.js`, `runtime/synapse_renderer_v053.js`, preset data, gameplay rules and animation logic are unchanged from v0.7.6.4.5.
