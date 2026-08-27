# Cellquation Core v0.7.7a.7 — Menu Luminance & Bioluminescence Pass

## Scope
This pass is built directly on v0.7.7a.6 Level Status Clarity. It deliberately keeps the v0.7.7a.6 status grammar intact (`✓`, stars, `▶ CONTINUE`, `NEW`) and changes the surrounding visual hierarchy instead.

## Menu luminance
- Deep-sea artwork is allowed to read more clearly by reducing the heavy dark overlay.
- Menu surfaces are lifted out of the near-black/grey range into a more visibly blue/teal glass range.
- Borders have slightly more luminance so cards separate from the background without thick glow.
- Primary text is closer to clean white; secondary text is less greyed out.
- Ratio pills have stronger cyan/green/violet identity.
- `NEW` remains neutral and quiet, but is no longer lost in the card.
- Completed cards use a restrained accent wash rather than a large saturated green/purple fill.
- `CONTINUE` remains the strongest state through its brighter cyan/violet edge and slightly more luminous surface.
- Bioluminescence is concentrated in small elements (badges, selected tab, ratio pills) rather than broad neon halos.

## Ambient background continuity
v0.7.7a.4 already persisted the ambience phase in `sessionStorage`, but a newly-created audio element could start playback before duration metadata was ready, briefly exposing timestamp 0 before seeking to the saved phase.

v0.7.7a.7 changes the startup order to:

1. load metadata;
2. calculate the phase from the persisted timestamp;
3. seek to that phase;
4. wait for the seek to settle;
5. only then call `play()`.

This removes the audible "track starts over, then catches up" behaviour during normal page/button navigation while preserving the existing volume and mute settings.

## Files added
- `menu_luminance_v077a7.css`
- `ambient_audio_v077a7.js`
- `V0_7_7a_7_PATCH_NOTES.md`

## Files updated
- menu/browser HTML entry points
- gameplay/tutorial HTML audio script references
- `sw.js`
