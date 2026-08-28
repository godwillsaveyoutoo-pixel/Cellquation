# Cellquation Core v0.7.7a.11 — Seamless Playfield + Playlist Navigation Fix

## Playfield continuity
- The new bioluminescent deep-sea plate is installed as `assets/backgrounds/deepsea_playfield_v077a11.png`.
- The same background now continues behind the full play UI, including the top and bottom HUD.
- Top/bottom HUDs are translucent rather than opaque.
- WebGL maps its stage background to the corresponding full-viewport sub-rectangle, matching CSS `cover` alignment so the plate does not restart at the stage edge.
- Removed the stage's black CSS backing / inset shadow that visually cut the playfield into a separate panel.

## Playlist navigation
- Fixed the carousel feedback race where programmatic scrolling could be mistaken for a user swipe and overwrite tracks 1/2.
- Previous/next now advances from an explicit requested index and wraps deterministically: `1 → 2 → 3 → 4 → 5 → 1` and reverse.
- Programmatic carousel scrolling is suppressed from track-selection logic.
- Swipe selection only happens after actual pointer/touch/wheel intent.
- Audio continuity invariant is unchanged: ordinary gameplay actions never restart, reseek, or reload the current nature recording.
