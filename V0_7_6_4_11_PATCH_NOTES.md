# Cellquation Core v0.7.6.4.11 — UI Calibration & Homogeneity Pass

## Goal
A production-calibration pass on top of v0.7.6.4.10. No new navigation depth and no new gameplay features.

## Calibrated
- CELLQUATION is now the strongest item in the Home hierarchy; “Choose your campaign” is deliberately secondary.
- Minimum menu typography raised. Short-landscape layouts remove secondary information before reducing text.
- 2/3 Colours toggle keeps a comfortable touch height in compact layouts.
- Campaign cards are visually quieter: less dashboard-like chrome, softer shadow, clearer title/progress priority.
- Living Networks uses green more semantically; 3 Colours uses violet; cyan is reserved more carefully for general interaction/focus.
- World summary is no longer a heavy nested card. It is a light informational header above the level grid.
- Level cards have quieter surfaces and stronger content hierarchy.
- Swipe hint remains discoverable but is removed in very short landscape layouts where space is more valuable.
- Gameplay HUD typography now shares the same calibrated scale and colours as menus.
- Restart is no longer permanently cyan; bottom actions are neutral until interacted with.
- Result panel and tutorial surfaces use the same visual grammar as menus/HUD.
- Tutorial/control touch targets remain >=48px in short landscape.

## Technical structure
- New menu design-system versions: `ui_tokens_v076411.css`, `ui_components_v076411.css`, `ui_layout_v076411.css`.
- New `ui_homogeneity_v076411.css` bridges the shared production visual language into tutorial + gameplay without modifying their renderers or game logic.
- New versioned `menu_architecture_v076411.js`; behavior remains the v0.7.6.4.10 interaction model.

## Protected systems
CellKit renderer, aesthetic preset, Synapse renderer, deep-sea background, campaign JSON and gameplay JS are not modified by this pass.
