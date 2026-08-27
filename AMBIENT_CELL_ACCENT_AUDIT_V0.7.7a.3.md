# Ambient + Cell Accent Audit — v0.7.7a.3

## Visual intent
The request was not to redesign the Brood or Imitation identities. The change is deliberately local:

- **Imitation**: brighter, more sparkling particles with brief twinkle peaks. The shader adds intermittent white-core and cross-flare energy; orbit geometry and particle count are unchanged.
- **Brood**: the small internal daughter/nucleus forms are lighter and more luminous. Their geometry, count and motion are unchanged. No broad new aura was introduced.

## Audio behaviour
The supplied 120.048-second MP3 is treated as one continuous session ambience.

A normal multi-page website cannot literally keep the same `<audio>` DOM node alive through full document navigations. v0.7.7a.3 therefore preserves the **playback timeline** instead:

1. current phase is saved on page hide/navigation;
2. the next Cellquation page calculates where the loop should now be;
3. it resumes at that phase rather than at 0:00;
4. if the browser blocks autoplay, the first user gesture resumes at the correct phase.

This avoids the perceptual "new track on every menu" behaviour while remaining compatible with mobile autoplay policy.

## Performance
- One MP3 audio element only.
- No WebAudio FFT, convolution, realtime synth or filters.
- No extra render passes for the visual accents; the existing Imitation/Brood shaders are only retuned.
- MP3 size: approximately 2.29 MiB.

## Regression surface
Game/campaign JavaScript was not edited. The intended changed runtime files are:

- `cellkit_latest/renderer.js`
- `cellkit_latest/profiles.js`
- `user_aesthetic_preset_v073.js`
- `ambient_audio_v077a3.js` (new)
- `assets/audio/underwater_ambience.mp3` (new)
- root HTML pages (ambient manager include only)
- `sw.js`
- `run.sh` version text

## Distribution note
The MP3 was supplied by the project owner. `AUDIO_SOURCE_NOTE.md` records the source filename. License/attribution requirements should be checked before public distribution.
