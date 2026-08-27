# Menu Interaction Audit — v0.7.6.4.10

## Baseline
Built from `v0.7.6.4.9_STREAMLINED_HOME_WORLD_LEVELS`.

## Intended scope
Only the menu interaction / navigation layer was changed:
- Home loading and Continue flow;
- World tab behavior;
- touch swipe between Worlds;
- return-context memory;
- keyboard/ARIA tab semantics;
- menu CSS required for these behaviors.

## Structural checks
- 16 top-level HTML files checked.
- 0 missing local `href`/`src` references.
- All 8 World/Level browser entry pages contain:
  - `worldTabs`
  - `swipeHint`
  - `worldPager`
  - `levelGrid`
  - the v0.7.6.4.10 menu module.
- Home contains the new `continueAction` slot.
- `run.sh` remains present and executable.

## JavaScript checks
- 33 JavaScript files checked with `node --check`.
- All passed syntax validation.

## Protected-system hash regression
The following are byte-identical to v0.7.6.4.9:
- `cellkit_latest/renderer.js`
- `reference/USER_AESTHETIC_PRESET_2026-08-22.json`
- `runtime/synapse_renderer_v053.js`
- `assets/backgrounds/deepsea_playfield_v07646.png`
- all four production campaign JSON files
- `foundation_game_v0611.js`
- `network_game_v0611.js`
- `threecolor_foundation_game_v071.js`
- `threecolor_network_game_v071.js`

This means no gameplay, action, cell-renderer, Synapse-renderer or campaign-data changes were introduced by this pass.

## Interaction safety implemented
- Swipe uses a horizontal threshold and direction test, preserving vertical scrolling.
- Screen-edge pointer starts are ignored to avoid competing with browser/system back gestures.
- A committed horizontal swipe suppresses the click that can otherwise fire on a level tile after pointer-up.
- Visible World tabs remain available at all times; swipe is optional.
- Reduced-motion preference disables World entrance animation.
- World tabs expose `role=tab`, `aria-selected`, `aria-controls`, a meaningful accessible label, and a single active tab stop.
- Left/Right/Home/End keyboard navigation is supported.

## Return-flow checks by code path
- Selecting a level stores the current campaign, World, level, title and session scroll position.
- Home reads the stored level per colour mode and exposes a direct Continue link.
- Each campaign stores its last selected World.
- Returning from the matching gameplay page can restore the prior scroll location within the same World.
- The current gameplay URL already tracks the active level in the unchanged game code, so a return through Levels can identify the latest active level even after using Next Level.

## Loading optimization
Home now loads only the two JSON files needed for the currently selected colour mode, in parallel. The alternate colour mode is prefetched later during idle time.

## Browser automation limitation
A Chromium DevTools smoke-test harness was prepared, but this environment's managed browser policy blocks local HTTP addresses (`127.0.0.1` and the container LAN address) with an organization policy page. Because of that policy, a trustworthy rendered local-page interaction test cannot be completed here. Static references, JavaScript syntax, protected hashes, and package integrity are therefore the automated gates available in this environment.
