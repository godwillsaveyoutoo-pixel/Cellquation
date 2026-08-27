# Cellquation Core v0.7.6.1 — Code Hygiene Audit

## Scope
This pass deliberately changes **no puzzle rules, cell presets, animation curves, campaign data or tutorial semantics**. It removes legacy/runtime waste and reduces allocations in hot paths.

## What the audit found in v0.7.6
- Full source bundle: **353 files / 4,444,093 bytes**.
- Files actually reachable by the current game pages: **65 files / 996,095 bytes**.
- Therefore roughly **3.45 MB / 288 files** were historical tests, old versions, reference editors, reports or other non-runtime material.
- There were **41 groups of byte-identical duplicate files**, representing about **275 KB** of exact duplicate storage.

Those unused files did **not** all slow the browser down, because unrequested files are not executed. They did, however, make the source tree much harder to reason about.

## Runtime waste removed
1. **Stale module preload URLs**
   - Selection screens still preloaded game modules as `?v=0.7.2.4` while the play pages loaded `?v=0.7.6`.
   - The renderer was preloaded as `?v=0.12.3.2` while runtime imported `?v=0.12.3.7`.
   - Browsers can treat those as different resource URLs, causing duplicate fetch/cache/parse work.
   - All preload URLs now exactly match the production module URLs.

2. **Legacy Synapse renderer loaded in production**
   - Both Living Networks engines statically imported both Synapse v0.5.3 and the older v0.5.2 comparison renderer.
   - The old `?look=previous` comparison path was development-only and is removed from production.
   - Production now imports and instantiates only SynapseRenderer v0.5.3.

3. **Production load profiler removed**
   - Every play page loaded a profiler that collected Resource Timing data and wrote a report to storage.
   - It was useful during earlier loading work, but is not needed during normal play and has been removed from the production pages.

4. **Hidden Stats no longer profiles every frame**
   - Living Networks used `performance.now()`, rolling arrays, dropped-frame counters and percentile sorting even while the Stats panel was hidden.
   - All detailed instrumentation now runs only while Stats is visible.
   - Foundations similarly stops updating hidden Stats DOM text.

5. **Duplicate per-frame resize work removed**
   - Foundations and the tutorial called `renderer.resize()` before rendering, while `beginFrame()` already performs the same check.
   - The duplicate call is removed.

6. **Renderer hot-loop garbage reduced**
   - The cell renderer rebuilt the style-uniform key array and several empty/default objects on every cell draw.
   - Idle mechanics, rotations and phase objects are now reused.
   - Idle cells no longer clone their visual profile every frame.
   - Fallback objects inside `#applyCommon` are replaced by direct optional access.

7. **Living Networks static-cell garbage reduced**
   - Static node cells previously replaced their `position` array every frame.
   - A new `Set` and active-edge pair were also allocated every frame.
   - Positions are now updated in place and the skip structures are reused.

8. **Dead helpers removed**
   - Unused `worldName()` and `levelGlobalNumber()` helpers were removed from both Foundations engines.

## Clean package
The clean v0.7.6.1 package contains only the current runtime dependency graph plus this audit and the user's original aesthetic preset reference. Historical builds, old renderers, editor copies, old patch notes, preview screenshots and obsolete tests are not shipped in the playable source folder.

Runtime dependency graph after cleanup: **63 files / 962,557 bytes** before adding this audit/reference file.

## Intentionally not refactored yet
The 2-colour and 3-colour gameplay engines still contain substantial parallel code. That is real maintenance debt, but it is **not loaded simultaneously** and therefore is not the current low-end-phone bottleneck. Unifying those engines would be a much larger behavioural refactor with a higher regression risk. It is better done later, after the mobile-performance baseline is stable.

Likewise, `visual_identity_v062` + `visual_identity_v072` are both still active layers; they are not dead duplicates. Consolidating their names/files could make the tree prettier but would provide almost no runtime gain.

## Regression verification
The v0.7.6.1 full QA source passed:
- code-hygiene guard;
- real gameplay tutorial scenarios;
- aesthetic preset parity;
- 30/30 2-colour Foundations replay;
- 30/30 3-colour Foundations replay;
- 48/48 2-colour Living Networks semantics;
- 48/48 3-colour Living Networks semantics;
- three-colour network layout audit;
- parallel Fusion/Split completion regression;
- portrait and resize regressions;
- canonical MultiCell suite;
- canonical Synapse v0.8.7 suite.
