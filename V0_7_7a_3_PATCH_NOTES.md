# Cellquation v0.7.7a.3 — Ambient Integration & Cell Accent Pass

## Scope
A narrow presentation/audio pass on top of v0.7.7a.2. No campaign, puzzle, action timing, menu architecture or network logic changes.

## Imitation cell
- Kept the existing organelle count, size family and orbit geometry.
- Added sharper intermittent twinkle peaks rather than a constant larger glow.
- Increased small white flare/core contribution so particles read as bioluminescent sparkles.
- Increased `mimicGlow` from 1.90 to 2.22 in the approved runtime preset.

## Brood cell
- Kept Brood daughter/nucleus count, positions, radii and behaviour unchanged.
- Increased internal luminance, local glow and highlight of the tiny Brood nuclei.
- Increased runtime `broodNucleusGlow` from 1.80 to 2.18.
- Outer halo remains restrained; brightness is concentrated inside/on the tiny nuclei.

## Underwater ambience
- Integrates the user-supplied `freesound_community-underwater-ambiencewav-14428.mp3` as `assets/audio/underwater_ambience.mp3`.
- Track duration is about 120.048 seconds and loops.
- Default volume: 0.24.
- Starts after the first permitted user interaction, in line with mobile autoplay restrictions.
- A session-continuity manager stores playback phase in `sessionStorage`.
- On same-origin navigation the new page resumes the ambience at the corresponding point instead of restarting from 0.
- If autoplay on the new page is blocked, the first subsequent tap resumes the correct timeline.
- The ambience is shared across Home, campaign/world browsers, tutorial and gameplay pages.

## PWA/offline
- New audio file and ambient manager are included in the service-worker cache.
- Cache id bumped to `cellquation-v0.7.7a.3-ambient-cell-accents` so older cached shells are invalidated.

## Explicitly unchanged
- Campaign data and level solutions.
- Foundation / Living Networks game logic.
- Synapse geometry/choreography.
- Cell sizes, Brood counts/orbits, Imitation particle count/orbit.
- v0.7.7a.2 unified WebGL background pipeline.
