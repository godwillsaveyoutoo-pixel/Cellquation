# Glow & World Readability Audit — v0.7.6.4.13

## Stop-gate question

Does the pass reduce the broad blue/green haze around cells and network structures while making the deep-sea environment materially easier to read, without changing game logic or increasing low-end rendering cost?

**Static/structural result: PASS. Physical-phone visual confirmation remains the final device gate.**

## Root-cause finding

The phone capture did not show one single glow source. Three presentation layers were stacking:

1. CellKit generic outer halo on Living Networks cells;
2. the Living Networks CSS node/edge/component aura system;
3. high Synapse glow/tint values.

The second layer was especially large: every occupied node could receive a 128 px coloured radial glow, every edge a 154 px glow, plus a 310 px component-level field. This explains why reducing only the CellKit shader halo would not have solved the visible haze.

## Corrections

### CellKit outer halo

Default outer-halo multiplier is now `0.14` instead of `1.0`. Foundations already passed `0`, so its appearance remains unchanged. The membrane rim and cell interior are deliberately not dimmed.

### Network aura

Node/edge/component aura alpha is reduced by roughly 76–82%, and radii are reduced by roughly 29–38%. The global aura is static rather than breathing.

### Synapse hierarchy

The channel remains clearly visible, but its presentation adapter now uses a 1.08 glow multiplier rather than 1.48. No geometry, topology or choreography changed.

### World plate

The same deep-sea scene is supplied as a new baked PNG with lifted shadow detail. This is preferable to a realtime CSS `filter: brightness()`/`contrast()` pass on the target Samsung-class device.

The background remains equally available in Full/Balanced/Constrained/Critical. Low-end quality reduction affects optional particles before it affects world readability.

## Regression protection

SHA-256 comparison against v0.7.6.4.12 confirms byte-identical copies of:

- `foundation_game_v0611.js`
- `network_game_v0611.js`
- `threecolor_foundation_game_v071.js`
- `threecolor_network_game_v071.js`
- all four runtime campaign data sets and 3C layout data
- `reference/USER_AESTHETIC_PRESET_2026-08-22.json`
- `user_aesthetic_preset_v073.js`
- canonical Synapse animation JSON
- `runtime/synapse_renderer_v053.js`

The CellKit renderer file is intentionally different only because the generic default `outerHaloStrength` is reduced for this pass.

## Automated checks

- all JavaScript: `node --check` PASS
- all JSON: parse PASS
- CSS parse: 0 errors
- local HTML href/src references: PASS
- service-worker precache references: 64 entries, 0 missing
- `run.sh`: executable
- PWA cache version bumped to v0.7.6.4.13

## Browser limitation

A managed Chromium/SwiftShader smoke attempt did not complete reliably in this environment, matching earlier GPU/browser limitations. Therefore no claim is made that an automated live WebGL screenshot passed here.

## Required phone check

On the physical phone, inspect one Foundations level and one dense Living Networks level in at least Auto and Critical/Constrained:

1. no large diffuse coloured cloud around idle cells;
2. membrane rim still reads sharply;
3. Synapse remains legible but is no longer the brightest large-scale object;
4. rock/coral/jellyfish/deep-sea edge structure is visible before concentrating on it;
5. center remains dark enough for puzzle readability;
6. no FPS regression versus v0.7.6.4.12.

If those six conditions hold, v0.7.6.4.13 should replace v0.7.6.4.12 as the visual production baseline.
