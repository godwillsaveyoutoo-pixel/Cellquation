# v0.7.7a.5 — Living Cell Motion Pass

## Goal
Living Networks should feel alive even when no action is running. Cells may drift softly around their authored node, but the puzzle topology, hit targets and canonical action geometry must remain fixed.

## Changes
- Added deterministic per-cell idle drift to **2 Colour Living Networks** and **3 Colour Living Networks**.
- Every cell receives a different phase, so the network never moves as one synchronized block.
- Full-strength drift is capped at `0.0072` world units per axis (sampled radial envelope ~6.4% of a Fusion-cell radius).
- Added a very small whole-cell breathing term (±0.65%) and ~1° slow rotational sway.
- Idle synapse endpoints use the same visual node pose, so connections remain attached to the softly moving cells.
- A cell taking part in Fusion, Split transport, Brood transport, Destruct, Swap or Imitation is locked to its authored anchor during the action.
- The rest of the network keeps ~34% idle motion during an action so the whole scene does not freeze.
- Selected cells reduce their drift for clearer targeting.
- Low/Critical rendering reduces motion amplitude; `prefers-reduced-motion` disables the added motion entirely.

## Non-goals / protected systems
No campaign data, rules, action timings, CellKit profiles, Synapse choreography, ambience, menu architecture or network layout data were changed.

## Design rule
The logical node never moves. v0.7.7a.5 changes presentation only.
