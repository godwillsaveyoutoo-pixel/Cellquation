# v0.7.7a.6 — Level Status Clarity Pass

Base: `v0.7.7a.5_LIVING_CELL_MOTION`

## Status grammar

- `✓` = completed.
- `★ / ☆` = performance on a completed level only.
- `▶` + `CONTINUE` = most recently entered unfinished level.
- `NEW` = uncompleted and not the active unfinished level.

## Visual changes

- Removed empty `☆☆☆` from new levels.
- Added compact organic completion badge and subtle campaign-accent completion tint.
- Kept perfect completion implicit as `✓ + ★★★`; no extra PERFECT badge.
- Added one-shot 320 ms completion-badge settle (`0.8 → 1.05 → 1`).
- `prefers-reduced-motion` disables the badge animation.

## Semantics fix

Completed levels are filtered out of both browser `CONTINUE` state and the Home Continue card.

## Scope

No puzzle rules, campaign data, cell rendering, synapse rendering, Living Cell Motion tuning, or audio behaviour changed.
