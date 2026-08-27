# Cellquation v0.7.7a.4 — Audio + Responsive Network Audit

## User-reported symptoms

1. Underwater ambience could not be heard.
2. Pause no longer offered convenient sound-volume adjustment.
3. Living Networks became extremely small in fullscreen on a normal desktop monitor.

## Root cause: silent ambience

The v0.7.7a.3 volume reader treated an absent localStorage key as numeric zero (`Number(null) === 0`). Therefore a new installation initialized the audio element at 0% rather than the declared 24% default.

Additionally, the supplied MP3 itself measured approximately:

- mean: `-29.1 dB`
- peak: `-12.3 dB`

v0.7.7a.4 re-levels the packaged copy by +7.5 dB:

- mean: `-22.1 dB`
- peak: `-5.2 dB`

and uses a default player setting of 62%. The user can change or mute this from Pause.

## Browser autoplay handling

A single HTMLAudioElement cannot literally survive a full multi-page navigation. Cellquation therefore persists the playback phase and active session state. The new manager marks playback intent before navigation, attempts immediate resume on the next page, and retries on allowed user gestures if Brave/Chrome blocks autoplay.

This preserves *where* the track is, rather than restarting it at 0:00 on each screen.

## Root cause: tiny fullscreen networks

`CellRenderer` defines world bounds using the smaller canvas dimension. On landscape:

- vertical half-span = `viewScale / 2`
- horizontal half-span = `aspect × viewScale / 2`

The previous network camera fit multiplied vertical demand by `aspect`, forcing `viewScale` to grow as the display became wider. A larger viewScale means smaller cells/network on screen.

The new fit solves scale directly from the renderer's actual half-span factors. Mathematical analysis across both 48-level Living Networks campaigns at a desktop aspect of ~2.41 showed a median old/new visual magnification of about **2.41×** after correction (2-colour minimum ~2.13×; 3-colour ~2.41×).

## Regression checks

- 32 JavaScript files: syntax OK
- 10 JSON / manifest files: parse OK
- 89 local HTML references: 0 missing
- 66 service-worker core references: 0 missing
- packaged MP3: decode OK
- protected CellKit/Synapse/campaign hashes: unchanged
- corrected network formula applied to both 2-colour and 3-colour Living Networks

## Runtime limitation of this environment

A real Chromium WebGL screenshot was attempted with SwiftShader, but the managed container cannot initialize EGL/ANGLE. The renderer-level desktop fit is therefore validated mathematically/staticly here; the physical desktop/browser view remains the final visual QA gate.
