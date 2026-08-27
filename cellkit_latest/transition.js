
export const TransitionPhase = Object.freeze({
  IDLE: 'idle',
  FUSING: 'fusing',
  SPLIT: 'split',
  DIVIDING: 'dividing',
});

export class FusionSplitTransition {
  constructor(profile) {
    this.profile = profile;
    this.phase = TransitionPhase.IDLE;
    this.playbackSpeed = 1;
    this.manualScrub = false;
    this.scrubRaw = 0;
    this.progress = 0;
  }

  beginFusion() {
    this.phase = TransitionPhase.FUSING;
    this.progress = 0;
    this.scrubRaw = 0;
  }

  beginDivision() {
    this.phase = TransitionPhase.DIVIDING;
    this.progress = 0;
    this.scrubRaw = 0;
  }

  setSplit() {
    this.phase = TransitionPhase.SPLIT;
    this.progress = 1;
    this.scrubRaw = 1;
  }

  reset() {
    this.phase = TransitionPhase.IDLE;
    this.progress = 0;
    this.scrubRaw = 0;
  }

  setPlaybackSpeed(speed) {
    this.playbackSpeed = Math.max(0.01, Number(speed) || 1);
  }

  setManualScrub(enabled, raw = this.scrubRaw) {
    this.manualScrub = Boolean(enabled);
    this.scrubRaw = Math.max(0, Math.min(1, raw));
    if (this.manualScrub) this.progress = this.scrubRaw;
  }

  setScrub(raw) {
    this.scrubRaw = Math.max(0, Math.min(1, raw));
    this.progress = this.scrubRaw;
  }

  step(frameDt) {
    if (this.manualScrub) return;
    if (this.phase !== TransitionPhase.FUSING &&
        this.phase !== TransitionPhase.DIVIDING) return;

    /* The caller already caps world dt. Cap once more here so a renderer
       stall can never turn into a visible transition jump. */
    const dt = Math.max(0, Math.min(1 / 45, frameDt));
    const duration = this.phase === TransitionPhase.FUSING
      ? this.profile.fusionDuration
      : this.profile.divisionDuration;

    this.progress = Math.max(
      0,
      Math.min(1, this.progress + dt * this.playbackSpeed / Math.max(0.25, duration))
    );
    this.scrubRaw = this.progress;
  }

  getRaw() {
    if (this.phase === TransitionPhase.IDLE) return 0;
    if (this.phase === TransitionPhase.SPLIT) return 1;
    return this.manualScrub ? this.scrubRaw : this.progress;
  }
}

export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
export function smooth01(v) {
  v = clamp01(v);
  return v * v * (3 - 2 * v);
}
export function smoother(v) {
  v = clamp01(v);
  return v * v * v * (v * (v * 6 - 15) + 10);
}
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
export function pulse(t, a, b) {
  const up = smooth01((t - a) / Math.max(0.0001, (b - a) * 0.42));
  const down = 1 - smooth01((t - (a + (b - a) * 0.58)) / Math.max(0.0001, (b - a) * 0.42));
  return clamp01(Math.min(up, down));
}
export function dampedWave(t, start, freq, decay) {
  if (t <= start) return 0;
  const x = t - start;
  return Math.sin(x * Math.PI * 2 * freq) * Math.exp(-x * decay);
}

/**
 * Maps transition progress to mechanical state.
 * This layer is deliberately separate from the shader:
 * the shader renders mechanics; it does not decide gameplay state.
 */
export function evaluateFusionSplitMechanics({
  raw,
  phase,
  fusionVisual,
  splitVisual,
  dynamics,
  startPairSep = 0.175,
}) {
  raw = clamp01(raw);

  const contactSep = fusionVisual.radius * 1.005;
  const compressedSep =
    fusionVisual.radius * (1.005 - 0.035 * dynamics.contactResistance);
  const innerSep = fusionVisual.radius * 0.58;
  const releaseSep = contactSep + 0.018;

  const idleState = {
    styleP: 0,
    pairSep: startPairSep,
    merge: 0,
    relax: 0,
    compression: 0,
    seam: 0,
    stretch: 0,
    pinch: 0,
    recoil: 0,
    flowBoost: 0,
    fluidReactionStrength: 0,
    nucleusMove: 0,
    wallTension: 0,
    raw: 0,
  };

  if (phase === 'idle') return idleState;

  if (phase === 'split') {
    return {
      ...idleState,
      styleP: 1,
      pairSep: innerSep,
      merge: 1,
      relax: 1,
      nucleusMove: 1,
      raw: 1,
    };
  }

  if (phase === 'fusing') {
    /* C1-continuous separation curve.
       Every segment arrives with zero velocity before the next starts. */
    let pairSep;
    if (raw < 0.24) {
      pairSep = lerp(startPairSep, contactSep, smoother(raw / 0.24));
    } else if (raw < 0.44) {
      const t = smoother((raw - 0.24) / 0.20);
      /* squared sine has zero displacement AND zero slope at both ends */
      const elastic = Math.pow(Math.sin(Math.PI * clamp01((raw - 0.24) / 0.20)), 2);
      pairSep =
        lerp(contactSep, compressedSep, t) +
        elastic * 0.0015 * dynamics.contactResistance;
    } else if (raw < 0.78) {
      pairSep = lerp(
        compressedSep,
        innerSep,
        smoother((raw - 0.44) / 0.34)
      );
    } else {
      pairSep = innerSep;
    }

    const compression =
      smooth01((raw - 0.18) / 0.18) *
      (1 - smooth01((raw - 0.50) / 0.22)) *
      dynamics.contactResistance;

    const merge = smooth01((raw - 0.40) / 0.34);
    const seam =
      smooth01((raw - 0.17) / 0.12) *
      (1 - smooth01((raw - 0.52) / 0.22));

    const relax = smooth01((raw - 0.61) / 0.37);

    const stretch =
      smooth01((raw - 0.38) / 0.18) *
      (1 - smooth01((raw - 0.78) / 0.20)) *
      (0.62 + 0.38 * dynamics.surfaceTension);

    /* Recoil is visual deformation only and is explicitly zero at its
       start/end, so it can never move the daughter centers discontinuously. */
    const recoilWindow =
      smooth01((raw - 0.70) / 0.10) *
      (1 - smooth01((raw - 0.90) / 0.10));
    const recoil =
      Math.sin(clamp01((raw - 0.70) / 0.30) * Math.PI * 2.0) *
      recoilWindow * 0.18 * dynamics.recoil;

    const nucleusMove = smoother((raw - 0.46) / 0.46);

    const wallTension = clamp01(
      compression * 0.78 +
      smooth01((raw - 0.34) / 0.18) *
      (1 - smooth01((raw - 0.78) / 0.18)) *
      0.52 * dynamics.surfaceTension
    );

    const flowBoost = clamp01(
      smooth01((raw - 0.26) / 0.18) *
      (1 - smooth01((raw - 0.80) / 0.18)) *
      dynamics.fluidReaction
    );

    return {
      styleP: smooth01((raw - 0.46) / 0.50),
      pairSep,
      merge,
      relax,
      compression,
      seam,
      stretch,
      pinch: 0,
      recoil,
      flowBoost,
      fluidReactionStrength: clamp01(dynamics.fluidReaction / 1.8),
      nucleusMove,
      wallTension,
      raw,
    };
  }

  /* Division: also C1-continuous from the single Split mass all the way
     to the two final Fusion centers. No late positional kick. */
  let pairSep;
  if (raw < 0.18) {
    pairSep = innerSep;
  } else if (raw < 0.64) {
    pairSep = lerp(
      innerSep,
      contactSep * 0.91,
      smoother((raw - 0.18) / 0.46)
    );
  } else if (raw < 0.84) {
    pairSep = lerp(
      contactSep * 0.91,
      contactSep,
      smoother((raw - 0.64) / 0.20)
    );
  } else {
    pairSep = lerp(
      contactSep,
      releaseSep,
      smoother((raw - 0.84) / 0.16)
    );
  }

  const nucleusMove = 1 - smoother((raw - 0.07) / 0.43);

  const stretch =
    smooth01((raw - 0.05) / 0.18) *
    (1 - smooth01((raw - 0.76) / 0.22)) *
    (0.76 + 0.24 * dynamics.surfaceTension);

  const pinch =
    smooth01((raw - 0.24) / 0.30) *
    (1 - smooth01((raw - 0.84) / 0.15)) *
    dynamics.pinchStrength;

  const relax = 1 - smoother((raw - 0.34) / 0.56);
  const merge = 1 - smoother((raw - 0.80) / 0.18);

  const wallTension = clamp01(
    pinch * 0.72 * dynamics.surfaceTension +
    smooth01((raw - 0.50) / 0.18) *
    (1 - smooth01((raw - 0.90) / 0.10)) *
    0.46 * dynamics.surfaceTension
  );

  const recoilWindow =
    smooth01((raw - 0.84) / 0.07) *
    (1 - smooth01((raw - 0.95) / 0.05));
  const recoil =
    Math.sin(clamp01((raw - 0.84) / 0.16) * Math.PI) *
    recoilWindow * 0.12 * dynamics.recoil;

  const flowBoost = clamp01(
    smooth01((raw - 0.24) / 0.18) *
    (1 - smooth01((raw - 0.88) / 0.12)) *
    dynamics.fluidReaction
  );

  return {
    styleP: 1 - smooth01((raw - 0.34) / 0.58),
    pairSep,
    merge,
    relax,
    compression: 0,
    seam: 0,
    stretch,
    pinch,
    recoil,
    flowBoost,
    fluidReactionStrength: clamp01(dynamics.fluidReaction / 1.8),
    nucleusMove,
    wallTension,
    raw,
  };
}
