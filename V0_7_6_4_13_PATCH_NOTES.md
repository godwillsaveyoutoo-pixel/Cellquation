# Cellquation Core v0.7.6.4.13 — Glow Reduction & World Readability

## Goal

Respond to the phone capture where Living Networks showed a broad coloured haze around cells and the deep-sea world plate was barely readable.

The pass deliberately changes presentation only. Campaign data, puzzle rules, menu architecture, action choreography and the Synapse renderer implementation remain unchanged.

## Cell presentation

- Default CellKit `outerHaloStrength` reduced from `1.00` to `0.14` for render calls that do not explicitly override it.
- Foundations keeps its existing explicit `outerHaloStrength: 0`, so its zero-halo look does not regress.
- Internal membrane rim, inner rim, nucleus glow, gel material, palette and cell geometry are not retuned.
- Swap/mimic action-specific visual effects remain available; only the broad generic idle aura is reduced.

## Living Networks atmosphere

The separate CSS atmosphere layer was a major part of the visible haze. It has been retuned from large colour clouds to local contact light:

- node glow size: `128 px → 82 px`
- node alpha: `0.22 → 0.052`
- edge glow size: `154 px → 96 px`
- edge alpha: `0.17 → 0.030`
- component glow size: `310 px → 220 px`
- component alpha: `0.15 → 0.028`
- normal aura scale: `1.00 → 0.82`
- high aura scale: `1.12 → 0.94`
- low aura scale: `0.68 → 0.52`
- the global network aura no longer breathes; it is a static `0.66` opacity layer.

## Synapse balance

The Synapse geometry and animation code are unchanged. Only its presentation adapter is reduced:

- glow scale: `1.48 → 1.08`
- rim tint: `1.46 → 1.32`
- flow tint: `1.64 → 1.46`
- contact pulse: `0.16 → 0.12`

This keeps the living channel readable without letting it overpower the cells and world.

## Deep-sea world readability

- Added `assets/backgrounds/deepsea_playfield_v076413.png`, derived from the same approved deep-sea plate with shadow/gamma lift baked into the PNG.
- No realtime CSS filter or image-processing shader is used on the phone.
- The world plate is now rendered at full opacity in all performance tiers.
- Runtime blend changed from `screen` to `normal` for more predictable colour and contrast.
- Stage base is a very dark ocean blue rather than pure black.
- Edge vignette maximum reduced from `0.24` to `0.12`.
- Ambient motes/glints are slightly fewer and less luminous so they do not compete with the actual environment art.

## Performance intent

The pass trades dynamic glow for pre-baked background readability:

- fewer/lower CSS aura contributions;
- no network-aura opacity animation;
- no realtime background filter;
- Critical/Constrained keep the same readable PNG while removing decorative particles first.

## Explicitly unchanged

- all four campaign data sets;
- Foundations and Living Networks gameplay JS;
- 2-colour and 3-colour puzzle rules;
- user aesthetic preset values;
- Synapse animation JSON/choreography;
- Synapse renderer implementation;
- menu/navigation architecture;
- Fullscreen/PWA/Continue logic from v0.7.6.4.12.
