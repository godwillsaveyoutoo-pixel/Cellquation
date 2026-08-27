import {TAU,clamp,mix,smootherstep,lerp2,sub2,add2,mul2,len2,norm2} from './math2d.js?v=synapse0.8.7';
import {stageProgress,exitRetractionFactor,timingValue} from './transport_choreography.js?v=synapse0.8.7';

const phaseFor=seed=>(seed*.731)%TAU;
function thirdSpecies(a,b){if(a===b)return a;const s=new Set([a,b]);return ['blue','green','violet'].find(x=>!s.has(x))||b;}

export class TransportGeometry{
  constructor({settings,fusionVisual,splitVisual,transitionSettings,leftFusion,rightFusion}){
    Object.assign(this,{settings,fusionVisual,splitVisual,transitionSettings,leftFusion,rightFusion});
  }

  syncEndpoints(){
    const {settings,leftFusion,rightFusion}=this;
    const a=settings.angle*Math.PI/180,d=settings.distance*.5,dx=Math.cos(a)*d,dy=Math.sin(a)*d;
    leftFusion.position=[-dx,-dy];rightFusion.position=[dx,dy];
    leftFusion.species=settings.speciesA;rightFusion.species=settings.speciesB;
  }

  baseFrame(){
    const {settings,fusionVisual,leftFusion,rightFusion}=this;
    const axis=norm2(sub2(rightFusion.position,leftFusion.position));
    const r=fusionVisual.radius+settings.gap;
    return {axis,sa:add2(leftFusion.position,mul2(axis,r)),sb:add2(rightFusion.position,mul2(axis,-r))};
  }

  endpointData(direction){
    const {axis,sa,sb}=this.baseFrame();
    if(direction===1)return {source:this.leftFusion,target:this.rightFusion,sourceAnchor:sa,targetAnchor:sb,travel:axis,sourceSide:'A',targetSide:'B'};
    return {source:this.rightFusion,target:this.leftFusion,sourceAnchor:sb,targetAnchor:sa,travel:mul2(axis,-1),sourceSide:'B',targetSide:'A'};
  }

  resultSpecies(direction){const d=this.endpointData(direction);return thirdSpecies(d.source.species,d.target.species);}

  recommendedRetractionForScale(scale){
    const smallR=this.fusionVisual.radius*scale;
    return Math.max(0,2*smallR+.0025+.0035-this.settings.gap);
  }

  effectiveExitRetraction(){
    // Deliberately do not hide-clamp this value. A smaller retraction is a valid
    // artistic choice because the emerging cell may still be partially cradled
    // by the mouth when Fusion→Split takes over.
    return Math.max(0,this.settings.exitRetraction);
  }

  finalTargetAnchor(direction){
    const d=this.endpointData(direction);
    return add2(d.target.position,mul2(d.travel,-(this.splitVisual.radius+this.settings.gap)));
  }

  retractedTargetAnchor(direction,amount){
    const d=this.endpointData(direction);
    return add2(d.targetAnchor,mul2(d.travel,-amount));
  }

  intakeHalfInPosition(direction){
    const d=this.endpointData(direction);
    return add2(d.sourceAnchor,mul2(d.travel,-this.fusionVisual.radius*.46));
  }

  compressionDeepPosition(direction){
    const d=this.endpointData(direction);
    return add2(d.sourceAnchor,mul2(d.travel,this.fusionVisual.radius*.82));
  }

  egressStartPosition(direction){
    const d=this.endpointData(direction);
    const startRadius=this.fusionVisual.radius*this.settings.transportScale;
    // Transit ends and egress begins with the same 6% anticipatory mouth
    // retraction. The first candidate sits just behind the lip.
    const initialMouth=this.retractedTargetAnchor(direction,this.effectiveExitRetraction()*.06);
    let start=add2(initialMouth,mul2(d.travel,-startRadius*.78));

    // Guard monotonicity against the Fusion handoff. With some gap/retraction
    // combinations the lip-based point can lie *past* the canonical fusion
    // start, which would make the emerging cell move outward and then back.
    // Clamp the hidden start to remain a small distance before that handoff.
    const fusionRadius=this.fusionVisual.radius*this.settings.egressScale;
    const fusionStart=add2(d.target.position,mul2(d.travel,-(this.fusionVisual.radius+fusionRadius+.0025)));
    const delta=sub2(start,fusionStart);
    const along=delta[0]*d.travel[0]+delta[1]*d.travel[1];
    const margin=Math.max(.004,startRadius*.12);
    if(along>-margin)start=add2(fusionStart,mul2(d.travel,-margin));
    return start;
  }

  transitSourcePosition(direction,p){
    const d=this.endpointData(direction);
    const start=this.compressionDeepPosition(direction);
    const end=this.egressStartPosition(direction);
    const u=smootherstep(0,1,clamp(p));
    const linear=lerp2(start,end,u);
    // Follow the same gentle bend as the synapse, but force the exact boundary
    // positions at both ends.  This is the latent cell path; the visible bulge
    // is derived from this position rather than owning an independent path.
    const n=[-d.travel[1],d.travel[0]];
    const bend=this.settings.curve*Math.sin(Math.PI*u);
    return add2(linear,mul2(n,bend));
  }

  /* During late fusion the mouth already starts returning toward its final
     Split-safe location. Recovery only performs the last small settle. */
  synapseEndpoints(action){
    const {sa,sb}=this.baseFrame(),dir=action.direction;
    if(action.stage==='done'){
      const end=this.finalTargetAnchor(dir);
      return dir===1?[sa,end]:[end,sb];
    }
    if(action.stage==='transit'||action.stage==='egress'){
      const amount=this.effectiveExitRetraction()*exitRetractionFactor(action,this.settings);
      const end=this.retractedTargetAnchor(dir,amount);
      return dir===1?[sa,end]:[end,sb];
    }
    if(action.stage==='fusion'){
      const p=stageProgress(action,this.settings),amount=this.effectiveExitRetraction();
      const from=this.retractedTargetAnchor(dir,amount),to=this.finalTargetAnchor(dir);
      // Restoration is part of fusion and its start is user-tunable. The end
      // remains constrained near the end of fusion so the handoff stays smooth.
      const returnStart=timingValue(action,this.settings,'synapseReturnStart');
      const returnEnd=Math.min(.98,Math.max(.90,returnStart+.34));
      const settle=.96*smootherstep(returnStart,returnEnd,p);
      const end=lerp2(from,to,settle);
      return dir===1?[sa,end]:[end,sb];
    }
    if(action.stage==='recovery'){
      const p=stageProgress(action,this.settings),amount=this.effectiveExitRetraction();
      const from=this.retractedTargetAnchor(dir,amount),to=this.finalTargetAnchor(dir);
      const fusionSettled=lerp2(from,to,.96);
      const end=lerp2(fusionSettled,to,smootherstep(0,1,p));
      return dir===1?[sa,end]:[end,sb];
    }
    return [sa,sb];
  }

  receivingMouth(action){const ends=this.synapseEndpoints(action);return action.direction===1?ends[1]:ends[0];}

  egressSourcePosition(direction,p,action){
    const start=this.egressStartPosition(direction);
    const end=this.fusionStartGeometry(direction,action).sourceStart;
    const visibleStart=timingValue(action,this.settings,'egressVisibleStart');
    const takeover=timingValue(action,this.settings,'fusionTakeover');
    const motionStart=Math.max(0,visibleStart-.035);
    return lerp2(start,end,smootherstep(motionStart,takeover,p));
  }

  fusionStartGeometry(direction,action){
    const d=this.endpointData(direction),scale=this.settings.egressScale;
    const r=this.fusionVisual.radius*scale;
    const sourceStart=add2(d.target.position,mul2(d.travel,-(this.fusionVisual.radius+r+.0025)));
    const mouth=this.receivingMouth(action);
    return {...d,sourceStart,sourceRadius:r,scale,mouth,mouthClearance:len2(sub2(sourceStart,mouth))-r};
  }

  fusionSourceScale(p,action=null){return mix(this.settings.egressScale,1,smootherstep(.10,timingValue(action,this.settings,'fusionGrowEnd'),p));}

  fusionPair(direction,p,action){
    const g=this.fusionStartGeometry(direction,action),center=g.target.position,angle=Math.atan2(g.travel[1],g.travel[0]);
    const coupled=add2(center,mul2(g.travel,-this.fusionVisual.radius*.34));
    const sourceWorld=lerp2(g.sourceStart,coupled,smootherstep(.05,.72,p));
    const targetWorld=[...center];
    return {a:this.localOffset(sourceWorld,center,angle),b:this.localOffset(targetWorld,center,angle),sourceWorld,targetWorld,sep:len2(sub2(targetWorld,sourceWorld))};
  }

  localOffset(world,center,angle){
    const dx=world[0]-center[0],dy=world[1]-center[1],c=Math.cos(angle),s=Math.sin(angle);
    return [c*dx+s*dy,-s*dx+c*dy];
  }

  transitionDescriptor(direction){
    const d=this.endpointData(direction),angle=Math.atan2(d.travel[1],d.travel[0]);
    return {
      center:[...d.target.position],angle,
      finalInstancePhase:phaseFor((d.source.visualSeed+d.target.visualSeed)*.5),
      sourceShapePhaseA:1.1+phaseFor(d.source.visualSeed),sourceShapePhaseB:1.1+phaseFor(d.target.visualSeed),
      nucleusPhaseA:.4+phaseFor(d.source.nuclei[0]?.visualSeed??d.source.visualSeed),
      nucleusPhaseB:.4+phaseFor(d.target.nuclei[0]?.visualSeed??d.target.visualSeed),
      sourceFluidPhaseA:phaseFor(d.source.visualSeed),sourceFluidPhaseB:phaseFor(d.target.visualSeed),
      sourceRotationA:d.source.rotation||0,sourceRotationB:d.target.rotation||0,
    };
  }

  mechanicsForFusion(p,customSep){
    const ts=this.transitionSettings;
    p=clamp(p);
    const compression=(smootherstep(.01,.24,p)*(1-smootherstep(.40,.60,p)))*(ts.contactResistance??.8);
    const merge=smootherstep(.20,.76,p),relax=smootherstep(.43,1,p);
    const seam=smootherstep(.20,.42,p)*(1-smootherstep(.66,.92,p))*(ts.adhesion??.63);
    const stretch=smootherstep(.38,.72,p)*(1-smootherstep(.88,1,p))*(ts.surfaceTension??.71);
    const recoil=smootherstep(.78,1,p)*(ts.recoil??.8)*.34;
    const flowBoost=Math.sin(Math.PI*p)*(ts.fluidReaction??.81);
    return {styleP:p,pairSep:customSep*.5,merge,relax,compression,seam,stretch,pinch:0,recoil,flowBoost,fluidReactionStrength:ts.fluidReaction??.81,nucleusMove:smootherstep(.43,.78,p),wallTension:Math.sin(Math.PI*p)*(ts.surfaceTension??.71)};
  }
}
