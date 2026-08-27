# Cellquation Core v0.7.6.4.12 — Production UI Hardening

This pass closes the menu/HUD production work started in v0.7.6.4.8–v0.7.6.4.11. It deliberately does **not** redesign CellKit, Synapse animation, campaign data, or the deep-sea background plate.

## Closed issues

- **Free level selection truth:** 2-colour gameplay no longer silently clamps a selected level to `progress.unlocked`. A visible level tile now opens that actual level, matching the all-levels-available menu model.
- **Continue truth:** resume state is written by every gameplay `startLevel()`/`setLevel()` flow, so `NEXT LEVEL` also advances Home → Continue.
- **Mobile HUD metadata:** level metadata is split into semantic spans so narrow layouts can wrap without a stranded separator. 3-colour targets receive their own row on narrow portrait screens.
- **Tutorial shell:** the tutorial is reduced to gameplay-like header → live CellKit stage → one rule block → Back/Try controls, using the real game action pipeline.
- **Full-bleed world:** gameplay is no longer visually boxed as a third card between top and bottom HUD panels.
- **Pause state:** explicit paused overlay with Resume and Fullscreen; canvas/sockets dim while paused.
- **Fullscreen:** shared Fullscreen API support on Home and Pause, with webkit fallback and accessible state labels.
- **Result accessibility:** dialog semantics, primary-focus handoff, keyboard focus trap, focus return, and star rating labels.
- **Zoom accessibility:** `user-scalable=no` removed; viewport permits user zoom up to 5× on play/tutorial screens.
- **Touch calibration:** important compact controls remain about 48 px high; short-landscape layouts hide secondary metadata before shrinking primary controls.
- **Progress density:** world tabs show concise state markers while the selected world carries detailed completion/stars.
- **Campaign identity:** campaign cards use static Cellquation cell art rather than generic symbols.
- **Interaction feedback:** low-cost press feedback on menu cards, levels, tabs and actions; reduced-motion users get no transform animation.
- **CSS consolidation:** active UI collapsed into one production stylesheet plus one environment-only stylesheet. Legacy v0.6/v0.7 UI override layers are no longer active dependencies.
- **Legacy URL compatibility:** old `*_levels.html` pages are now tiny redirect shims to the canonical World/Levels screens, preserving query/hash state instead of duplicating the UI.
- **PWA hardening:** manifest + icons + shared service-worker registration. The complete playable runtime is precached (~1.2 MiB), navigation is online-first with offline fallback, and version-query assets resolve from cache via `ignoreSearch`.

## Protected systems

SHA-256 comparison against v0.7.6.4.11 confirms byte-identical protected files for:

- `cellkit_latest/renderer.js`
- `runtime/synapse_renderer_v053.js`
- `reference/USER_AESTHETIC_PRESET_2026-08-22.json`
- `assets/backgrounds/deepsea_playfield_v07646.png`
- all four primary campaign data files

The four gameplay JS files changed only for UI/state integration: free-play selection, resume synchronization, structured HUD metadata, pause/result integration and accessibility labels. Cell action mechanics/rendering were not redesigned.

## Browser QA limitation

The managed Chromium environment used here blocks `127.0.0.1`, `file:` and `data:` navigation by organization policy, so a genuine local runtime screenshot/smoketest cannot be claimed. Static structure, parser, import, hash, PWA and package checks are green. A real Android/Brave device test remains the final release gate.
