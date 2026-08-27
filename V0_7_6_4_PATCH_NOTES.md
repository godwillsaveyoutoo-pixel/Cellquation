# Cellquation Core v0.7.6.4 — Smooth Mobile Rendering

## Quality policy
This pass changes the fallback order for weak smartphones.

Protected first:
1. cell membrane silhouette and rim;
2. synapse silhouette/mouth edge;
3. real-time Fusion, Split, Brood, Swap, Imitation, Destruct and transport choreography.

Reduced first on weak hardware:
1. ambient CSS animation/compositing;
2. internal cytoplasm/synapse micro-noise;
3. liquid flecks and fine grain;
4. tiny nucleus plasma micro-noise;
5. far synapse glow tail.

The user aesthetic preset itself is not modified.

## Edge quality
- v0.7.6.2 could lower the canvas to 0.62x–0.88x on weak phones. That is removed.
- Mobile render density has a hard **1.00x floor**.
- Cell silhouette antialiasing now uses the actual world-space pixel size: `viewScale / min(canvasWidth, canvasHeight)` instead of a height-only approximation.
- Brood nuclei use matching resolution-aware analytical edge smoothing.
- Strong devices can start or promote to 1.25x/1.50x render density; a proven very-strong device can reach 1.75x.

## Smoothness / frame pacing
- Foundations and tutorial simulation substeps changed from 120 Hz catch-up to a bounded 60 Hz catch-up.
- All active game loops cap catch-up at four simulation steps per rendered frame. This prevents a slow frame from generating a second CPU spike of 8–15 update passes.
- Elapsed real time is still consumed, so authored action duration does not become slow motion.
- Adaptive tier or canvas changes are deferred while a visible action is running.

## Low-end shader fallback
At full quality the existing material recipe executes unchanged.

On constrained/critical tiers only:
- cell cytoplasm replaces selected secondary 4-octave FBM fields with cheaper evolving-noise fields;
- liquid flecks are simplified or removed;
- grain is removed;
- tiny nucleus internal plasma noise is simplified;
- synapse internal fluid detail follows the same strategy;
- far synapse halo is reduced and its scissor tail is tightened.

Membrane SDF/noise, cell rim bands, synapse SDF/mouth geometry and interaction animation geometry remain full quality at every tier.

## Ambient fallback
- Balanced: ambient glints stop animating.
- Constrained: expensive backdrop blur is disabled and network particles are removed.
- Critical: network aura and additional ambient layers are removed.

## Validation
- 30/30 2-colour Foundations stored routes replay successfully.
- 30/30 3-colour Foundations stored routes replay successfully.
- 48/48 2-colour Living Networks stored routes replay successfully.
- 48/48 3-colour Living Networks stored routes replay successfully.
- Real-gameplay tutorial scenarios pass.
- Parallel Fusion/Split completion regression passes.
- Resize/orientation and portrait-fast regressions pass.
- Canonical MultiCell v0.12.1 regression suite passes.
- Canonical Synapse Transport v0.8.7 regression suite passes.
