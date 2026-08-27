# Cellquation Core v0.7.6.4.9 — Streamlined Home + World/Levels

## Navigation
- Home now contains the 2 Colours / 3 Colours toggle and both campaign choices.
- Normal flow is now: Home → World/Levels → Play.
- World selection and level selection are combined into one browser screen.
- `twocolor.html` and `threecolor.html` remain only as compatibility redirects.
- Legacy `*_levels.html` pages still render the combined browser for old bookmarks.
- Gameplay `Levels` links return directly to the combined browser and preserve the current world.
- Tutorial Back returns directly to Home with the matching colour mode selected.

## Scope protection
- CellKit renderer, aesthetic preset, Synapse renderer, campaign JSON, cell animations and deep-sea PNG are not modified.
- Gameplay changes are navigation-link-only.
