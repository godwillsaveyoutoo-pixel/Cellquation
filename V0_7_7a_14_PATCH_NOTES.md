# Cellquation Core v0.7.7a.14 — Final Success FX + FX Volume

- Replaces the previous harp completion cue with the user-selected water FX (`841968__p4inkilla__water-fx-01.wav`).
- Adds a separate persistent **FX** volume slider in Settings → Sound.
- Ambience volume/mute remains independent from FX volume.
- FX volume is stored in `localStorage` as `cellquation.fx.volume` and is shared across menu/game pages.
- The completion cue obeys FX volume immediately, including changes made while a level is open.
- Setting FX to 0% suppresses the completion cue without affecting the nature playlist.
- Ambient continuity logic is otherwise unchanged: gameplay/UI actions do not restart or reseek nature audio.
- Service-worker cache bumped to `cellquation-v0.7.7a.14`.
