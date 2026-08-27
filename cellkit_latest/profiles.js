
export const COLORS = Object.freeze({
  deep:   [0.000, 0.020, 0.145],
  mid:    [0.000, 0.205, 0.720],
  bright: [0.030, 0.760, 1.000],
  glow:   [0.000, 0.560, 1.000],
});

export const GREEN_COLORS = Object.freeze({
  deep:   [0.000, 0.095, 0.026],
  mid:    [0.020, 0.425, 0.105],
  bright: [0.180, 0.940, 0.350],
  glow:   [0.060, 0.720, 0.180],
});

export const VIOLET_COLORS = Object.freeze({
  deep:   [0.090, 0.000, 0.150],
  mid:    [0.420, 0.025, 0.680],
  bright: [0.900, 0.180, 1.000],
  glow:   [0.700, 0.060, 1.000],
});

export function paletteForSpecies(species = 'blue') {
  if (species === 'green') return GREEN_COLORS;
  if (species === 'violet') return VIOLET_COLORS;
  return COLORS;
}


export const CELL_IDLE_IDENTITY_DEFAULTS = Object.freeze({
  enabled: 1,
  master: 1.0,
  cellPulseAmplitude: 0.014,
  cellPulseSpeed: 0.72,
  rimDriftStrength: 0.78,
  rimDriftSpeed: 0.20,
  membraneWobble: 0.10,
  nucleusDriftAmplitude: 0.0075,
  nucleusDriftSpeed: 0.62,
  nucleusPulseAmplitude: 0.035,
  nucleusPulseSpeed: 0.86,
  phaseVariation: 1.0,
});

/* v0.12.3 production-minded starting personalities. These are deliberately
   restrained: each type belongs to the same CellKit species, but no longer
   inherits one identical idle rhythm from Fusion. */
export const CELL_TYPE_IDLE_IDENTITY_DEFAULTS = Object.freeze({
  /* v0.12.3.1 art-directed production defaults: stronger than the lab's
     conservative starting point, but deliberately slow and phase-offset so
     the cells read as alive rather than animated widgets. */
  fusion: Object.freeze({ enabled:1, master:1.00, cellPulseAmplitude:0.024, cellPulseSpeed:0.54, rimDriftStrength:1.28, rimDriftSpeed:0.295, membraneWobble:0.17, nucleusDriftAmplitude:0.0115, nucleusDriftSpeed:0.50, nucleusPulseAmplitude:0.056, nucleusPulseSpeed:0.68, phaseVariation:1.00 }),
  split: Object.freeze({ enabled:1, master:0.98, cellPulseAmplitude:0.018, cellPulseSpeed:0.50, rimDriftStrength:1.12, rimDriftSpeed:0.240, membraneWobble:0.14, nucleusDriftAmplitude:0.0095, nucleusDriftSpeed:0.48, nucleusPulseAmplitude:0.046, nucleusPulseSpeed:0.64, phaseVariation:1.12 }),
  brood: Object.freeze({ enabled:1, master:0.94, cellPulseAmplitude:0.015, cellPulseSpeed:0.44, rimDriftStrength:0.96, rimDriftSpeed:0.195, membraneWobble:0.11, nucleusDriftAmplitude:0.0070, nucleusDriftSpeed:0.42, nucleusPulseAmplitude:0.034, nucleusPulseSpeed:0.58, phaseVariation:1.05 }),
  destruct: Object.freeze({ enabled:1, master:0.98, cellPulseAmplitude:0.011, cellPulseSpeed:0.86, rimDriftStrength:1.02, rimDriftSpeed:0.355, membraneWobble:0.18, nucleusDriftAmplitude:0.0075, nucleusDriftSpeed:0.90, nucleusPulseAmplitude:0.074, nucleusPulseSpeed:1.26, phaseVariation:1.20 }),
  swap: Object.freeze({ enabled:1, master:1.00, cellPulseAmplitude:0.020, cellPulseSpeed:0.64, rimDriftStrength:1.30, rimDriftSpeed:0.320, membraneWobble:0.15, nucleusDriftAmplitude:0.0105, nucleusDriftSpeed:0.67, nucleusPulseAmplitude:0.055, nucleusPulseSpeed:0.92, phaseVariation:1.08 }),
  imitate: Object.freeze({ enabled:1, master:1.00, cellPulseAmplitude:0.017, cellPulseSpeed:0.47, rimDriftStrength:1.42, rimDriftSpeed:-0.270, membraneWobble:0.13, nucleusDriftAmplitude:0.0130, nucleusDriftSpeed:0.44, nucleusPulseAmplitude:0.060, nucleusPulseSpeed:0.57, phaseVariation:1.22 }),
});

export const CELL_TYPE_MATERIAL_DEFAULTS = Object.freeze({
  /* v0.12.3.2 Cell Material Glow Pass. The body is deliberately darker and
     more transmissive while coloured membrane light, inner gel emission and
     nucleus halos are stronger. The intent is luminous bio-gel, not neon. */
  fusion: Object.freeze({ enabled:1, master:1.00, bodyTransmission:0.74, innerDarkness:0.50, rimBrightness:2.42, rimSoftness:1.22, innerRimStrength:0.14, innerGlowStrength:1.20, highlightStrength:1.48, gelDepth:1.56, nucleusHaloStrength:2.08, nucleusOpacity:0.84, nucleusContrast:1.46, nucleusDepth:0.38 }),
  split: Object.freeze({ enabled:1, master:1.00, bodyTransmission:0.68, innerDarkness:0.53, rimBrightness:2.30, rimSoftness:1.18, innerRimStrength:0.15, innerGlowStrength:1.08, highlightStrength:1.42, gelDepth:1.60, nucleusHaloStrength:2.18, nucleusOpacity:0.88, nucleusContrast:1.56, nucleusDepth:0.35 }),
  brood: Object.freeze({ enabled:1, master:1.00, bodyTransmission:0.70, innerDarkness:0.44, rimBrightness:2.16, rimSoftness:1.24, innerRimStrength:0.12, innerGlowStrength:1.12, highlightStrength:1.34, gelDepth:1.44, nucleusHaloStrength:1.86, nucleusOpacity:0.84, nucleusContrast:1.38, nucleusDepth:0.32 }),
  destruct: Object.freeze({ enabled:1, master:1.00, bodyTransmission:0.42, innerDarkness:0.64, rimBrightness:2.02, rimSoftness:1.08, innerRimStrength:0.10, innerGlowStrength:0.74, highlightStrength:1.18, gelDepth:1.54, nucleusHaloStrength:2.32, nucleusOpacity:0.98, nucleusContrast:1.76, nucleusDepth:0.26 }),
  swap: Object.freeze({ enabled:1, master:1.00, bodyTransmission:0.66, innerDarkness:0.50, rimBrightness:2.34, rimSoftness:1.20, innerRimStrength:0.14, innerGlowStrength:1.12, highlightStrength:1.44, gelDepth:1.52, nucleusHaloStrength:2.20, nucleusOpacity:0.85, nucleusContrast:1.52, nucleusDepth:0.40 }),
  imitate: Object.freeze({ enabled:1, master:1.00, bodyTransmission:0.82, innerDarkness:0.42, rimBrightness:2.56, rimSoftness:1.30, innerRimStrength:0.12, innerGlowStrength:1.34, highlightStrength:1.54, gelDepth:1.40, nucleusHaloStrength:2.26, nucleusOpacity:0.72, nucleusContrast:1.40, nucleusDepth:0.48 }),
});

export const FUSION_VISUAL_DEFAULTS = Object.freeze({
  radius: 0.155,
  nucleusRadius: 0.041,
  activity: 1.00,

  membraneLiving: 0.95,
  membraneAmp1: 0.010,
  membraneAmp2: 0.0058,
  membraneAmp3: 0.0022,
  membraneThickness: 0.86,
  membraneGlints: 0.82,

  volumeDepth: 1.24,
  densityContrast: 1.52,
  fluidWarp: 0.118,
  fluidSpeed: 1.42,
  liquidLights: 1.28,
  fineDetail: 1.55,

  nucleusGlow: 0.92,
  nucleusPlasma: 0.88,
  nucleusSheen: 0.56,

  distortionStrength: 0.90,
  glowStrength: 1.18,
  exposure: 1.52,
  grainStrength: 0.30,
  nucleusPulse: 0.08,
});

export const SPLIT_VISUAL_DEFAULTS = Object.freeze({
  // v0.7.2.4 scale balance: still visibly larger than Fusion (0.155), but no longer dominates the field.
  radius: 0.195,
  nucleusRadius: 0.035,
  nucleusSeparation: 0.106,
  activity: 0.96,

  membraneLiving: 0.86,
  membraneAmp1: 0.010,
  membraneAmp2: 0.0056,
  membraneAmp3: 0.0024,
  membraneThickness: 0.88,
  membraneGlints: 0.92,

  volumeDepth: 1.28,
  densityContrast: 1.58,
  fluidWarp: 0.122,
  fluidSpeed: 1.28,
  liquidLights: 1.34,
  fineDetail: 1.58,

  nucleusGlow: 1.04,
  nucleusPlasma: 1.02,
  nucleusSheen: 0.56,

  distortionStrength: 0.98,
  glowStrength: 1.20,
  exposure: 1.55,
  grainStrength: 0.30,
  nucleusPulse: 0.09,
});

export const SWITCH_VISUAL_DEFAULTS = Object.freeze({
  radius: 0.155,
  nucleusRadius: 0.041,
  activity: 1.04,
  swapDuration: 0.68,

  membraneLiving: 0.98,
  membraneAmp1: 0.0105,
  membraneAmp2: 0.0060,
  membraneAmp3: 0.0024,
  membraneThickness: 0.86,
  membraneGlints: 0.88,

  volumeDepth: 1.24,
  densityContrast: 1.54,
  fluidWarp: 0.120,
  fluidSpeed: 1.46,
  liquidLights: 1.30,
  fineDetail: 1.56,

  nucleusGlow: 1.00,
  nucleusPlasma: 0.98,
  nucleusSheen: 0.60,

  distortionStrength: 0.94,
  glowStrength: 1.18,
  exposure: 1.54,
  grainStrength: 0.30,
  nucleusPulse: 0.12,

  /* Eclipse/corona glow around the nucleus; this remains part of the main
     cell shader and never becomes a second overlay pass. */
  swapRingRadius: 0.034,
  swapRingWidth: 0.0100,
  swapRingGlow: 3.00,
  swapPulseSpeed: 1.8,
});


export const MIMIC_VISUAL_DEFAULTS = Object.freeze({
  radius: 0.155,
  nucleusRadius: 0.041,
  activity: 1.06,

  membraneLiving: 0.98,
  membraneAmp1: 0.0106,
  membraneAmp2: 0.0060,
  membraneAmp3: 0.0024,
  membraneThickness: 0.86,
  membraneGlints: 0.90,

  volumeDepth: 1.26,
  densityContrast: 1.56,
  fluidWarp: 0.126,
  fluidSpeed: 1.48,
  liquidLights: 1.42,
  fineDetail: 1.62,

  nucleusGlow: 1.08,
  nucleusPlasma: 1.00,
  nucleusSheen: 0.64,

  distortionStrength: 0.96,
  glowStrength: 1.22,
  exposure: 1.55,
  grainStrength: 0.30,
  nucleusPulse: 0.12,

  mimicOrbitRadius: 0.135,
  mimicOrganelles: 12,
  mimicSize: 0.0100,
  mimicGlow: 1.18,
  mimicPulseSpeed: 2.00,
  mimicPrismShift: 0.42,
  imitationDuration: 0.78,
});

export const DESTRUCT_VISUAL_DEFAULTS = Object.freeze({
  radius: 0.155,
  nucleusRadius: 0.043,
  activity: 1.18,
  destructDuration: 0.72,

  membraneLiving: 1.06,
  membraneAmp1: 0.0118,
  membraneAmp2: 0.0068,
  membraneAmp3: 0.0028,
  membraneThickness: 0.88,
  membraneGlints: 0.82,

  volumeDepth: 1.24,
  densityContrast: 1.66,
  fluidWarp: 0.132,
  fluidSpeed: 1.62,
  liquidLights: 1.02,
  fineDetail: 1.64,

  nucleusGlow: 1.44,
  nucleusPlasma: 1.48,
  nucleusSheen: 0.56,
  nucleusPulse: 0.96,

  distortionStrength: 0.98,
  glowStrength: 1.18,
  exposure: 1.56,
  grainStrength: 0.30,
});

/* The cell body remains the shared blue CellKit material. Only the nucleus
   gets this hot destruct palette, so the type stays in the same visual family. */
export const DESTRUCT_NUCLEUS_COLORS = Object.freeze({
  deep:   [0.155, 0.004, 0.000],
  mid:    [0.720, 0.040, 0.004],
  bright: [1.000, 0.390, 0.035],
  glow:   [1.000, 0.105, 0.010],
});

export const BROOD_VISUAL_DEFAULTS = Object.freeze({
  /* v0.12.3: Brood owns an independent body profile. Defaults intentionally
     stay close to Fusion so the eventual Brood → Fusion takeover remains calm. */
  radius: 0.155,
  nucleusRadius: 0.041,
  activity: 0.90,
  membraneLiving: 0.88,
  membraneAmp1: 0.0092,
  membraneAmp2: 0.0052,
  membraneAmp3: 0.0021,
  membraneThickness: 0.90,
  membraneGlints: 0.80,
  volumeDepth: 1.20,
  densityContrast: 1.42,
  fluidWarp: 0.108,
  fluidSpeed: 1.12,
  liquidLights: 1.18,
  fineDetail: 1.48,
  nucleusGlow: 0.98,
  nucleusPlasma: 0.90,
  nucleusSheen: 0.56,
  distortionStrength: 0.90,
  glowStrength: 1.12,
  exposure: 1.50,
  grainStrength: 0.28,
  nucleusPulse: 0.07,
  broodNucleusRadius: 0.0215,
  broodOrbitInner: 0.066,
  broodOrbitOuter: 0.116,
  broodNucleusGlow: 1.36,
  broodDivisionDuration: 3.10,
});

export const FUSION_SPLIT_TRANSITION_DEFAULTS = Object.freeze({
  fusionDuration: 3.20,
  divisionDuration: 3.20,
  contactResistance: 0.92,
  adhesion: 0.88,
  surfaceTension: 0.92,
  fluidReaction: 0.00,
  pinchStrength: 0.88,
  recoil: 0.62,
});

export function cloneProfile(profile) {
  return JSON.parse(JSON.stringify(profile));
}


export const WORLD_DEFAULTS = Object.freeze({
  driftSpeed: 0.018,
  driftDamping: 0.994,
  collisionSoftness: 0.88,
  collisionPadding: 0.010,
  boundaryPadding: 0.026,
  maxCells: 2048,

  /* v0.7 continuity-first dynamics.  No cell is ever allowed to become
     visually fast merely to satisfy a short interaction deadline. */
  maxSpeed: 0.090,
  maxAcceleration: 0.22,
  temporaryYieldMaxSpeed: 0.120,
  temporaryYieldMaxAcceleration: 0.32,

  /* Fusion approach deliberately trades speed for temporal smoothness.
     Far-apart cells may take several seconds; they may never jump to catch up. */
  fusionApproachMaxDuration: 4.80,
  fusionApproachMinDuration: 1.20,
  fusionApproachDistanceRate: 0.25,
  fusionApproachResponse: 6.0,
  fusionApproachTrackResponse: 3.8,
  fusionApproachMaxClosingSpeed: 0.22,
  fusionApproachMaxAcceleration: 0.32,
  fusionApproachCellMaxSpeed: 0.120,
  fusionApproachEngagementDuration: 0.48,

  corridorPush: 0.20,
  collisionSpring: 0.58,
  boundarySpring: 0.72,
});
