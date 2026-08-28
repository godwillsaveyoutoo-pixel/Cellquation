# Cellquation Core v0.7.8d — Brood Count Visual Fix

## Fix

Brood cells now render **only live brood nuclei** in their normal visual state. Retiring nuclei remain available internally for state continuity/reuse, but are no longer painted on top of the newly recomputed layout.

This fixes the misleading visual state seen when a species count decreases, especially `4 → 3`, where a retired fourth marker could overlap one of the three current markers and make the Brood cell look as if it still contained four.

## Scope

Applied consistently to:

- 2-colour Foundations
- 3-colour Foundations
- Foundations tutorial
- 2-colour Living Networks
- 3-colour Living Networks

Stable and decreasing counts now obey the visual invariant: **N logical brood markers = N visible brood markers**.

No gameplay rules, level data, move counts, Fusion directionality, audio, backgrounds, settings, or dual-orientation layouts were changed.

Service-worker cache: `cellquation-v0.7.8d`.
