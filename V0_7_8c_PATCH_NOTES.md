# Cellquation Core v0.7.8c — Fusion Source → Target Interaction

## Interaction contract
- First Fusion-cell click = **source**.
- Second Fusion-cell click = **target**.
- The source cell moves toward the target.
- The resulting Split cell remains at the target position/socket.

## Scope
- 2-colour Foundations
- 3-colour Foundations
- 2-colour Living Networks
- 3-colour Living Networks
- Foundations tutorial wording and prompts

## State-space compatibility
This changes the human input convention, not the available Fusion state transitions. For any previous directed spatial result, reversing the click order produces the same resulting occupied destination in one move. Campaign goals and authored move minima are therefore unchanged.

## Technical notes
- `CellWorld.beginFusion(a,b)` now treats `a` as source and `b` as target.
- Free-play Foundations pin the target during approach and emit the fused result at the target coordinate.
- Living Networks now pass the selected node as `sourceNode` and the second-clicked node as `targetNode`.
- Service-worker cache bumped to `cellquation-v0.7.8c`.
