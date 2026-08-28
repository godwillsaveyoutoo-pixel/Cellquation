# Cellquation Core v0.7.7a.12 — Settings & Background Integration

## Unified Settings
- Removed the standalone Fullscreen control from the Home screen.
- Added one Settings control at the top-right of Home and all four campaign/level browsers.
- Gameplay keeps the existing bottom-bar Settings control.
- Menu Settings and gameplay Settings now share the same two sections: **Sound** and **Display**.
- Fullscreen moved into **Display** and uses the same enter/exit state everywhere.

## Five persistent deep-sea backgrounds
The player can swipe or use arrows to choose between:
1. Abyss Void
2. Bioluminescent Reef
3. Midnight Trench
4. Emerald Depths
5. Quiet Ocean

- The chosen background is stored in `localStorage` and survives page navigation and later sessions.
- The same selected plate is used behind menus and the complete gameplay viewport.
- Background switching preloads the next full-resolution plate before applying it, avoiding a black/blank flash.
- Small dedicated thumbnails are used in Settings so the picker does not need to decode all five full-resolution images just to render the carousel.

## Soundscape continuity retained
- The five normalized radio aporee nature recordings remain available.
- Continuous playlist / One sound mode remains available.
- The first permitted user gesture starts or resumes the soundscape.
- Repeated gameplay/UI actions while ambience is already playing remain strict no-ops for playback: no reload, restart or reseek.
- Deterministic `1 → 2 → 3 → 4 → 5 → 1` track navigation from v0.7.7a.11 is retained.

## Level completion cue
- Added the selected harp/glissando cue as a separate completion SFX.
- Source was trimmed/faded to ~2.28 s and normalized to ~-18.4 LUFS for concise feedback.
- The cue is triggered once by all four gameplay families: 2-colour Foundations, 2-colour Living Networks, 3-colour Foundations and 3-colour Living Networks.
- Completion SFX uses a separate Audio object and does **not** pause, seek or restart the nature soundscape.

## Cache / deployment
- Service-worker cache version bumped to `cellquation-v0.7.7a.12`.
- New Settings JS/CSS and all five background plates/thumbnails are included in the core cache.
- Changed gameplay module URLs are cache-busted to v0.7.7a.12 so the completion cue hook cannot be hidden by an older browser cache.

## Verification
- JavaScript syntax checks passed for shared UI, Settings, nature audio, success SFX and all four gameplay scripts.
- Static reference audit found no missing HTML/JS/background assets.
- Mock-DOM integration test confirmed: unified menu Settings, 5 nature tracks, 5 backgrounds, persistent background selection, background wraparound, and Fullscreen only inside Display.
- Audio regression test confirmed 25 repeated ambient `play()` calls produce one actual playback start while live.
- Playlist wrap regression retained: `1 → 2 → 3 → 4 → 5 → 1`.
- Separate-SFX test confirmed the harp cue plays while ambience remains live with its playback count unchanged.
