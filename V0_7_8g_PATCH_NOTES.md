# v0.7.8g — Menu Scaling & Target Cohesion

## Fixed
- Corrected the v0.7.8f Home CSS cache/version mismatch that could expose the intrinsic size of target-cell PNGs and make the 2/3-colour selector enormous.
- Added explicit width/height/max-size guards for the top colour-mode target cells.
- Increased and stabilized the campaign miniature viewport.

## Visual cohesion
- Level-select ratios now use the exact nucleus-free blue/green/violet target-cell assets from the gameplay HUD.
- Ratio numbers are centered inside those mini cells; colons remain as a lightweight mathematical separator.

## Performance
- Campaign CellKit/Synapse miniatures no longer run a continuous ~14 fps animation loop.
- They render only on initial mount, resize, campaign rebuild, or canonical synapse-settings refresh.
- Pixel ratio remains capped at 1 and detail is reduced for menu use.

## Preserved
- Persistent app-shell audio and Scott Buckley default track.
- Six-track playlist/navigation.
- Background/settings system.
- Living Networks dual-orientation layouts.
- Fusion first-click source → second-click target behavior.
- Exact Brood visual-count fix.
