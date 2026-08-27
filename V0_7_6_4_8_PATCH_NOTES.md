# Cellquation Core v0.7.6.4.8 — Menu Architecture & Design System Rebuild

Baseline: v0.7.6.4.7 Deep-Sea HUD Framing.

## Architecture
- 2 Colour and 3 Colour now use the same hierarchy: Colour Mode → Campaign → World → Level → Play.
- 3 Colour world selection and level selection are split into separate screens instead of sharing one page state.
- New shared data-driven menu controller: `menu_architecture_v07648.js`.
- New 3 Colour level pages: `threecolor_foundation_levels.html` and `threecolor_living_levels.html`.

## Design system
- `ui_tokens_v07648.css`: canonical colours, typography, spacing, radii and surfaces.
- `ui_components_v07648.css`: back button, campaign card, world card, level tile, ratio, progress and secondary action components.
- `ui_layout_v07648.css`: responsive phone/grid layout.
- Menu pages no longer carry separate 2-colour/3-colour inline style systems.

## UX changes
- Tutorial appears only at campaign selection, not again on the Foundations world screen.
- Level tiles are structurally identical in all four campaigns.
- Unsolved levels no longer reveal optimal move counts; solved tiles show only the player's Best result.
- Back labels now consistently name the exact parent screen.
- 3 Colour no longer uses a separate list-row visual language.
- Production gameplay dock is reduced to Levels, Restart and Pause. Stats remains available in Developer Mode.
- Tutorial chrome now uses the same deep-sea design language and a simpler gameplay-like structure.

## Preserved
Cell renderer, aesthetic preset, synapse renderer, campaign data, gameplay rules, action animations, performance governor and deep-sea PNG background were not intentionally changed.
