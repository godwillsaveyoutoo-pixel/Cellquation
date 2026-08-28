# Cellquation Core v0.7.7a.13 — Browser Regression Notes

## Verified in Chromium DOM/runtime harness

- Campaign/browser Settings target: **48 × 48 px**.
- At **780 × 360** and **640 × 360**, the campaign progress metadata is hidden as intended while Settings remains a 48 × 48 px right-hand utility control; no horizontal overflow was measured.
- Nature carousel visual wrap was exercised from track 5 onward and produced exactly:
  `5 → 1 → 2 → 3 → 4`, with the active card centred on each step.
- With a deterministic Audio test double, repeated `CellquationAmbient.play()` calls while the track was already playing produced **zero additional playback starts**.
- Background carousel visual wrap was exercised from background 5 onward and produced exactly:
  `5 → 1 → 2 → 3 → 4`, with the active card centred.
- Background selection updates the shared CSS playfield variable and dispatches the runtime background-change state used by the renderer.

## Renderer verification

The sandbox Chromium build does not expose a usable WebGL context, even with SwiftShader flags, so a full rendered-frame WebGL screenshot test cannot be executed here. The runtime bridge was therefore verified source-to-source instead:

1. `settings_v077a12.js` dispatches `cellquation:backgroundchange` with the chosen full-resolution source.
2. `cellkit_latest/renderer.js` initializes from `window.CellquationBackgroundState`.
3. The renderer listens for `cellquation:backgroundchange` and calls `setBackgroundImage(detail.src, ...)`.
4. No legacy hardcoded deep-sea playfield path remains in the renderer.
5. All four gameplay families import the v0.7.7a.13 renderer revision.

A physical-device pass on the Samsung A20/Oppo remains the final authority for real GPU frame pacing.
