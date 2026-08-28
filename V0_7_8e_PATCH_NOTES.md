# Cellquation Core v0.7.8e — Persistent Audio Host + Scott Buckley Default

## Audio continuity
- Replaced document-by-document ambience playback with one persistent top-level audio host.
- `index.html` is now the persistent shell; the current Cellquation screen navigates inside a same-origin full-screen iframe.
- Menu/game navigation no longer destroys the live `Audio` object.
- After the first permitted user gesture, ordinary navigation does not reload, restart or reseek the current track.
- Direct links to campaign/game pages are wrapped back into the persistent shell automatically.
- Existing Ambience, mute, FX volume, single-track/playlist mode, and track selection preferences remain persistent.

## Scott Buckley
- Added **The Things That Keep Us Here** by Scott Buckley (Monomyth, 2019).
- This is track 01 / the default selection for the v0.7.8e standard setup.
- Per-track gain is reduced slightly (~1.2 dB) so it sits close to the normalized nature recordings without re-encoding the supplied MP3.
- The continuous playlist now contains six tracks: Scott Buckley + the five radio aporee recordings.
- Visible Settings credit: Scott Buckley · 2019 · CC BY 4.0.

## Other
- Fullscreen now targets the persistent top-level shell when Settings is opened inside the app iframe.
- PWA orientation remains `any`.
- v0.7.8d Brood-count visual fix and v0.7.8c Fusion source→target behavior are unchanged.
