# Menu Streamline Audit — v0.7.6.4.9

## Target flow
Normal player navigation is now:

`Home (2/3 Colours toggle + campaign) → World/Levels → Play`

This removes two intermediate decisions from the v0.7.6.4.8 flow:

`Colour Mode → Campaign → World → Level → Play`

## Home
- 2 Colours / 3 Colours is a segmented toggle, not a separate page.
- Foundations and Living Networks are directly selectable below it.
- The selected colour mode persists locally and is also represented by `?mode=2` / `?mode=3`.
- Foundations Tutorial switches automatically between the 2-colour and 3-colour tutorial.
- Legacy `twocolor.html` and `threecolor.html` URLs redirect to the corresponding Home state.

## Combined World + Level browser
- Four campaign browser pages use the same component and logic.
- World tabs switch content in place; no extra world page opens.
- World title, intro, progress and level tiles update together.
- The current world is kept in `?world=N` so gameplay can return to the correct position.
- Legacy `*_levels.html` pages remain functional and render the same combined browser.

## Gameplay navigation scope
Only the `Levels` destination changed in each gameplay engine:
- 2C Foundations → `foundations.html?world=N`
- 2C Living Networks → `living.html?world=N`
- 3C Foundations → `threecolor_foundations.html?world=N`
- 3C Living Networks → `threecolor_living.html?world=N`

No action, solver, animation, rendering or campaign logic was changed.

## Protected-file regression
The following are SHA-256 identical to v0.7.6.4.8:
- `cellkit_latest/renderer.js`
- `reference/USER_AESTHETIC_PRESET_2026-08-22.json`
- `runtime/synapse_renderer_v053.js`
- `assets/backgrounds/deepsea_playfield_v07646.png`
- 2C Foundations campaign JSON
- 2C Living Networks campaign JSON
- 3C Foundations campaign JSON
- 3C Living Networks campaign JSON

## Static QA
- All JavaScript files pass `node --check`.
- All static local HTML `href`, `src` and stylesheet references resolve to existing files.
- All four campaign browsers contain the shared world-tab and level-grid structure.
- Ratio chips now use explicit blue / green / violet classes; the old `nth-child` ambiguity is removed.
- Compact landscape CSS is provided for short smartphone screens; level `Best` metadata and world intro are hidden in that constrained menu layout to preserve hierarchy and space.

## Browser automation note
The local browser environment blocks automated Chromium navigation to the local HTTP test server (`ERR_BLOCKED_BY_ADMINISTRATOR`). Therefore this pass has static/syntax/regression QA but still needs the final visual/touch check on a real smartphone through `run.sh`.
