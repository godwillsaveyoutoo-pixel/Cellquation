import {TRANSPORT_DEFAULTS,sanitizeTransportSettings} from './transport_choreography.js?v=synapse0.8.7';

/* Canonical synapse appearance chosen in the v0.6.6 settings export.
   Keep visual baseline separate from transport choreography. */
export const SYNAPSE_VISUAL_BASELINE=Object.freeze({
  distance:.725,angle:157,gap:.01,curve:0,
  waist:.03,endWidth:.126,shoulderWidth:.58,mouthWidth:.88,mouthAngle:.06,mouthBowl:.74,mouthWrap:1,mouthFlatness:0,
  opacity:1,glow:.93,relief:.55,living:.84,breatheStrength:.42,breatheSpeed:.46,edgeLife:.56,mouthFlex:.48,
  innerShadowThickness:0,innerShadowDarkness:0,membraneTint:2.2,rimTint:.4,flowTint:2.8,flowSpeed:.78,flowStrength:.48,
  speciesA:'blue',speciesB:'green',
});

export const TIMING_PRESETS=Object.freeze({
  organic:Object.freeze({
    globalSpeed:.86,
    intakeDuration:.86,compressionDuration:.60,transitDuration:1.00,egressDuration:.72,fusionDuration:1.65,recoveryDuration:.26,
    shrinkStart:.24,egressVisibleStart:.02,fusionTakeover:.82,fusionGrowEnd:.60,synapseReturnStart:.22,
  }),
  balanced:Object.freeze({
    globalSpeed:1.00,
    intakeDuration:.78,compressionDuration:.52,transitDuration:.88,egressDuration:.64,fusionDuration:1.50,recoveryDuration:.22,
    shrinkStart:.18,egressVisibleStart:.03,fusionTakeover:.80,fusionGrowEnd:.56,synapseReturnStart:.26,
  }),
  fast:Object.freeze({
    globalSpeed:1.20,
    intakeDuration:.72,compressionDuration:.46,transitDuration:.76,egressDuration:.58,fusionDuration:1.50,recoveryDuration:.16,
    shrinkStart:.14,egressVisibleStart:.01,fusionTakeover:.76,fusionGrowEnd:.52,synapseReturnStart:.22,
  }),
});

export function createSettings(transitionSettings={}){
  const settings={
    ...SYNAPSE_VISUAL_BASELINE,
    ...TRANSPORT_DEFAULTS,
    fusionDuration:Math.max(1.5,transitionSettings.fusionDuration||1.5),
    inspectorFps:60,
    paused:false,
  };
  return sanitizeTransportSettings(settings);
}
