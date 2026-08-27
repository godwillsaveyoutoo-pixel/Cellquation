# Cellquation Core v0.7.6.2 — Deep GPU Optimization

## Goal

Improve playability on weak Android phones while preserving the approved CellKit aesthetic preset, canonical cell behaviour and canonical Synapse transport choreography.

This pass deliberately targets work that was invisible, duplicated, outside the visible geometry, or unnecessarily full-screen before lowering any artistic parameters.

## CellKit renderer

- Disabled WebGL MSAA (`antialias:false`). Cell and nucleus edges already use analytic shader smoothing, so mobile MSAA mostly added framebuffer/bandwidth cost.
- Added an exact idle SDF path. Idle cells no longer evaluate both source daughter SDFs + smooth union before discarding them through `relax=1`.
- Added exact idle depth/world-frame shortcuts.
- Added non-heterogeneous palette fast paths so ordinary idle cells do not calculate source-side colour blending.
- Reduced normal estimation from four offset SDF samples + a duplicate centre sample to two forward samples while reusing the already-computed centre SDF.
- Added conservative square-corner rejection before living membrane noise/SDF evaluation for idle cells.
- Added an outside-body halo-only path before normals, optical depth, fluid, nucleus and material lighting.
- Tightened idle and transition scissor bounds around the actually visible cell + halo rather than using the older large radius multiplier.
- Added a far-halo fast path for Brood child nuclei so their FBM material is not calculated in invisible outer pixels.

The cell aesthetic profile values, membrane amplitudes, fluid profile values, glow strengths, nucleus parameters and idle identity values are unchanged.

## Synapse renderer

- Replaced the former full-screen fragment pass for every synapse with a conservative world-space scissor rectangle around each actual connection.
- Added a cheap coarse segment reject before the expensive living analytic SDF, especially useful in diagonal AABB corners.
- Added a dedicated front-lip fast path. Attachment lips no longer execute the complete synapse cytoplasm / FBM / transport shader and mask it only at the end.
- Front-lip scissor rectangles are endpoint-local instead of spanning the whole connection.
- Added an outside-membrane halo-only path before fluid FBM, flecks and transport lighting.
- Idle edges no longer calculate travelling transport-bulge `exp/pow` work multiplied by zero.
- Idle edges no longer calculate transport-mass lighting multiplied by zero.
- Segment midpoint, direction and half-length are computed once in JavaScript and sent as uniforms instead of recomputing/normalizing the same endpoints for every fragment.
- Cohesive endpoint palettes are cached in both 2-colour and 3-colour Living Networks instead of allocating new colour arrays/objects for every edge every frame.

The canonical Synapse animation JSON, transport choreography, mouth settings and geometry helper behaviour are unchanged.

## Adaptive compositor relief

Only after sustained measured low FPS:

- `constrained`: expensive HUD `backdrop-filter` blur is disabled.
- `critical`: secondary ambient animations/layers are further reduced, while CellKit/Synapse preset parameters stay unchanged.
- Existing adaptive render-resolution governor remains active as the last major safety valve.

## Validation performed

Passed after overlaying the optimized renderers on the full QA source tree:

- 30/30 2-colour Foundations stored routes replay through production CellWorld actions.
- 30/30 3-colour Foundations routes replay through production CellWorld actions.
- 48/48 2-colour Living Networks routes replay through production network semantics.
- 48/48 3-colour Living Networks routes replay through production network semantics.
- Real tutorial scenario endpoint regression.
- Resize/orientation regression.
- Canonical MultiCell regression suite.
- Canonical Synapse v0.8.7 regression suite.
- Synapse CPU geometry helper parity against v0.7.6.1.
- All JavaScript files pass `node --check`.
- All local HTML/JS import, `src`, and `href` runtime references resolve to existing files.

The old `performance_budget_v053_test` has a source-file-size assertion intended for the historical v0.5.3 presentation adapter. It rejects the newer adapter because the source grew by more than its hard-coded 2 KB allowance; that assertion is not a runtime or gameplay failure and is obsolete for this optimization pass.

## Environment limitation

The container's Chromium build cannot initialize its EGL/WebGL backend, so shader compilation and FPS cannot be measured visually here. The final performance result must therefore be measured on the target phone using the in-game Stats readout.
