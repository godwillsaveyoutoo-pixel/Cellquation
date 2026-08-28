# Cellquation Core v0.7.7a.10 — Nature Playlist & Settings

## Nature playlist

- Replaces the single synthetic/underwater ambience runtime with five user-supplied radio aporee nature recordings.
- Recordings are loudness-normalized to approximately -26 LUFS for consistent perceived volume.
- Playlist order:
  1. Daugava River — Daugavpils, Latvia
  2. Pacific Saline Pools — Chañaral, Chile
  3. Pond Underwater — Aknystėlės, Lithuania
  4. Lake Saiko Waves — Yamanashi, Japan
  5. Early Summer Dawn — Upo Wetland, South Korea

## Settings replaces Pause

- The gameplay footer now says **Settings** and uses a settings/sliders icon.
- Opening Settings still pauses the gameplay simulation, but **does not pause the nature audio**.
- The panel contains a horizontal scroll-snap / swipe carousel for the five recordings.
- Each track card shows what the recording is, where it was recorded, recordist, year and `radio aporee` source.
- Desktop/touch users can also use previous/next arrow buttons.
- Playback mode can be switched without restarting the current track:
  - **Continuous playlist** — advance through all five recordings.
  - **One sound** — repeat the selected recording.
- Volume and mute remain persistent.

## Audio continuity contract

- The first browser-allowed user gesture starts the playlist.
- Once audio is playing, ordinary gameplay/UI actions are strict audio no-ops: no `load()`, no seek, no replacement Audio object, no repeated `play()` call.
- Only an explicit track selection changes the source.
- Track index + current time + playback mode are stored before page navigation and restored on the next Cellquation document.
- Service worker no longer intercepts audio byte-range requests, reducing stale/partial media-cache problems on GitHub Pages.

## Verification

- JS syntax checks pass for the new audio runtime, shared UI runtime and service worker.
- Automated mock-Audio test: 25 repeated `play()` / gameplay-style calls while live produce **zero restarts**; `play()` remains at one call until an explicit track change.
- Cross-document state test restores `Lake Saiko Waves` at 77.25 s with one playback start.
- All five normalized MP3s are complete 48 kHz stereo files and retain radio aporee ID3 metadata.
