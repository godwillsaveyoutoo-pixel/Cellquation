const vertexSource = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const backgroundFragmentSource = `
#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform sampler2D u_background;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform float u_opacity;
void main(){
  vec2 uv=gl_FragCoord.xy/max(u_resolution,vec2(1.0));
  uv=uv*u_uvScale+u_uvOffset;
  vec3 tex=texture2D(u_background,uv).rgb;
  vec3 abyss=vec3(0.0,0.020,0.031);
  gl_FragColor=vec4(mix(abyss,tex,clamp(u_opacity,0.0,1.0)),1.0);
}
`;
const fragmentSource = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_viewScale;
uniform float u_time;
uniform vec2 u_worldCenter;
uniform float u_interactionAngle;
uniform float u_instancePhase;
uniform float u_selectedSingle;
uniform float u_nucleusCount;
uniform float u_globalOpacity;
uniform float u_outerHaloStrength;
uniform float u_renderDetail; // 1=full material; low-end tiers simplify internals, never silhouette
uniform float u_sourceRotationA;
uniform float u_sourceRotationB;
uniform float u_sourceShapePhaseA;
uniform float u_sourceShapePhaseB;
uniform float u_nucleusPhaseA;
uniform float u_nucleusPhaseB;
uniform float u_fluidPhaseA;
uniform float u_fluidPhaseB;
uniform float u_fusionProgress;
uniform float u_transitionMode; // 0 idle, 1 fusion, 2 fission
uniform float u_merge;
uniform float u_relax;
uniform float u_pairSeparation;
uniform float u_customPair;
uniform vec2 u_pairOffsetA;
uniform vec2 u_pairOffsetB;
uniform float u_customNucleusTargets;
uniform vec2 u_nucleusTargetA;
uniform vec2 u_nucleusTargetB;
uniform float u_sourceNucleusRadiusA;
uniform float u_sourceNucleusRadiusB;
uniform float u_targetNucleusRadiusA;
uniform float u_targetNucleusRadiusB;
uniform float u_contactCompression;
uniform float u_contactSeam;
uniform float u_stretch;
uniform float u_pinch;
uniform float u_recoil;
uniform float u_flowBoost;
uniform float u_fluidReactionStrength;
uniform float u_nucleusMove;
uniform float u_wallTension;
uniform float u_selectA;
uniform float u_selectB;

uniform vec2 u_startPosA;
uniform vec2 u_startPosB;

uniform float u_sourceRadius;
uniform float u_targetRadius;
uniform float u_sourceNucleusRadius;
uniform float u_targetNucleusRadius;
uniform float u_nucleusSeparation;

uniform float u_activity;
uniform float u_membraneAmp1;
uniform float u_membraneAmp2;
uniform float u_membraneAmp3;
uniform float u_membraneLiving;
uniform float u_membraneThickness;
uniform float u_membraneGlints;

uniform float u_volumeDepth;
uniform float u_densityContrast;
uniform float u_fluidWarp;
uniform float u_fluidSpeed;
uniform float u_liquidLights;
uniform float u_fineDetail;

uniform float u_nucleusGlow;
uniform float u_nucleusPlasma;
uniform float u_nucleusSheen;

uniform float u_distortionStrength;
uniform float u_glowStrength;
uniform float u_exposure;
uniform float u_grainStrength;

uniform vec3 u_colorDeep;
uniform vec3 u_colorMid;
uniform vec3 u_colorBright;
uniform vec3 u_colorGlow;
uniform float u_heteroFusion;
uniform vec3 u_sourceColorADeep;
uniform vec3 u_sourceColorAMid;
uniform vec3 u_sourceColorABright;
uniform vec3 u_sourceColorAGlow;
uniform vec3 u_sourceColorBDeep;
uniform vec3 u_sourceColorBMid;
uniform vec3 u_sourceColorBBright;
uniform vec3 u_sourceColorBGlow;
uniform vec3 u_nucleusColorDeep;
uniform vec3 u_nucleusColorMid;
uniform vec3 u_nucleusColorBright;
uniform vec3 u_nucleusColorGlow;
uniform float u_nucleusPulse;
uniform float u_idleEnabled;
uniform float u_idleCellPulseAmplitude;
uniform float u_idleCellPulseSpeed;
uniform float u_idleRimDriftStrength;
uniform float u_idleRimDriftSpeed;
uniform float u_idleNucleusDriftAmplitude;
uniform float u_idleNucleusDriftSpeed;
uniform float u_idleNucleusPulseAmplitude;
uniform float u_idleNucleusPulseSpeed;
uniform float u_idleMaster;
uniform float u_idleMembraneWobble;
uniform float u_idlePhaseVariation;
uniform float u_materialEnabled;
uniform float u_materialMaster;
uniform float u_bodyTransmission;
uniform float u_innerDarkness;
uniform float u_rimBrightness;
uniform float u_rimSoftness;
uniform float u_innerRimStrength;
uniform float u_innerGlowStrength;
uniform float u_highlightStrength;
uniform float u_gelDepth;
uniform float u_nucleusHaloStrength;
uniform float u_nucleusOpacity;
uniform float u_nucleusContrast;
uniform float u_nucleusDepth;

/* Wisselcel lives entirely in this main shader: eclipse/corona, no overlay pass. */
uniform float u_swapRingEnabled;
uniform float u_swapAction;
uniform float u_swapProgress;
uniform float u_swapRingRadius;
uniform float u_swapRingWidth;
uniform float u_swapRingGlow;
uniform float u_swapPulseSpeed;
uniform vec3 u_swapTargetBright;
uniform vec3 u_swapTargetGlow;
uniform float u_mimicEnabled;
uniform float u_mimicCount;
uniform float u_mimicOrbitRadius;
uniform float u_mimicSize;
uniform float u_mimicGlow;
uniform float u_mimicPulseSpeed;
uniform float u_mimicPrismShift;

#define TAU 6.28318530718

float sat(float x){ return clamp(x,0.0,1.0); }
float ease(float x){ x=sat(x); return x*x*(3.0-2.0*x); }
float band(float v,float c,float hw,float s){
  return 1.0-smoothstep(hw,hw+s,abs(v-c));
}
/* GLSL matrices are column-major.  This constructor is the standard
   counter-clockwise +a rotation for matrix * vector.  The previous build
   accidentally used its transpose, so every pair-local fusion frame was
   mirrored around the world X axis at takeover. */
mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,s,-s,c); }

float hash21(vec2 p){
  p=fract(p*vec2(123.34,456.21));
  p+=dot(p,p+45.32);
  return fract(p.x*p.y);
}
float noise2(vec2 p){
  vec2 i=floor(p),f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  float a=hash21(i);
  float b=hash21(i+vec2(1.0,0.0));
  float c=hash21(i+vec2(0.0,1.0));
  float d=hash21(i+vec2(1.0,1.0));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float evolvingNoise(vec2 p,float t){
  vec2 aP=rot2(0.23+0.07*sin(t*0.13))*p+vec2(0.11*t,-0.06*t);
  vec2 bP=rot2(-0.51+0.06*cos(t*0.11))*p*1.041+vec2(-0.08*t+6.2,0.09*t-4.7);
  float a=noise2(aP), b=noise2(bP);
  float w=0.5+0.5*sin(t*0.63+sin(dot(p,vec2(0.31,-0.27)))*1.15);
  return mix(a,b,w);
}
float softFbm(vec2 p,float t){
  float v=0.0,a=0.53;
  mat2 r=mat2(0.82,0.57,-0.57,0.82);
  for(int i=0;i<4;i++){
    v+=evolvingNoise(p,t)*a;
    p=r*p*2.02+vec2(0.41,-0.33);
    t*=1.21;
    a*=0.49;
  }
  return sat(v/1.02);
}
vec2 livingFlow(vec2 p){
  float life=sat(u_activity/1.6);
  float t=u_time*u_fluidSpeed*mix(0.0,0.72,life)*(1.0+0.40*u_flowBoost);
  vec2 drift=vec2(t*0.14,-t*0.09);
  float a=evolvingNoise(p*1.52+vec2(2.1,-1.8)+drift,t*0.73);
  float b=evolvingNoise(rot2(1.13)*p*1.47+vec2(-3.6,4.4)-drift*0.7,t*0.81+5.3);
  vec2 f=vec2(a-0.5,b-0.5);
  f+=vec2(-(b-0.5),a-0.5)*0.24;
  return p+f*u_fluidWarp*0.86;
}

float sminPoly(float a,float b,float k){
  float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0);
  return mix(b,a,h)-k*h*(1.0-h);
}

float shapeActivity(float angle,float phase){
  vec2 c=vec2(cos(angle),sin(angle));
  float membraneLife=sat(u_membraneLiving/1.8);
  float membraneT=u_time*0.42*membraneLife;
  float n=evolvingNoise(c*1.74+vec2(2.7+phase,-1.4-phase*0.3),membraneT+phase);
  return mix(0.52,1.0,smoothstep(0.20,0.85,n));
}

float cellSDFLocal(vec2 p,float radius,float phase){
  float angle=atan(p.y,p.x);
  float idle=u_idleEnabled*u_idleMaster;
  float r=length(p);

  /* v0.12.3.4 ORGANIC MEMBRANE MOTION REPAIR
     Membraanactiviteit no longer multiplies displacement amplitude. That old
     behaviour made high activity look spikier rather than more alive.

     Instead, activity controls how quickly LOCAL SHAPE WEIGHTS evolve. The
     contour morphs in place through standing harmonics + evolving circular
     noise. There is deliberately no angle-minus-time travelling phase here, so
     the membrane does not read as a sinusoid simply rotating around the cell.
     The amplitude budget remains owned by membraneAmp1/2/3. */
  float activity=sat(u_membraneLiving/1.8);
  float motionRate=mix(0.0,3.10,activity);
  float t=u_time*motionRate;
  vec2 c=vec2(cos(angle),sin(angle));
  float local=shapeActivity(angle,phase);

  float identityWobble=1.0+u_idleMembraneWobble*idle;

  /* Stable standing-wave bases. Their phases do not march around the rim. */
  float broadBase=sin(angle*3.0+0.20+phase);
  float midBase=sin(angle*5.0+1.60+phase*0.70);
  float fineBase=sin(angle*8.0+4.00-phase*0.40);

  /* Alternative local shapes use neighbouring integer harmonics. Slowly
     changing blend weights make bulges appear, soften and re-form elsewhere
     without increasing their maximum intended displacement. */
  float broadAlt=0.62*sin(angle*2.0-0.70+phase*0.41)+0.38*sin(angle*4.0+1.10-phase*0.23);
  float midAlt=0.55*sin(angle*4.0+0.35+phase*0.52)+0.45*sin(angle*6.0-1.25+phase*0.31);
  float fineAlt=0.52*sin(angle*7.0+0.90-phase*0.22)+0.48*sin(angle*9.0-0.55+phase*0.19);

  float morphA=0.5+0.5*sin(t*0.39+phase*1.31);
  float morphB=0.5+0.5*sin(t*0.53+2.17+phase*0.73);
  float morphC=0.5+0.5*sin(t*0.67+4.03-phase*0.49);
  float morphStrength=activity;

  float broadShape=mix(broadBase,broadAlt,morphA*morphStrength);
  float midShape=mix(midBase,midAlt,morphB*morphStrength);
  float fineShape=mix(fineBase,fineAlt,morphC*morphStrength);

  float broad=broadShape*u_membraneAmp1*identityWobble;
  float mid=midShape*u_membraneAmp2;
  float fine=fineShape*u_membraneAmp3;

  /* Seam-safe local packets add life only by redistributing the same contour
     budget. They do not get multiplied by activity as extra height. */
  float packetNoiseA=evolvingNoise(c*1.08+vec2(3.4,-2.1),t*0.082+phase*0.61);
  float packetNoiseB=evolvingNoise(rot2(0.93)*c*1.31+vec2(-2.8,4.1),t*0.071+phase*0.83+4.7);
  float packetA=smoothstep(0.24,0.82,packetNoiseA);
  float packetB=smoothstep(0.22,0.84,packetNoiseB);
  float packetBalance=(packetA-packetB)*0.5;
  // Activity redistributes the existing contour instead of adding extra height.
  // This keeps high activity alive without producing taller spikes.
  float localRedistribution=1.0+packetBalance*0.18*activity;

  /* Rim drift is now a tiny irregular phase influence rather than physical
     rotation of the silhouette. This preserves a living edge without making
     the whole contour look as if it spins around the nucleus. */
  float driftPhase=u_time*u_idleRimDriftSpeed*u_idleRimDriftStrength*idle;
  float driftNoise=evolvingNoise(c*1.34+vec2(0.8+phase,-2.6),t*0.040+phase+driftPhase*0.17)-0.5;
  float drift=driftNoise*0.008;

  float life=sat(u_activity/1.6);
  float breathe=sin(u_time*mix(0.08,0.72,life)+phase)*0.0012*life;
  breathe += sin(u_time*u_idleCellPulseSpeed+phase*0.73)*radius*u_idleCellPulseAmplitude*idle;

  float contour=(broad+mid+fine)*mix(0.72,1.08,local)*localRedistribution;
  float rr=radius+contour+drift+breathe;
  return r-rr;
}

/* Contact deformation. This does not create any new object:
   it compresses the existing membrane at the contact side and lets the
   remaining perimeter bulge slightly, giving a sense of viscous resistance. */
float daughterSDF(vec2 p,float radius,float phase,float facingSign,float sourceRotation){
  /* p is in the fusion-pair frame. Reconstruct the exact local frame in
     which this real cell was rendered immediately before takeover. */
  /* Preserve each source cell's material orientation for as long as the
     source daughters exist. The final body takes over through u_relax, so
     there is no arbitrary rotation toward the interaction axis. */
  float localDelta=(u_interactionAngle-sourceRotation);
  vec2 shapeP=rot2(localDelta)*p;

  float d=cellSDFLocal(shapeP,radius,phase);
  float len=max(length(p),0.0001);
  vec2 dir=p/len;

  float facing=pow(sat(dir.x*facingSign),5.5);
  float nearFace=smoothstep(radius*0.30,radius*0.90,len);
  float lateral=pow(abs(dir.y),1.7);
  float back=pow(sat(-dir.x*facingSign),3.0);

  float press=u_contactCompression;
  d += facing*nearFace*press*0.0125;
  d -= (0.58*lateral+0.22*back)*press*0.0044;

  /* small elastic ripple leaving the contact zone */
  float a=atan(p.y,p.x);
  /* integer angular harmonic: explicitly seam-safe at +/-PI */
  float wave=sin(a*4.0-u_time*2.1+phase)*exp(-4.0*abs(dir.x*facingSign-0.25));
  d -= wave*press*0.0014;
  return d;
}

vec2 sourcePosA(){
  vec2 symmetric=vec2(-u_pairSeparation,0.0);
  return mix(symmetric,u_pairOffsetA,u_customPair);
}
vec2 sourcePosB(){
  vec2 symmetric=vec2( u_pairSeparation,0.0);
  return mix(symmetric,u_pairOffsetB,u_customPair);
}

/* Lighting must live in WORLD space, not in whichever local frame happens
   to own the current render pass. Otherwise the exact same membrane can look
   as if it rotated on the frame where two individual draw calls become one
   transition draw call. */
vec2 shadingWorldRel(vec2 p){
  /* v0.7.6.2: idle cells are already fully relaxed. Avoid reconstructing the
     two-source pair frame when the exact result is simply p. */
  if(u_transitionMode<0.5) return p;
  vec2 pa=sourcePosA();
  vec2 pb=sourcePosB();
  float balance=length(p-pa)-length(p-pb);
  float side=smoothstep(-0.025,0.025,balance);
  vec2 sourceRel=mix(p-pa,p-pb,side);
  float finalMix=smoothstep(0.30,0.96,u_relax);
  vec2 rel=mix(sourceRel,p,finalMix);
  return rot2(u_interactionAngle)*rel;
}
vec3 normalToWorld(vec3 nLocal){
  vec2 xy=rot2(u_interactionAngle)*nLocal.xy;
  return normalize(vec3(xy,nLocal.z));
}

float sceneSDF(vec2 p){
  /* v0.7.6.2 DEEP GPU: the old idle path still evaluated two daughter SDFs,
     their smooth union and the final SDF, then mix(...,1.0) discarded the
     daughter work. An idle cell is mathematically exactly the final body. */
  if(u_transitionMode<0.5){
    return cellSDFLocal(p,u_targetRadius,1.1+u_instancePhase);
  }
  vec2 pa=sourcePosA();
  vec2 pb=sourcePosB();

  float dA=daughterSDF(p-pa,u_sourceRadius,u_sourceShapePhaseA, 1.0,u_sourceRotationA);
  float dB=daughterSDF(p-pb,u_sourceRadius,u_sourceShapePhaseB,-1.0,u_sourceRotationB);

  /* Before adhesion, two walls may press against each other but no
     artificial connector exists. Smooth union only develops after the
     membrane has visibly resisted/compressed. */
  float k=mix(0.0012,0.040,u_merge);
  float twoCells=min(dA,dB);
  float merged=sminPoly(dA,dB,k);
  float dUnion=mix(twoCells,merged,u_merge);

  /* Surface-tension relaxation of the final Split Cell. */
  vec2 q=p;
  float stretchAmount=0.105*u_stretch + 0.028*u_recoil;
  q.x*=1.0-stretchAmount;
  q.y*=1.0+0.035*u_stretch-0.016*u_recoil;

  /* During fission, the existing mass narrows around the equator before
     separation. This is a pinch deformation, not a new neck object. */
  float waist=exp(-pow(abs(q.x)/(u_targetRadius*0.42+0.0001),2.0));
  q.y*=1.0+0.34*u_pinch*waist;

  float dFinal=cellSDFLocal(q,u_targetRadius,1.1+u_instancePhase);

  return mix(dUnion,dFinal,u_relax);
}

float sphereDepthLocal(vec2 p,float radius){
  float rho=sat(length(p)/max(radius,0.0001));
  return sqrt(max(0.0,1.0-rho*rho));
}
float sceneDepth(vec2 p){
  if(u_transitionMode<0.5) return sphereDepthLocal(p,u_targetRadius);
  vec2 pa=sourcePosA(),pb=sourcePosB();
  float source=max(sphereDepthLocal(p-pa,u_sourceRadius),sphereDepthLocal(p-pb,u_sourceRadius));
  float finalD=sphereDepthLocal(p,u_targetRadius);

  /* Optical depth used to create a very visible global flash/pulse while the
     silhouette changed. That is geometry, not fluid reaction. Keep the base
     depth change restrained; only Fluid Reaction is allowed to accent it. */
  float baseBlend=smoothstep(0.18,0.98,u_relax);
  float conservative=mix(source,finalD,baseBlend);
  float reactive=mix(source,finalD,u_relax);
  return mix(conservative,reactive,u_fluidReactionStrength*0.35);
}

vec3 calcSceneNormal(vec2 p,float d){
  /* v0.7.6.2: reuse the SDF already computed by shadeScene and take two
     forward samples instead of four central samples + one duplicate centre
     sample. At this small epsilon the lighting difference is sub-pixel while
     membrane geometry work drops dramatically. */
  float e=0.0013;
  float dx=sceneSDF(p+vec2(e,0.0))-d;
  float dy=sceneSDF(p+vec2(0.0,e))-d;
  vec2 g=normalize(vec2(dx,dy)+vec2(0.00001));
  float edge=1.0-sat((-d)/(mix(u_sourceRadius,u_targetRadius,u_relax)*0.72));
  edge=smoothstep(0.0,1.0,edge);
  float z=sqrt(max(0.02,1.0-edge*edge));
  return normalize(vec3(g*edge,z));
}

float liquidFlecks(vec2 p,float t){
  vec2 q=livingFlow(p*1.05);
  float a=softFbm(q*7.2+vec2(2.4,-1.7),t*0.63+2.0);
  float b=softFbm(rot2(0.71)*q*7.7+vec2(-5.2,3.1),t*0.57+6.0);
  float ridge=1.0-abs(a-b)*4.5;
  ridge=pow(sat(ridge),4.2);
  float breakup=pow(sat(softFbm(q*3.4+vec2(1.2,4.6),t*0.37+9.0)),2.4);
  return ridge*breakup;
}

float heteroSideWeight(vec2 p){
  vec2 pa=sourcePosA(), pb=sourcePosB();
  float da=length(p-pa), db=length(p-pb);
  return smoothstep(-0.045,0.045,da-db);
}
float heteroTargetMix(){
  return u_heteroFusion*ease((u_merge-0.10)/0.82);
}
vec3 bodyDeepAt(vec2 p){
  if(u_heteroFusion<0.5) return u_colorDeep;
  float w=heteroSideWeight(p), tm=heteroTargetMix();
  vec3 src=mix(u_sourceColorADeep,u_sourceColorBDeep,w);
  return mix(u_colorDeep,mix(src,u_colorDeep,tm),u_heteroFusion);
}
vec3 bodyMidAt(vec2 p){
  if(u_heteroFusion<0.5) return u_colorMid;
  float w=heteroSideWeight(p), tm=heteroTargetMix();
  vec3 src=mix(u_sourceColorAMid,u_sourceColorBMid,w);
  return mix(u_colorMid,mix(src,u_colorMid,tm),u_heteroFusion);
}
vec3 bodyBrightAt(vec2 p){
  if(u_heteroFusion<0.5) return u_colorBright;
  float w=heteroSideWeight(p), tm=heteroTargetMix();
  vec3 src=mix(u_sourceColorABright,u_sourceColorBBright,w);
  return mix(u_colorBright,mix(src,u_colorBright,tm),u_heteroFusion);
}
vec3 bodyGlowAt(vec2 p){
  if(u_heteroFusion<0.5) return u_colorGlow;
  float w=heteroSideWeight(p), tm=heteroTargetMix();
  vec3 src=mix(u_sourceColorAGlow,u_sourceColorBGlow,w);
  return mix(u_colorGlow,mix(src,u_colorGlow,tm),u_heteroFusion);
}
vec3 nucleusDeepAt(float idx){
  if(u_heteroFusion<0.5) return u_nucleusColorDeep;
  vec3 src=mix(u_sourceColorADeep,u_sourceColorBDeep,idx);
  return mix(u_nucleusColorDeep,mix(src,u_nucleusColorDeep,u_heteroFusion*ease(u_nucleusMove)),u_heteroFusion);
}
vec3 nucleusMidAt(float idx){
  if(u_heteroFusion<0.5) return u_nucleusColorMid;
  vec3 src=mix(u_sourceColorAMid,u_sourceColorBMid,idx);
  return mix(u_nucleusColorMid,mix(src,u_nucleusColorMid,u_heteroFusion*ease(u_nucleusMove)),u_heteroFusion);
}
vec3 nucleusBrightAt(float idx){
  if(u_heteroFusion<0.5) return u_nucleusColorBright;
  vec3 src=mix(u_sourceColorABright,u_sourceColorBBright,idx);
  return mix(u_nucleusColorBright,mix(src,u_nucleusColorBright,u_heteroFusion*ease(u_nucleusMove)),u_heteroFusion);
}
vec3 nucleusGlowAt(float idx){
  if(u_heteroFusion<0.5) return u_nucleusColorGlow;
  vec3 src=mix(u_sourceColorAGlow,u_sourceColorBGlow,idx);
  return mix(u_nucleusColorGlow,mix(src,u_nucleusColorGlow,u_heteroFusion*ease(u_nucleusMove)),u_heteroFusion);
}

vec3 sampleFluid(vec2 p,float z){
  float detailBudget=clamp(u_renderDetail,0.0,1.0);
  float life=sat(u_activity/1.6);
  float t=u_time*u_fluidSpeed*mix(0.0,0.68,life)*(1.0+0.36*u_flowBoost);
  vec2 pa=sourcePosA();
  vec2 pb=sourcePosB();
  float distBalance=length(p-pa)-length(p-pb);
  float side=smoothstep(-0.025,0.025,distBalance);

  /* Same continuity rule as the membrane: keep source-local material
     coordinates stable; blend into the final material field via finalMix. */
  vec2 localA=rot2(u_interactionAngle-u_sourceRotationA)*(p-pa);
  vec2 localB=rot2(u_interactionAngle-u_sourceRotationB)*(p-pb);
  vec2 sourceLocal=mix(localA,localB,side);

  float sourceFluidPhase=mix(u_fluidPhaseA,u_fluidPhaseB,side);
  float finalMix=smoothstep(0.30,0.96,u_relax);
  float fluidPhase=mix(sourceFluidPhase,u_instancePhase,finalMix);

  vec2 materialP=mix(sourceLocal,p,finalMix);
  float materialRadius=mix(u_sourceRadius,u_targetRadius,finalMix);
  vec2 np=materialP/max(materialRadius,0.16)
        +vec2(fluidPhase*0.071,-fluidPhase*0.049);
  vec2 drift1=vec2(t*0.17,-t*0.11);
  vec2 drift2=vec2(-t*0.10,t*0.14);

  vec2 q=livingFlow(np*(0.92+0.08*u_flowBoost)+drift1*(1.0+0.55*u_flowBoost));
  vec2 q2=livingFlow(rot2(0.56)*np*(1.43+0.10*u_flowBoost)+vec2(2.7,-3.8)+drift2*(1.0+0.45*u_flowBoost));

  /* v0.7.6.4: membrane geometry stays identical at every tier. Only the
     expensive INTERNAL micro-fluid field scales down on proven weak phones.
     Full quality executes the exact authored recipe. */
  float macro;
  float medium;
  float detail;
  float lowGel=0.5;
  float lowSheen=0.5;
  if(detailBudget>0.70){
    /* Full/Balanced stay on the authored CellKit material. */
    macro=softFbm(q*1.72+vec2(-1.2,2.1),t*0.72+2.4);
    medium=softFbm(q2*3.25+vec2(3.9,-1.7),t*1.08+7.3);
    detail=softFbm(rot2(-0.41)*q*6.7+vec2(-5.1,4.6),t*1.55+11.6);
  }else{
    /* v0.7.6.4.4 SUBTLE LOW-END GEL
       Constrained/Critical deliberately stop trying to imitate full FBM with
       thresholded cheap noise. That created the visible blotches/filaments on
       old phones. Two smooth single-octave fields now move the gel very
       gently; there are no masks, ridges, spots or hard thresholds. */
    float tierLife=smoothstep(0.30,0.62,detailBudget);
    float gelA=evolvingNoise(q*1.72+vec2(-1.2,2.1),t*0.42+2.4);
    float gelB=evolvingNoise(q2*2.46+vec2(3.9,-1.7),t*0.54+7.3);
    float waveA=sin(dot(q,vec2(1.18,-0.82))+t*0.24+fluidPhase*0.31);
    float waveB=sin(dot(q2,vec2(-0.74,1.06))-t*0.19-fluidPhase*0.23);
    float broadWave=0.5+0.25*(waveA+waveB);
    lowGel=0.5+(gelA-0.5)*0.52+(gelB-0.5)*0.34+(broadWave-0.5)*0.14;
    lowGel=mix(0.5,lowGel,mix(0.44,0.66,tierLife));
    lowSheen=0.5+0.5*sin(dot(q,vec2(1.44,0.58))-t*0.30+gelB*1.15);
    macro=lowGel;
    medium=mix(0.5,lowGel,0.72);
    detail=mix(0.5,lowSheen,mix(0.16,0.26,tierLife));
  }

  float density;
  if(detailBudget>0.70){
    density=sat((macro*0.50+medium*0.33+detail*0.17-0.5)*u_densityContrast+0.5);
  }else{
    /* Keep the interior near its base gel tone. Critical is intentionally
       calmer than Constrained; authored densityContrast may still tint the
       material character, but can no longer amplify it into dark islands. */
    float tierLife=smoothstep(0.30,0.62,detailBudget);
    float lowContrast=mix(0.12,0.20,tierLife);
    density=sat(0.5+(lowGel-0.5)*min(u_densityContrast,1.65)*lowContrast);
  }
  float thickness=z*u_volumeDepth;
  float opticalDensity=mix(0.76,1.28,density);
  float transmission=exp(-opticalDensity*thickness*0.92);

  vec3 fluid=bodyDeepAt(p)*(0.58+0.30*(1.0-transmission));
  fluid+=bodyMidAt(p)*(0.22+0.47*z)*mix(0.75,1.14,density);
  fluid+=bodyGlowAt(p)*z*z*0.050*u_volumeDepth;
  fluid*=mix(0.74,1.17,density);

  float current;
  if(detailBudget>0.70){
    current=smoothstep(0.42,0.80,medium)*(0.50+0.50*smoothstep(0.30,0.84,detail));
    fluid+=bodyBrightAt(p)*current*0.052*u_fineDetail;
  }else{
    /* Low-end sheen is continuous and low-amplitude. No smoothstep mask means
       no contour-like worms can suddenly appear inside the cell. */
    float tierLife=smoothstep(0.30,0.62,detailBudget);
    current=(lowSheen-0.5)*mix(0.030,0.050,tierLife)+0.5;
    fluid+=bodyBrightAt(p)*(current-0.5)*u_fineDetail*mix(0.045,0.070,tierLife);
    fluid+=bodyGlowAt(p)*max(lowGel-0.5,0.0)*u_liquidLights*mix(0.010,0.016,tierLife)*z;
  }

  float flecks=0.0;
  if(detailBudget>0.70){
    flecks=liquidFlecks(q,t);
    fluid+=bodyBrightAt(p)*flecks*0.075*u_liquidLights*(0.18+0.82*z);
    fluid+=bodyGlowAt(p)*flecks*0.028*u_liquidLights;
  }

  float fine=detailBudget>0.70
    ? pow(sat((detail-0.57)/0.43),3.0)
    : 0.0;
  fluid+=bodyBrightAt(p)*fine*0.020*u_fineDetail*smoothstep(0.08,0.94,z)*mix(0.38,1.0,detailBudget);

  /* v0.12.3.6: Algemene levendigheid must be visually meaningful without
     turning into contour spikes. It therefore modulates LOCAL INTERNAL
     shimmer/flow over time. At 0 the field is essentially still; at max the
     gel visibly evolves, but the cell silhouette amplitude is unchanged. */
  float lifeField=evolvingNoise(np*1.18+vec2(6.1,-4.7),t*0.52+fluidPhase*0.37)-0.5;
  float lifeDetailScale=detailBudget>0.70?1.0:mix(0.12,0.22,smoothstep(0.30,0.62,detailBudget));
  float lifePulse=lifeField*0.18*life*lifeDetailScale;
  fluid*=1.0+lifePulse;
  fluid+=bodyGlowAt(p)*max(lifeField,0.0)*0.030*life*z*lifeDetailScale;

  /* Event-driven brightness/contrast is strictly gated. At 0 this is exactly
     neutral: the normal idle texture simply keeps flowing. */
  float eventPulse=u_flowBoost*u_fluidReactionStrength;
  fluid*=1.0+eventPulse*0.055;
  fluid+=bodyGlowAt(p)*eventPulse*0.018*z;
  return fluid;
}

vec2 nucleusA(){
  vec2 pa=sourcePosA();
  float twoNuclei=step(1.5,u_nucleusCount);
  vec2 defaultTarget=vec2(-u_nucleusSeparation*0.5,0.010*twoNuclei);
  vec2 target=mix(defaultTarget,u_nucleusTargetA,u_customNucleusTargets);
  vec2 c=mix(pa,target,u_nucleusMove);
  c+=vec2(-0.0038*u_recoil,0.0012*sin(u_time*2.7))*u_wallTension;
  float idle=u_idleEnabled;
  float driftPhase=u_nucleusPhaseA*1.71+u_instancePhase*0.43;
  c+=vec2(sin(u_time*u_idleNucleusDriftSpeed+driftPhase),cos(u_time*u_idleNucleusDriftSpeed*0.83+driftPhase*1.23))*u_idleNucleusDriftAmplitude*idle;
  return c;
}
vec2 nucleusB(){
  vec2 pb=sourcePosB();
  float twoNuclei=step(1.5,u_nucleusCount);
  vec2 defaultTarget=vec2(u_nucleusSeparation*0.5,-0.008*twoNuclei);
  vec2 target=mix(defaultTarget,u_nucleusTargetB,u_customNucleusTargets);
  vec2 c=mix(pb,target,u_nucleusMove);
  c+=vec2(0.0038*u_recoil,-0.0012*sin(u_time*2.5))*u_wallTension;
  float idle=u_idleEnabled;
  float driftPhase=u_nucleusPhaseB*1.67+u_instancePhase*0.51+2.1;
  c+=vec2(sin(u_time*u_idleNucleusDriftSpeed*0.91+driftPhase),cos(u_time*u_idleNucleusDriftSpeed+driftPhase*1.17))*u_idleNucleusDriftAmplitude*idle;
  return c;
}

float nucleusRadiusA(){
  float sourceR=mix(u_sourceNucleusRadius,u_sourceNucleusRadiusA,u_customNucleusTargets);
  float targetR=mix(u_targetNucleusRadius,u_targetNucleusRadiusA,u_customNucleusTargets);
  float base=mix(sourceR,targetR,ease(u_nucleusMove));
  float pulse=1.0+sin(u_time*u_idleNucleusPulseSpeed+u_nucleusPhaseA*1.31)*u_idleNucleusPulseAmplitude*u_idleEnabled;
  return base*pulse;
}
float nucleusRadiusB(){
  float sourceR=mix(u_sourceNucleusRadius,u_sourceNucleusRadiusB,u_customNucleusTargets);
  float targetR=mix(u_targetNucleusRadius,u_targetNucleusRadiusB,u_customNucleusTargets);
  float base=mix(sourceR,targetR,ease(u_nucleusMove));
  float pulse=1.0+sin(u_time*u_idleNucleusPulseSpeed+u_nucleusPhaseB*1.29+1.2)*u_idleNucleusPulseAmplitude*u_idleEnabled;
  return base*pulse;
}
/* Nucleus continuity uses two coordinate frames on purpose.
   qPair is geometric: it follows the live pair/body frame, so world-space
   lighting never pops. qMaterial preserves the source cell's own material
   orientation at takeover and only relaxes toward the pair frame while the
   nucleus itself migrates. This makes raw=0 pixel-continuous with drawCell. */
vec2 nucleusMaterialVector(vec2 qPair,float sourceRotation){
  float sourceDelta=u_interactionAngle-sourceRotation;
  float orientationRelease=ease(u_nucleusMove);
  return rot2(sourceDelta*(1.0-orientationRelease))*qPair;
}
float nucleusSDFAt(vec2 p,vec2 center,float r,float phase,float sourceRotation){
  vec2 qPair=p-center;
  vec2 qMaterial=nucleusMaterialVector(qPair,sourceRotation);
  float a=atan(qMaterial.y,qMaterial.x);
  float deform=sin(a*3.0+u_time*0.19+phase)*0.0014
              +sin(a*5.0-u_time*0.13-phase)*0.0008;
  return length(qPair)-(r+deform);
}
vec3 shadeNucleus(vec2 p,vec2 center,float r,float phase,float sourceRotation,vec3 behind,float sourceIndex){
  vec2 qPair=(p-center)/max(r,0.001);
  vec2 qMaterial=nucleusMaterialVector(qPair,sourceRotation);
  float r2=dot(qPair,qPair);
  float z=sqrt(max(0.0,1.0-r2));
  vec3 Nlocal=normalize(vec3(qPair,z));
  vec3 N=normalToWorld(Nlocal);
  vec3 lightDir=normalize(vec3(-0.46,0.69,0.72));
  vec3 viewDir=vec3(0.0,0.0,1.0);
  vec3 H=normalize(lightDir+viewDir);

  float t=u_time*0.075;
  vec2 f=livingFlow(qMaterial*0.34+vec2(phase*3.1,-phase*2.4));
  float macro;
  float fine;
  if(u_renderDetail>0.50){
    macro=softFbm(f*3.6,t+phase);
    fine=softFbm(rot2(0.52)*f*7.2+vec2(-2.6,3.4),t*1.36+5.8+phase);
  }else{
    /* Low-end nucleus keeps its rim/halo/depth exactly; only internal plasma
       noise is simplified. */
    macro=evolvingNoise(f*3.6,t+phase);
    fine=evolvingNoise(rot2(0.52)*f*5.2+vec2(-2.6,3.4),t*1.22+5.8+phase);
  }
  float plasma=pow(sat((fine-0.50)/0.50),2.3);

  float hotPulse=0.5+0.5*sin(u_time*3.15+phase*2.7+macro*1.8);
  vec3 col=mix(nucleusDeepAt(sourceIndex)*0.68,nucleusMidAt(sourceIndex)*0.98,smoothstep(0.15,0.88,macro));
  col+=nucleusGlowAt(sourceIndex)*z*z*0.24*u_nucleusGlow*(1.0+u_nucleusPulse*0.16*hotPulse);
  col+=nucleusBrightAt(sourceIndex)*plasma*0.10*u_nucleusPlasma*(1.0+u_nucleusPulse*0.22*hotPulse);
  col=mix(col,behind,0.11);

  float fresnel=pow(1.0-z,2.10);
  float spec=pow(sat(dot(N,H)),14.0);
  float broad=pow(sat(dot(N,H)),4.4);
  col+=nucleusGlowAt(sourceIndex)*fresnel*(0.52+0.10*u_nucleusPulse*hotPulse);
  col+=vec3(0.86,0.98,1.0)*(spec*0.18+broad*0.055)*u_nucleusSheen;
  return col;
}

vec3 shadeScene(vec2 p){
  float pixel=max(0.00070,u_viewScale/min(u_resolution.x,u_resolution.y)*1.18);
  /* Cheap idle square-corner reject before any living membrane noise/SDF.
     The real silhouette + visible halo cannot reach these far corners of the
     scissor. Keep a deliberately generous contour budget for all presets. */
  if(u_transitionMode<0.5){
    float ampBudget=(abs(u_membraneAmp1)+abs(u_membraneAmp2)+abs(u_membraneAmp3))*(1.35+u_idleMembraneWobble*u_idleEnabled);
    ampBudget+=u_targetRadius*abs(u_idleCellPulseAmplitude)*u_idleEnabled+0.018;
    if(length(p)>u_targetRadius+ampBudget+0.092) return vec3(0.0);
  }
  float d=sceneSDF(p);
  float inside=1.0-smoothstep(-pixel,pixel,d);
  vec3 color=vec3(0.0);
  vec3 cDeep=bodyDeepAt(p), cMid=bodyMidAt(p), cBright=bodyBrightAt(p), cGlow=bodyGlowAt(p);

  float outside=max(d,0.0);
  float halo=exp(-outside*62.0)*(1.0-inside);
  color+=cGlow*halo*0.085*u_glowStrength*u_outerHaloStrength;

  /* v0.7.6.2: pixels well outside the membrane can only contribute the outer
     glow. Skip normals, optical depth, fluid, nucleus and material lighting.
     Keep selected cells on the full path because their selection cue extends
     beyond the membrane. The visible halo itself is preserved. */
  if(inside<0.001 && d>0.040 && u_selectedSingle<0.001){
    color=1.0-exp(-max(color,vec3(0.0))*u_exposure);
    color=pow(max(color,vec3(0.0)),vec3(0.94));
    return color;
  }

  vec3 Nlocal=calcSceneNormal(p,d);
  vec3 N=normalToWorld(Nlocal);
  float z=sceneDepth(p);

  float edgeLens=smoothstep(-0.080,-0.004,d)*inside;
  vec2 opticalP=p-Nlocal.xy*edgeLens*0.0065*u_distortionStrength;
  float zOpt=sceneDepth(opticalP);

  /* v0.12.3.7 low-end fast path: the procedural cytoplasm used to be
     evaluated for every pixel in the square scissor rectangle, including
     pixels that are completely outside the membrane. Those pixels only use
     the cheap outer halo, so the expensive fluid field was invisible work.
     The uniform branch is exact for visible body pixels and saves a large
     amount of fragment work on mobile GPUs. */
  vec3 fluid=vec3(0.0);
  float mat=u_materialEnabled*u_materialMaster;
  /* v0.12.3.3 MATERIAL REPAIR: transmission is now a diagnostic-strength
     optical control. At 0 the body stays dense; at 1 the central cytoplasm
     becomes genuinely glass-like/dark against the sandbox background while
     membrane and subsurface light remain visible. */
  float transmission=clamp(u_bodyTransmission*mat,0.0,1.0);
  float depthMask=smoothstep(0.05,0.92,zOpt);
  if(inside>0.0){
    fluid=sampleFluid(opticalP,zOpt);
    float porous=0.62+0.38*evolvingNoise(opticalP*2.2+vec2(1.7,-3.1),u_time*0.045+u_instancePhase);
    float transmissionLoss=mix(1.0,0.13+0.22*porous,transmission*depthMask);
    fluid*=transmissionLoss;
    float gelT=clamp((u_gelDepth-0.25)/1.95,0.0,1.0);
    float gelGain=mix(0.52,1.72,gelT);
    fluid*=mix(1.0,gelGain,clamp(mat,0.0,1.0));
    fluid+=cGlow*inside*transmission*(1.0-depthMask)*0.020;
  }
  color=mix(color,fluid,inside);

  vec3 viewDir=vec3(0.0,0.0,1.0);
  vec3 lightDir=normalize(vec3(-0.48,0.72,0.68));
  vec3 halfDir=normalize(lightDir+viewDir);
  float fresnel=pow(1.0-sat(dot(N,viewDir)),3.0);
  float spec=pow(sat(dot(N,halfDir)),58.0);

  float thick=u_membraneThickness*(1.0+0.16*u_wallTension);
  float outerHair=band(d,0.0002,0.0012*thick,0.0019*thick);
  float cyanSkin=band(d,-0.0055*thick,0.0045*thick,0.0055*thick);
  float glassBody=band(d,-0.0140*thick,0.0108*thick,0.0118*thick);
  float darkInner=band(d,-0.0270*thick,0.0098*thick,0.0120*thick);
  float innerLineA=band(d,-0.0155*thick,0.0015*thick,0.0024*thick);
  float innerLineB=band(d,-0.0235*thick,0.0011*thick,0.0022*thick);

  color*=1.0-darkInner*inside*(0.28+u_innerDarkness*0.34*mat);
  color*=1.0-inside*u_innerDarkness*mat*0.10*smoothstep(0.020,0.110,abs(d));

  vec2 worldRel=shadingWorldRel(p);
  float worldRelLen=max(length(worldRel),0.0001);
  float angle=atan(worldRel.y,worldRel.x);
  float sweep=pow(sat(0.5+0.5*cos(angle-(2.18+u_time*0.055))),12.0);
  vec2 radial=worldRel/worldRelLen;
  float directional=0.35+0.65*sat(dot(radial,normalize(vec2(-0.64,0.77)))*0.5+0.5);

  /* v0.12.3.3: material sliders now control the actual contribution instead
     of only nudging a fixed baseline. Zero can really remove a layer; high
     values are deliberately obvious for reliable tuning. */
  float rimGain=mix(1.0,clamp(u_rimBrightness,0.0,4.0),clamp(mat,0.0,1.0));
  float highlightGain=mix(1.0,clamp(u_highlightStrength,0.0,3.0),clamp(mat,0.0,1.0));
  float innerRimGain=mix(1.0,clamp(u_innerRimStrength,0.0,2.5),clamp(mat,0.0,1.0));
  color+=cGlow*fresnel*glassBody*inside*(0.33+0.38*directional)*rimGain;
  color+=cBright*cyanSkin*inside*(0.18+0.23*directional+0.15*sweep)*rimGain;
  color+=mix(vec3(0.74,0.97,1.0),cBright,0.34*mat)*outerHair*(0.48+0.60*sweep)*directional*rimGain;
  color+=vec3(0.88,0.99,1.0)*spec*glassBody*inside*(0.22+0.78*sweep)*highlightGain;
  color+=cBright*(innerLineA*0.10+innerLineB*0.06)*inside*(0.28+0.72*sweep)*u_membraneGlints*innerRimGain;
  float rimSoft=clamp(u_rimSoftness,0.18,3.0);
  float softRim=exp(-max(abs(d)-0.001,0.0)*(118.0/rimSoft))*inside;
  float innerGlow=clamp(u_innerGlowStrength,0.0,3.0)*mat;
  color+=cGlow*softRim*innerGlow*0.115;
  color+=cGlow*depthMask*inside*innerGlow*0.078;

  /* Temporary contact seam = the two original membranes pressed together.
     It appears only while they resist each other and dissolves as adhesion wins. */
  float seamCurve=0.0014*sin(p.y*42.0+u_time*1.05);
  float seamExtent=u_sourceRadius*(0.45+0.20*u_contactCompression);
  float seamVertical=1.0-smoothstep(seamExtent*0.72,seamExtent,abs(p.y));
  float seamCore=exp(-abs(p.x-seamCurve)*300.0)*seamVertical*u_contactSeam*inside;
  float seamHalo=exp(-abs(p.x-seamCurve)*120.0)*seamVertical*u_contactSeam*inside;
  color*=1.0-seamCore*0.28;
  color+=cBright*seamCore*0.095;
  color+=cGlow*seamHalo*0.028;

  /* Surface tension concentrates wet highlights around a division waist. */
  float waistX=exp(-pow(abs(p.x)/(u_targetRadius*0.36+0.0001),2.0));
  float waistBand=smoothstep(u_targetRadius*0.18,u_targetRadius*0.90,abs(p.y));
  color+=cBright*waistX*waistBand*u_pinch*u_wallTension*inside*0.045;

  /* Single world-entity selection cue. This follows the real membrane SDF,
     not the old hard-coded pair positions. */
  float singleSelect=exp(-abs(d)*92.0)*u_selectedSingle;
  color+=cBright*singleSelect*0.065;
  color+=cGlow*singleSelect*0.022;

  /* subtle selection feedback only; no new fusion object */
  if(u_fusionProgress<0.01){
    vec2 pa=sourcePosA(), pb=sourcePosB();
    float da=abs(cellSDFLocal(p-pa,u_sourceRadius,0.3));
    float db=abs(cellSDFLocal(p-pb,u_sourceRadius,2.1));
    float selA=exp(-da*95.0)*u_selectA;
    float selB=exp(-db*95.0)*u_selectB;
    color+=cBright*(selA+selB)*0.07;
  }

  float nrA=nucleusRadiusA(), nrB=nucleusRadiusB();
  vec2 nA=nucleusA(), nB=nucleusB();
  float dNA=nucleusSDFAt(p,nA,nrA,u_nucleusPhaseA,u_sourceRotationA);
  float dNB=nucleusSDFAt(p,nB,nrB,u_nucleusPhaseB,u_sourceRotationB);
  float inA=1.0-smoothstep(-pixel,pixel,dNA);
  float showB=step(1.5,u_nucleusCount);
  float inB=(1.0-smoothstep(-pixel,pixel,dNB))*showB;

  /* Integrated Wissel-eclipse. Instead of a graphic ring, the nucleus keeps
     its normal body while the opposite colour glows from behind it like a
     solar-eclipse corona. During a colour shift that corona blooms outward
     through the cytoplasm. This remains part of the main shader. */
  if(u_swapRingEnabled>0.001){
    float sp=ease(u_swapProgress);
    float pulse=0.5+0.5*sin(u_time*u_swapPulseSpeed+u_instancePhase*2.7);
    vec2 rq=p-nA;
    float rqLen=max(length(rq),0.0001);
    float ra=atan(rq.y,rq.x);
    float wobble=sin(ra*4.0+u_time*0.56+u_instancePhase)*u_swapRingWidth*0.28
                +sin(ra*7.0-u_time*0.31-u_instancePhase*0.6)*u_swapRingWidth*0.14;
    float coronaReach=max(u_swapRingRadius+wobble,0.001);
    float coronaSoft=max(0.0012,u_swapRingWidth*2.9);
    float dOut=max(dNA,0.0);
    float shell=exp(-dOut/coronaSoft)*(1.0-inA)*inside;
    float horizon=1.0-smoothstep(coronaReach,coronaReach+coronaSoft*2.2,dOut);
    float asym=0.90+0.10*sin(ra-0.85+u_time*0.12+u_instancePhase*0.3);
    float life=(0.80+0.20*pulse)*u_swapRingEnabled;
    /* v0.12.1: the eclipse colour is the TARGET species directly. Do not mix
       it with the current body palette; that washed green into cyan/white. */
    vec3 coronaGlow=u_swapTargetGlow;
    vec3 coronaBright=u_swapTargetBright;
    vec3 coronaChromatic=mix(coronaGlow,coronaBright,0.24);
    float eclipse=shell*horizon*asym;
    float chromaMask=sat(eclipse*(0.48+0.34*u_swapRingGlow)*life);
    /* Replace part of the local cytoplasm by target-coloured backlight before
       adding bloom. This keeps the corona visibly green/blue instead of white. */
    color=mix(color,coronaChromatic*(0.48+0.12*pulse),chromaMask*0.72);
    color+=coronaGlow*eclipse*(0.145+0.105*u_swapRingGlow)*life;
    color+=coronaBright*eclipse*(0.040+0.045*u_swapRingGlow)*life;

    if(u_swapAction>0.001){
      float waveR=mix(nrA+coronaReach*0.9,u_targetRadius*0.96,sp);
      float waveSoft=coronaSoft*1.8+0.008;
      float spread=1.0-smoothstep(waveR-waveSoft,waveR+waveSoft,rqLen);
      float front=exp(-abs(rqLen-waveR)/max(0.001,waveSoft*0.75));
      float endFade=1.0-smoothstep(0.90,1.0,sp);
      float spreadMask=spread*inside*(0.24+0.22*sp);
      color=mix(color,coronaChromatic*(0.43+0.20*sp),spreadMask*0.44);
      color+=coronaGlow*front*inside*0.042*endFade;
      color+=coronaBright*front*inside*0.016*endFade;
    }
  }


  if(u_mimicEnabled>0.001){
    vec2 mq=p-nA;
    vec3 starBlue=vec3(0.36,0.88,1.00);
    vec3 starGreen=vec3(0.40,1.00,0.64);
    vec3 starWhite=vec3(1.00,1.00,0.97);
    float particleCount=max(0.0,floor(u_mimicCount+0.5));

    /* Four mini-glints near the nucleus / inner zone: recognisable but subtle. */
    for(int i=0;i<4;i++){
      float fi=float(i);
      float ang=fi*1.5707963 + u_instancePhase*0.31 + sin(u_time*0.10+fi*1.7)*0.18;
      float rr=nrA + u_mimicOrbitRadius*(0.16 + 0.06*sin(fi*2.1+u_instancePhase));
      vec2 c=vec2(cos(ang),sin(ang))*rr;
      vec2 dq=mq-c;
      float pulse=0.5+0.5*sin(u_time*(u_mimicPulseSpeed*0.55)+fi*1.6+u_instancePhase);
      float twinkle=pow(pulse,4.2);
      float size=u_mimicSize*0.75*(0.90+0.14*pulse+0.12*twinkle);
      float len=max(length(dq),0.0001);
      float core=1.0-smoothstep(size*0.46,size,len);
      float flareX=exp(-abs(dq.y)/max(0.0008,size*0.18))*exp(-abs(dq.x)/max(0.001,size*2.8));
      float flareY=exp(-abs(dq.x)/max(0.0008,size*0.18))*exp(-abs(dq.y)/max(0.001,size*2.8));
      float halo=exp(-len/max(0.001,size*2.1));
      float lens=(1.0-inA)*inside*(0.88+0.12*pulse);
      vec3 glintCol=mix(starWhite, mix(starGreen,starBlue,fract(fi*0.41+0.23)), 0.45+0.18*u_mimicPrismShift);
      color=mix(color,glintCol,core*(0.28+0.12*twinkle)*lens);
      color+=glintCol*halo*(0.012+0.030*u_mimicGlow)*(0.88+0.30*twinkle)*lens;
      color+=starWhite*(flareX+flareY)*(0.010+0.024*u_mimicGlow)*(0.72+0.78*twinkle)*lens;
    }

    /* Eight tiny light particles in slow circulation through the cytoplasm. */
    /* Deliberately irregular fixed scatter: no ring around the nucleus. */
    for(int i=0;i<12;i++){
      float fi=float(i);
      float active=1.0-step(particleCount,fi+0.5);
      float baseAng=fract(fi*0.413+0.119+u_instancePhase*0.043)*6.2831853;
      float ang=baseAng + u_time*u_mimicPulseSpeed*(0.11+0.018*fi);
      float rr=u_mimicOrbitRadius*(0.34+0.52*fract(fi*0.287+0.33));
      rr*=0.96+0.04*sin(u_time*0.19+fi*1.3+u_instancePhase);
      vec2 c=vec2(cos(ang),sin(ang))*rr;
      vec2 dq=mq-c;
      float pulse=0.55+0.45*sin(u_time*(u_mimicPulseSpeed*0.42)+fi*2.2+u_instancePhase*0.7);
      float twinkle=pow(sat(pulse),5.0);
      float size=u_mimicSize*(0.58+0.24*fract(fi*0.37+0.11))*(0.90+0.10*pulse);
      float len=max(length(dq),0.0001);
      float core=1.0-smoothstep(size*0.62,size,len);
      float halo=exp(-len/max(0.001,size*2.5));
      float lens=(1.0-inA)*inside*active;
      vec3 partCol=mix(starBlue,starGreen,fract(fi*0.29+0.17));
      partCol=mix(partCol,starWhite,0.18+0.08*u_mimicPrismShift);
      color=mix(color,partCol,core*(0.18+0.12*twinkle)*lens);
      color+=partCol*halo*(0.009+0.021*u_mimicGlow)*lens*(0.82+0.16*pulse+0.34*twinkle);
      color+=starWhite*core*twinkle*0.12*lens;
    }
  }

  /* Nucleus material is only visible inside a nucleus. Previously both
     nucleus shaders (and a second full cytoplasm sample) ran for every cell
     pixel, even on one-nucleus cells. Restrict those expensive evaluations to
     the pixels that can actually contribute. Output is unchanged. */
  vec3 behind=fluid;
  if((inA+inB)*inside>0.0) behind=sampleFluid(p,z);
  vec3 colA=behind;
  vec3 colB=behind;
  if(inA*inside>0.0) colA=shadeNucleus(p,nA,nrA,u_nucleusPhaseA,u_sourceRotationA,behind,0.0);
  if(inB*inside>0.0) colB=shadeNucleus(p,nB,nrB,u_nucleusPhaseB,u_sourceRotationB,behind,1.0);
  float nDepthA=0.5+0.5*sin(u_time*0.37+u_nucleusPhaseA*1.31);
  float nDepthB=0.5+0.5*sin(u_time*0.35+u_nucleusPhaseB*1.27+1.7);
  float nucleusOpacity=mix(1.0,clamp(u_nucleusOpacity,0.0,1.0),clamp(mat,0.0,1.0));
  float nucleusContrast=mix(1.0,clamp(u_nucleusContrast,0.25,2.6),clamp(mat,0.0,1.0));
  colA=mix(behind,colA*nucleusContrast,nucleusOpacity);
  colB=mix(behind,colB*nucleusContrast,nucleusOpacity);
  /* Parallax/depth is a visual diagnostic control, not physical Z. The wider
     range makes front/back breathing immediately readable in the lab. */
  colA*=max(0.15,1.0+(nDepthA-0.5)*u_nucleusDepth*mat*0.72);
  colB*=max(0.15,1.0+(nDepthB-0.5)*u_nucleusDepth*mat*0.72);

  float edgeA=band(dNA,0.0,0.0017,0.0026);
  float edgeB=band(dNB,0.0,0.0017,0.0026)*showB;
  colA+=mix(vec3(0.76,0.97,1.0),nucleusBrightAt(0.0),0.68)*edgeA*0.72;
  colB+=mix(vec3(0.76,0.97,1.0),nucleusBrightAt(1.0),0.68)*edgeB*0.72;

  color=mix(color,colA,inA*inside);
  color=mix(color,colB,inB*inside);

  float hA=exp(-max(dNA,0.0)*76.0)*(1.0-inA);
  float hB=exp(-max(dNB,0.0)*76.0)*(1.0-inB)*showB;
  float nucleusHaloGain=mix(1.0,clamp(u_nucleusHaloStrength,0.0,4.0),clamp(mat,0.0,1.0));
  color+=u_nucleusColorGlow*(hA+hB)*inside*0.082*u_glowStrength*(1.0+0.20*u_nucleusPulse)*nucleusHaloGain;

  vec3 brightPass=max(color-vec3(0.68),vec3(0.0));
  color+=brightPass*brightPass*0.30*u_glowStrength;

  if(u_renderDetail>0.72){
    float grain=hash21(gl_FragCoord.xy+fract(u_time)*17.3)-0.5;
    color+=grain*0.0048*u_grainStrength*(0.15+0.85*inside);
  }

  color=1.0-exp(-max(color,vec3(0.0))*u_exposure);
  color=pow(max(color,vec3(0.0)),vec3(0.94));
  return color;
}

void main(){
  float fit=min(u_resolution.x,u_resolution.y);
  vec2 p=(gl_FragCoord.xy-0.5*u_resolution.xy)/fit;
  p*=u_viewScale;
  p-=u_worldCenter;
  p=rot2(-u_interactionAngle)*p;
  gl_FragColor=vec4(shadeScene(p)*u_globalOpacity,1.0);
}
`;

const broodNucleusFragmentSource = `
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_resolution;
uniform float u_viewScale;
uniform float u_time;
uniform vec2 u_center;
uniform float u_radius;
uniform float u_phase;
uniform float u_opacity;
uniform vec2 u_parentCenter;
uniform float u_parentRadius;
uniform float u_clipInside;
uniform vec3 u_colorDeep;
uniform vec3 u_colorMid;
uniform vec3 u_colorBright;
uniform vec3 u_colorGlow;
uniform float u_glow;
uniform float u_renderDetail;
float sat(float x){ return clamp(x,0.0,1.0); }
mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,s,-s,c); }
float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise2(vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f); float a=hash21(i),b=hash21(i+vec2(1.0,0.0)),c=hash21(i+vec2(0.0,1.0)),d=hash21(i+vec2(1.0,1.0)); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
float evolvingNoise(vec2 p,float t){ vec2 aP=rot2(0.23+0.07*sin(t*0.13))*p+vec2(0.11*t,-0.06*t); vec2 bP=rot2(-0.51+0.06*cos(t*0.11))*p*1.041+vec2(-0.08*t+6.2,0.09*t-4.7); float a=noise2(aP), b=noise2(bP); float w=0.5+0.5*sin(t*0.63+sin(dot(p,vec2(0.31,-0.27)))*1.15); return mix(a,b,w); }
float softFbm(vec2 p,float t){ float v=0.0,a=0.53; mat2 r=mat2(0.82,0.57,-0.57,0.82); for(int i=0;i<4;i++){ v+=evolvingNoise(p,t)*a; p=r*p*2.02+vec2(0.41,-0.33); t*=1.21; a*=0.49; } return sat(v/1.02); }
void main(){
  float fit=min(u_resolution.x,u_resolution.y);
  vec2 world=(gl_FragCoord.xy-0.5*u_resolution.xy)/fit*u_viewScale;
  vec2 q=world-u_center; float rr=max(u_radius,0.0005);
  float ang=atan(q.y,q.x);
  float deform=sin(ang*3.0+u_time*0.19+u_phase)*0.0014+sin(ang*5.0-u_time*0.13-u_phase)*0.0008;
  float liveR=max(0.0005,rr+deform); vec2 qn=q/max(liveR,0.001); float rho=length(qn);
  float aa=max(0.010,(u_viewScale/fit)/max(u_radius,0.001)*1.15); float inside=1.0-smoothstep(1.0-aa,1.0+aa,rho); float z=sqrt(max(0.0,1.0-rho*rho));
  /* Tiny Brood nuclei used to run two FBM fields over their complete halo
     scissor. Outside the rim the result is only a faint glow. */
  if(inside<0.001 && rho>1.10){
    float halo=exp(-max(rho-1.0,0.0)*9.0);
    float alpha=halo*0.52*u_opacity;
    if(alpha<0.001) discard;
    vec3 col=u_colorGlow*halo*0.10*u_glow;
    gl_FragColor=vec4(col*alpha,alpha);
    return;
  }
  vec3 n=normalize(vec3(qn,max(0.04,z))), light=normalize(vec3(-0.46,0.69,0.72)), view=vec3(0.0,0.0,1.0), h=normalize(light+view);
  float t=u_time*0.075; vec2 f=q/max(rr,0.001)*0.34+vec2(u_phase*3.1,-u_phase*2.4);
  float macro=u_renderDetail>0.50?softFbm(f*3.6,t+u_phase):evolvingNoise(f*3.6,t+u_phase); float fine=u_renderDetail>0.50?softFbm(rot2(0.52)*f*7.2+vec2(-2.6,3.4),t*1.36+5.8+u_phase):evolvingNoise(rot2(0.52)*f*5.1+vec2(-2.6,3.4),t*1.20+5.8+u_phase); float plasma=pow(sat((fine-0.50)/0.50),2.3);
  vec3 col=mix(u_colorDeep*0.74,u_colorMid*1.08,smoothstep(0.15,0.88,macro)); col+=u_colorGlow*z*z*0.30*u_glow; col+=u_colorBright*plasma*0.13;
  float fresnel=pow(1.0-z,2.10), spec=pow(sat(dot(n,h)),14.0), broad=pow(sat(dot(n,h)),4.4); col+=u_colorGlow*fresnel*0.60; col+=vec3(0.90,0.99,1.0)*(spec*0.22+broad*0.070);
  float edge=exp(-abs(rho-1.0)*36.0); col+=vec3(0.84,0.99,1.0)*edge*0.42; float halo=exp(-max(rho-1.0,0.0)*9.0)*(1.0-inside); col+=u_colorGlow*halo*0.10*u_glow;
  float alpha=max(inside,halo*0.52);
  if(u_clipInside>0.001){ float pd=length(world-u_parentCenter); float clip=1.0-smoothstep(u_parentRadius-0.010,u_parentRadius+0.004,pd); alpha*=mix(1.0,clip,sat(u_clipInside)); col*=mix(1.0,clip,sat(u_clipInside)); }
  alpha*=u_opacity; gl_FragColor=vec4(col*alpha,alpha);
}
`;

const STYLE_UNIFORM_KEYS = Object.freeze([
  'activity','membraneAmp1','membraneAmp2','membraneAmp3','membraneLiving',
  'membraneThickness','membraneGlints','volumeDepth','densityContrast',
  'fluidWarp','fluidSpeed','liquidLights','fineDetail','nucleusGlow',
  'nucleusPlasma','nucleusSheen','nucleusPulse','distortionStrength','glowStrength',
  'exposure','grainStrength'
]);

export class CellRenderer {
  constructor(canvas, errorBox) {
    this.canvas = canvas;
    this.errorBox = errorBox;
    this.gl = canvas.getContext('webgl', {
      alpha: false,
      /* The shaders already analytically smooth membrane/nucleus edges.
         Mobile MSAA adds framebuffer bandwidth with almost no visible gain. */
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    if (!this.gl) throw new Error('WebGL kon niet worden gestart.');

    this.viewScale = 1.04;
    this.idleIdentity = null;
    this.materialProfiles = null;
    this.pixelRatioCap = 1.0;
    this.renderDetail = 1.0;
    // Reused per draw to avoid creating short-lived objects for every cell/frame.
    this.idleMechanics = {styleP:0,pairSep:0,merge:1,relax:1,compression:0,seam:0,stretch:0,pinch:0,recoil:0,flowBoost:0,fluidReactionStrength:0,nucleusMove:1,wallTension:0};
    this.idleSourceRotations = {a:0,b:0};
    this.idlePhases = {shapeA:0,shapeB:0,nucleusA:0,nucleusB:0,fluidA:0,fluidB:0};
    this.program = this.#createProgram(fragmentSource);
    this.nucleusProgram = this.#createProgram(broodNucleusFragmentSource);
    this.backgroundProgram = this.#createProgram(backgroundFragmentSource);
    this.backgroundTexture = null;
    this.backgroundReady = false;
    this.backgroundImageAspect = 1.0;
    this.backgroundOpacity = 0.94;
    this.backgroundPositionY = 0.50;
    this.backgroundUrl = '';
    this.#createQuad();
    this.#cacheUniforms();
    this.#cacheNucleusUniforms();
    this.#cacheBackgroundUniforms();
    /* v0.7.7a.13 — Settings and WebGL must use the exact same background. */
    const selected=window.CellquationBackgroundState;
    this.setBackgroundImage(selected?.src||'assets/backgrounds/options/abyss_void.png',{
      opacity:0.94,positionY:Number.isFinite(selected?.positionY)?selected.positionY:0.50
    });
    this._cqBackgroundHandler=(event)=>{
      const detail=event?.detail||{};
      if(detail.src)this.setBackgroundImage(detail.src,{opacity:0.94,positionY:Number.isFinite(detail.positionY)?detail.positionY:0.50});
    };
    window.addEventListener('cellquation:backgroundchange',this._cqBackgroundHandler);
  }

  setIdleIdentity(settings) {
    this.idleIdentity = settings || null;
  }

  setMaterialProfiles(settings) {
    this.materialProfiles = settings || null;
  }

  setPixelRatioCap(cap = 1.0) {
    /* v0.7.6.4: allow high-end supersampling; governor protects low-end at 1:1. */
    this.pixelRatioCap = Math.max(1.0, Math.min(1.75, Number(cap) || 1.0));
  }

  setRenderDetail(value = 1.0) {
    this.renderDetail = Math.max(0.28, Math.min(1.0, Number(value) || 1.0));
  }

  #compile(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) || 'Onbekende shaderfout';
      gl.deleteShader(shader);
      throw new Error(log);
    }
    return shader;
  }

  #createProgram(fsSource) {
    const gl = this.gl;
    const vs = this.#compile(gl.VERTEX_SHADER, vertexSource);
    const fs = this.#compile(gl.FRAGMENT_SHADER, fsSource);
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(p) || 'Onbekende linkfout';
      gl.deleteProgram(p);
      throw new Error(log);
    }
    return p;
  }

  #createQuad() {
    const gl = this.gl;
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),
      gl.STATIC_DRAW
    );
    this.mainPosLoc = gl.getAttribLocation(this.program, 'a_position');
    this.nucleusPosLoc = gl.getAttribLocation(this.nucleusProgram, 'a_position');
    this.backgroundPosLoc = gl.getAttribLocation(this.backgroundProgram, 'a_position');
    this.#useProgram(this.program, this.mainPosLoc);
  }

  #useProgram(program, posLoc) {
    const gl=this.gl;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc,2,gl.FLOAT,false,0,0);
  }

  #cacheUniforms() {
    const names = [
      'u_resolution','u_viewScale','u_time','u_worldCenter','u_interactionAngle','u_instancePhase','u_selectedSingle','u_nucleusCount','u_globalOpacity','u_outerHaloStrength','u_renderDetail','u_sourceRotationA','u_sourceRotationB',
      'u_sourceShapePhaseA','u_sourceShapePhaseB','u_nucleusPhaseA','u_nucleusPhaseB','u_fluidPhaseA','u_fluidPhaseB',
      'u_fusionProgress','u_transitionMode',
      'u_merge','u_relax','u_pairSeparation','u_customPair','u_pairOffsetA','u_pairOffsetB','u_customNucleusTargets','u_nucleusTargetA','u_nucleusTargetB','u_sourceNucleusRadiusA','u_sourceNucleusRadiusB','u_targetNucleusRadiusA','u_targetNucleusRadiusB','u_contactCompression','u_contactSeam',
      'u_stretch','u_pinch','u_recoil','u_flowBoost','u_fluidReactionStrength','u_nucleusMove','u_wallTension',
      'u_selectA','u_selectB','u_startPosA','u_startPosB',
      'u_sourceRadius','u_targetRadius','u_sourceNucleusRadius','u_targetNucleusRadius',
      'u_nucleusSeparation','u_activity','u_membraneAmp1','u_membraneAmp2',
      'u_membraneAmp3','u_membraneLiving','u_membraneThickness','u_membraneGlints',
      'u_volumeDepth','u_densityContrast','u_fluidWarp','u_fluidSpeed',
      'u_liquidLights','u_fineDetail','u_nucleusGlow','u_nucleusPlasma',
      'u_nucleusSheen','u_distortionStrength','u_glowStrength','u_exposure',
      'u_grainStrength','u_colorDeep','u_colorMid','u_colorBright','u_colorGlow','u_heteroFusion','u_sourceColorADeep','u_sourceColorAMid','u_sourceColorABright','u_sourceColorAGlow','u_sourceColorBDeep','u_sourceColorBMid','u_sourceColorBBright','u_sourceColorBGlow','u_nucleusColorDeep','u_nucleusColorMid','u_nucleusColorBright','u_nucleusColorGlow','u_nucleusPulse','u_idleEnabled','u_idleCellPulseAmplitude','u_idleCellPulseSpeed','u_idleRimDriftStrength','u_idleRimDriftSpeed','u_idleNucleusDriftAmplitude','u_idleNucleusDriftSpeed','u_idleNucleusPulseAmplitude','u_idleNucleusPulseSpeed','u_idleMaster','u_idleMembraneWobble','u_idlePhaseVariation','u_materialEnabled','u_materialMaster','u_bodyTransmission','u_innerDarkness','u_rimBrightness','u_rimSoftness','u_innerRimStrength','u_innerGlowStrength','u_highlightStrength','u_gelDepth','u_nucleusHaloStrength','u_nucleusOpacity','u_nucleusContrast','u_nucleusDepth','u_swapRingEnabled','u_swapAction','u_swapProgress','u_swapRingRadius','u_swapRingWidth','u_swapRingGlow','u_swapPulseSpeed','u_swapTargetBright','u_swapTargetGlow','u_mimicEnabled','u_mimicCount','u_mimicOrbitRadius','u_mimicSize','u_mimicGlow','u_mimicPulseSpeed','u_mimicPrismShift'
    ];
    this.U = {};
    names.forEach(n => this.U[n] = this.gl.getUniformLocation(this.program, n));
  }

  #cacheNucleusUniforms() {
    const names=['u_resolution','u_viewScale','u_time','u_center','u_radius','u_phase','u_opacity','u_parentCenter','u_parentRadius','u_clipInside','u_colorDeep','u_colorMid','u_colorBright','u_colorGlow','u_glow','u_renderDetail'];
    this.NU={};
    names.forEach(n=>this.NU[n]=this.gl.getUniformLocation(this.nucleusProgram,n));
  }

  #cacheBackgroundUniforms() {
    const gl=this.gl;
    this.BU={
      u_resolution:gl.getUniformLocation(this.backgroundProgram,'u_resolution'),
      u_background:gl.getUniformLocation(this.backgroundProgram,'u_background'),
      u_uvScale:gl.getUniformLocation(this.backgroundProgram,'u_uvScale'),
      u_uvOffset:gl.getUniformLocation(this.backgroundProgram,'u_uvOffset'),
      u_opacity:gl.getUniformLocation(this.backgroundProgram,'u_opacity'),
    };
  }

  setBackgroundImage(url,{opacity=0.94,positionY=0.50}={}) {
    const gl=this.gl;
    const absoluteUrl=new URL(url,document.baseURI).href;
    this.backgroundOpacity=Math.max(0,Math.min(1,Number(opacity)||0));
    this.backgroundPositionY=Math.max(0,Math.min(1,Number(positionY)||0.5));
    if(this.backgroundUrl===absoluteUrl&&this.backgroundReady)return;
    const image=new Image();
    image.decoding='async';
    image.onload=()=>{
      let texture=null;
      try{
        texture=gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
        const oldTexture=this.backgroundTexture;
        this.backgroundTexture=texture;
        this.backgroundImageAspect=Math.max(0.01,image.naturalWidth/Math.max(1,image.naturalHeight));
        this.backgroundUrl=absoluteUrl;
        this.backgroundReady=true;
        if(oldTexture&&oldTexture!==texture){try{gl.deleteTexture(oldTexture)}catch{}}
      }catch(err){
        if(texture){try{gl.deleteTexture(texture)}catch{}}
        console.warn('Cellquation background texture upload failed',err);
      }
    };
    image.onerror=()=>{console.warn('Cellquation background image unavailable',url)};
    image.src=url;
  }

  #drawBackground() {
    if(!this.backgroundReady||!this.backgroundTexture)return;
    const gl=this.gl,BU=this.BU;
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.BLEND);
    this.#useProgram(this.backgroundProgram,this.backgroundPosLoc);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,this.backgroundTexture);
    gl.uniform1i(BU.u_background,0);
    gl.uniform2f(BU.u_resolution,this.canvas.width,this.canvas.height);
    /* v0.7.7a.11: sample the background as one full-viewport plate.
       The CSS play-app uses the same image with background-size:cover. Mapping this
       canvas to its viewport sub-rectangle makes the image continue seamlessly behind
       the translucent top and bottom HUD instead of restarting at the stage edges. */
    const rect=this.canvas.getBoundingClientRect();
    const viewW=Math.max(1,window.innerWidth||document.documentElement.clientWidth||rect.width);
    const viewH=Math.max(1,window.innerHeight||document.documentElement.clientHeight||rect.height);
    const viewportAspect=viewW/viewH, imageAspect=this.backgroundImageAspect;
    let fullSx=1,fullSy=1;
    if(viewportAspect>imageAspect) fullSy=imageAspect/viewportAspect;
    else fullSx=viewportAspect/imageAspect;
    const fullOx=(1-fullSx)*0.5;
    const fullOy=(1-fullSy)*(1-this.backgroundPositionY);
    const stageX=Math.max(0,rect.left)/viewW;
    const stageYFromBottom=Math.max(0,viewH-(rect.top+rect.height))/viewH;
    const stageW=Math.max(0,rect.width)/viewW;
    const stageH=Math.max(0,rect.height)/viewH;
    const sx=fullSx*stageW, sy=fullSy*stageH;
    const ox=fullOx+fullSx*stageX;
    const oy=fullOy+fullSy*stageYFromBottom;
    gl.uniform2f(BU.u_uvScale,sx,sy);
    gl.uniform2f(BU.u_uvOffset,ox,oy);
    gl.uniform1f(BU.u_opacity,this.backgroundOpacity);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }

  setViewScale(scale) { this.viewScale=Math.max(0.70,Number(scale)||1.04); }

  resize() {
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, this.pixelRatioCap || 1.0);
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(rect.width * dpr));
    const h = Math.max(2, Math.round(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
  }


  beginFrame() {
    const gl = this.gl;
    this.resize();
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0,0.020,0.031,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    /* v0.7.7a.2: the static deep-sea plate is drawn inside the same WebGL
       framebuffer before Synapse + CellKit. This removes the fullscreen CSS
       blend/compositor path that stalled Living Networks on weak Android. */
    this.#drawBackground();
    gl.enable(gl.BLEND);
    /* Cell and synapse shaders remain the proven luminous passes. Their black
       pixels add nothing, while coloured membrane/flow emission is added over
       the already-drawn world plate. */
    gl.blendFunc(gl.ONE, gl.ONE);
    this.#useProgram(this.program,this.mainPosLoc);
  }

  endFrame() {
    const gl = this.gl;
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.BLEND);
  }

  getWorldBounds() {
    const fit = Math.min(this.canvas.width, this.canvas.height);
    const halfW = (this.canvas.width * 0.5 / fit) * this.viewScale;
    const halfH = (this.canvas.height * 0.5 / fit) * this.viewScale;
    return { left:-halfW, right:halfW, bottom:-halfH, top:halfH };
  }

  #setScissor(center, radius) {
    const gl=this.gl;
    const fit=Math.min(this.canvas.width,this.canvas.height);
    const px=this.canvas.width*0.5 + (center[0]/this.viewScale)*fit;
    const py=this.canvas.height*0.5 + (center[1]/this.viewScale)*fit;
    const pr=Math.max(4,(radius/this.viewScale)*fit);
    const x=Math.max(0,Math.floor(px-pr));
    const y=Math.max(0,Math.floor(py-pr));
    const x2=Math.min(this.canvas.width,Math.ceil(px+pr));
    const y2=Math.min(this.canvas.height,Math.ceil(py+pr));
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x,y,Math.max(1,x2-x),Math.max(1,y2-y));
  }

  #applyCommon({
    time, center, angle, instancePhase, selectedSingle, nucleusCount, phases, opacity, sourceRotations,
    mechanics, sourceVisual, targetVisual, style, colors, sourceColors = null, nucleusColors = null, phase, customPair = null, customNuclei = null, swap = null, mimic = null, idleIdentity = null, materialProfile = null, outerHaloStrength = 1
  }) {
    const gl=this.gl, U=this.U;
    gl.uniform2f(U.u_resolution,this.canvas.width,this.canvas.height);
    gl.uniform1f(U.u_viewScale,this.viewScale);
    gl.uniform1f(U.u_time,time);
    gl.uniform2f(U.u_worldCenter,center[0],center[1]);
    gl.uniform1f(U.u_interactionAngle,angle || 0);
    gl.uniform1f(U.u_instancePhase,instancePhase || 0);
    gl.uniform1f(U.u_selectedSingle,selectedSingle ? 1 : 0);
    gl.uniform1f(U.u_nucleusCount,nucleusCount || 1);
    gl.uniform1f(U.u_globalOpacity,opacity === undefined ? 1 : opacity);
    gl.uniform1f(U.u_outerHaloStrength,Math.max(0,outerHaloStrength ?? 1));
    gl.uniform1f(U.u_renderDetail,this.renderDetail);
    gl.uniform1f(U.u_sourceRotationA,sourceRotations?.a ?? (angle || 0));
    gl.uniform1f(U.u_sourceRotationB,sourceRotations?.b ?? (angle || 0));
    gl.uniform1f(U.u_sourceShapePhaseA,phases?.shapeA ?? (1.1+(instancePhase||0)));
    gl.uniform1f(U.u_sourceShapePhaseB,phases?.shapeB ?? (1.1+(instancePhase||0)));
    gl.uniform1f(U.u_nucleusPhaseA,phases?.nucleusA ?? (0.4+(instancePhase||0)));
    gl.uniform1f(U.u_nucleusPhaseB,phases?.nucleusB ?? (2.2+(instancePhase||0)));
    gl.uniform1f(U.u_fluidPhaseA,phases?.fluidA ?? (instancePhase||0));
    gl.uniform1f(U.u_fluidPhaseB,phases?.fluidB ?? (instancePhase||0));

    gl.uniform1f(U.u_fusionProgress,mechanics.styleP);
    gl.uniform1f(U.u_transitionMode,phase==='fusing'?1:phase==='dividing'?2:0);
    gl.uniform1f(U.u_merge,mechanics.merge);
    gl.uniform1f(U.u_relax,mechanics.relax);
    gl.uniform1f(U.u_pairSeparation,mechanics.pairSep);
    gl.uniform1f(U.u_customPair,customPair?1:0);
    gl.uniform2f(U.u_pairOffsetA,customPair?.a?.[0]??-mechanics.pairSep,customPair?.a?.[1]??0);
    gl.uniform2f(U.u_pairOffsetB,customPair?.b?.[0]?? mechanics.pairSep,customPair?.b?.[1]??0);
    gl.uniform1f(U.u_customNucleusTargets,customNuclei?1:0);
    gl.uniform2f(U.u_nucleusTargetA,customNuclei?.targetA?.[0]??0,customNuclei?.targetA?.[1]??0);
    gl.uniform2f(U.u_nucleusTargetB,customNuclei?.targetB?.[0]??0,customNuclei?.targetB?.[1]??0);
    gl.uniform1f(U.u_contactCompression,mechanics.compression);
    gl.uniform1f(U.u_contactSeam,mechanics.seam);
    gl.uniform1f(U.u_stretch,mechanics.stretch);
    gl.uniform1f(U.u_pinch,mechanics.pinch);
    gl.uniform1f(U.u_recoil,mechanics.recoil);
    gl.uniform1f(U.u_flowBoost,mechanics.flowBoost);
    gl.uniform1f(U.u_fluidReactionStrength,mechanics.fluidReactionStrength || 0);
    gl.uniform1f(U.u_nucleusMove,mechanics.nucleusMove);
    gl.uniform1f(U.u_wallTension,mechanics.wallTension);
    gl.uniform1f(U.u_selectA,0);
    gl.uniform1f(U.u_selectB,0);
    gl.uniform2f(U.u_startPosA,0,0);
    gl.uniform2f(U.u_startPosB,0,0);

    gl.uniform1f(U.u_sourceRadius,sourceVisual.radius);
    gl.uniform1f(U.u_targetRadius,targetVisual.radius);
    gl.uniform1f(U.u_sourceNucleusRadius,sourceVisual.nucleusRadius);
    gl.uniform1f(U.u_targetNucleusRadius,targetVisual.nucleusRadius);
    gl.uniform1f(U.u_sourceNucleusRadiusA,customNuclei?.sourceRadiusA??sourceVisual.nucleusRadius);
    gl.uniform1f(U.u_sourceNucleusRadiusB,customNuclei?.sourceRadiusB??sourceVisual.nucleusRadius);
    gl.uniform1f(U.u_targetNucleusRadiusA,customNuclei?.targetRadiusA??targetVisual.nucleusRadius);
    gl.uniform1f(U.u_targetNucleusRadiusB,customNuclei?.targetRadiusB??targetVisual.nucleusRadius);
    gl.uniform1f(U.u_nucleusSeparation,targetVisual.nucleusSeparation || 0);

    for(const key of STYLE_UNIFORM_KEYS) gl.uniform1f(U['u_'+key],style[key] ?? 0);

    gl.uniform3fv(U.u_colorDeep,colors.deep);
    gl.uniform3fv(U.u_colorMid,colors.mid);
    gl.uniform3fv(U.u_colorBright,colors.bright);
    gl.uniform3fv(U.u_colorGlow,colors.glow);
    const sca=sourceColors?.a||colors, scb=sourceColors?.b||colors;
    gl.uniform1f(U.u_heteroFusion,(phase==='fusing' && sourceColors?.hetero)?1:0);
    gl.uniform3fv(U.u_sourceColorADeep,sca.deep); gl.uniform3fv(U.u_sourceColorAMid,sca.mid); gl.uniform3fv(U.u_sourceColorABright,sca.bright); gl.uniform3fv(U.u_sourceColorAGlow,sca.glow);
    gl.uniform3fv(U.u_sourceColorBDeep,scb.deep); gl.uniform3fv(U.u_sourceColorBMid,scb.mid); gl.uniform3fv(U.u_sourceColorBBright,scb.bright); gl.uniform3fv(U.u_sourceColorBGlow,scb.glow);
    const nc=nucleusColors || colors;
    gl.uniform3fv(U.u_nucleusColorDeep,nc.deep);
    gl.uniform3fv(U.u_nucleusColorMid,nc.mid);
    gl.uniform3fv(U.u_nucleusColorBright,nc.bright);
    gl.uniform3fv(U.u_nucleusColorGlow,nc.glow);
    gl.uniform1f(U.u_nucleusPulse,style.nucleusPulse ?? 0);
    const idle=phase==='idle' ? idleIdentity : null;
    gl.uniform1f(U.u_idleEnabled,idle?.enabled?1:0);
    const idleMaster=idle?.master??1;
    gl.uniform1f(U.u_idleCellPulseAmplitude,(idle?.cellPulseAmplitude??0)*idleMaster);
    gl.uniform1f(U.u_idleCellPulseSpeed,idle?.cellPulseSpeed??0);
    gl.uniform1f(U.u_idleRimDriftStrength,(idle?.rimDriftStrength??0)*idleMaster);
    gl.uniform1f(U.u_idleRimDriftSpeed,idle?.rimDriftSpeed??0);
    gl.uniform1f(U.u_idleNucleusDriftAmplitude,(idle?.nucleusDriftAmplitude??0)*idleMaster);
    gl.uniform1f(U.u_idleNucleusDriftSpeed,idle?.nucleusDriftSpeed??0);
    gl.uniform1f(U.u_idleMaster,idleMaster);
    gl.uniform1f(U.u_idleMembraneWobble,idle?.membraneWobble??0);
    gl.uniform1f(U.u_idlePhaseVariation,idle?.phaseVariation??1);
    gl.uniform1f(U.u_idleNucleusPulseAmplitude,(idle?.nucleusPulseAmplitude??0)*idleMaster);
    gl.uniform1f(U.u_idleNucleusPulseSpeed,idle?.nucleusPulseSpeed??0);
    const mat=materialProfile;
    gl.uniform1f(U.u_materialEnabled,mat?.enabled?1:0);
    gl.uniform1f(U.u_materialMaster,mat?.master??1);
    gl.uniform1f(U.u_bodyTransmission,mat?.bodyTransmission??0);
    gl.uniform1f(U.u_innerDarkness,mat?.innerDarkness??0);
    gl.uniform1f(U.u_rimBrightness,mat?.rimBrightness??1);
    gl.uniform1f(U.u_rimSoftness,mat?.rimSoftness??1);
    gl.uniform1f(U.u_innerRimStrength,mat?.innerRimStrength??0);
    gl.uniform1f(U.u_innerGlowStrength,mat?.innerGlowStrength??0);
    gl.uniform1f(U.u_highlightStrength,mat?.highlightStrength??1);
    gl.uniform1f(U.u_gelDepth,mat?.gelDepth??1);
    gl.uniform1f(U.u_nucleusHaloStrength,mat?.nucleusHaloStrength??1);
    gl.uniform1f(U.u_nucleusOpacity,mat?.nucleusOpacity??1);
    gl.uniform1f(U.u_nucleusContrast,mat?.nucleusContrast??1);
    gl.uniform1f(U.u_nucleusDepth,mat?.nucleusDepth??0);
    gl.uniform1f(U.u_swapRingEnabled,swap?.enabled?1:0);
    gl.uniform1f(U.u_swapAction,swap?.action?1:0);
    gl.uniform1f(U.u_swapProgress,swap?.progress??0);
    gl.uniform1f(U.u_swapRingRadius,swap?.ringRadius??0.071);
    gl.uniform1f(U.u_swapRingWidth,swap?.ringWidth??0.006);
    gl.uniform1f(U.u_swapRingGlow,swap?.ringGlow??0.92);
    gl.uniform1f(U.u_swapPulseSpeed,swap?.pulseSpeed??3.8);
    gl.uniform3fv(U.u_swapTargetBright,swap?.targetColors?.bright??colors.bright);
    gl.uniform3fv(U.u_swapTargetGlow,swap?.targetColors?.glow??colors.glow);
    gl.uniform1f(U.u_mimicEnabled,mimic?.enabled?1:0);
    gl.uniform1f(U.u_mimicCount,mimic?.organelles??0);
    gl.uniform1f(U.u_mimicOrbitRadius,mimic?.orbitRadius??0.06);
    gl.uniform1f(U.u_mimicSize,mimic?.size??0.01);
    gl.uniform1f(U.u_mimicGlow,mimic?.glow??1.0);
    gl.uniform1f(U.u_mimicPulseSpeed,mimic?.pulseSpeed??1.55);
    gl.uniform1f(U.u_mimicPrismShift,mimic?.prismShift??0.5);
  }

  drawCell({ time, cell, visual, colors, nucleusColors = null, opacity = 1, swap = null, mimic = null, outerHaloStrength = 0.46 }) {
    this.#useProgram(this.program,this.mainPosLoc);
    const isSplit=cell.type==='split';
    const identitySource=this.idleIdentity;
    const resolvedIdle=identitySource?.[cell.type] || identitySource?.fusion || identitySource;
    const phaseVariation=(cell.state==='idle')?(resolvedIdle?.phaseVariation??1):1;
    const instancePhase=((cell.visualSeed*0.731)%6.28318530718)*phaseVariation;
    const nASeed=cell.nuclei[0]?.visualSeed ?? cell.visualSeed;
    const nBSeed=cell.nuclei[1]?.visualSeed ?? (cell.visualSeed+1.7);
    const nAPhase=((nASeed*0.731)%6.28318530718)*phaseVariation;
    const nBPhase=((nBSeed*0.731)%6.28318530718)*phaseVariation;
    const targetVisual=visual;
    const mechanics=this.idleMechanics;
    mechanics.styleP=isSplit?1:0;
    mechanics.pairSep=visual.radius*0.55;
    /* Preserve the visible halo while avoiding the nearly-black tail of the
       old 1.55x square. Fixed world-space halo padding is more faithful across
       differently sized cell types and cuts idle fragment area substantially. */
    this.#setScissor(cell.position,visual.radius+(outerHaloStrength>0.001?0.078:0.050));
    const idleIdentity=(cell.state==='idle')?resolvedIdle:null;
    const materialSource=this.materialProfiles;
    const materialProfile=materialSource?.[cell.type] || materialSource?.fusion || materialSource || null;
    const sourceRotations=this.idleSourceRotations, phases=this.idlePhases, rotation=cell.rotation||0;
    sourceRotations.a=rotation;sourceRotations.b=rotation;
    phases.shapeA=1.1+instancePhase;phases.shapeB=1.1+instancePhase;
    phases.nucleusA=0.4+nAPhase;phases.nucleusB=0.4+nBPhase;
    phases.fluidA=instancePhase;phases.fluidB=instancePhase;
    this.#applyCommon({
      time,
      center:cell.position,
      angle:rotation,
      instancePhase,
      selectedSingle:cell.selected,
      nucleusCount:isSplit?2:1,
      opacity,
      sourceRotations,
      phases,
      mechanics,
      sourceVisual:targetVisual,
      targetVisual,
      style:visual,
      colors,
      nucleusColors,
      phase:'idle',
      swap,
      mimic,
      idleIdentity,
      materialProfile,
      outerHaloStrength,
    });
    this.gl.drawArrays(this.gl.TRIANGLES,0,6);
  }

  drawTransition({
    time, transition, mechanics, fusionVisual, splitVisual, style, colors, sourceColors = null, phase, opacity = 1, materialProfile = null, outerHaloStrength = 0.46
  }) {
    this.#useProgram(this.program,this.mainPosLoc);
    const bound=Math.max(
      splitVisual.radius+0.082,
      mechanics.pairSep + fusionVisual.radius+0.072
    );
    this.#setScissor(transition.center,bound);
    this.#applyCommon({
      time,
      center:transition.center,
      angle:transition.angle || 0,
      instancePhase:transition.finalInstancePhase ?? 0,
      selectedSingle:false,
      nucleusCount:2,
      opacity,
      sourceRotations:{
        a:transition.sourceRotationA ?? (transition.angle||0),
        b:transition.sourceRotationB ?? (transition.angle||0),
      },
      phases:{
        shapeA:transition.sourceShapePhaseA,
        shapeB:transition.sourceShapePhaseB,
        nucleusA:transition.nucleusPhaseA,
        nucleusB:transition.nucleusPhaseB,
        fluidA:transition.sourceFluidPhaseA,
        fluidB:transition.sourceFluidPhaseB,
      },
      mechanics,
      sourceVisual:fusionVisual,
      targetVisual:splitVisual,
      style,
      colors,
      sourceColors,
      phase,
      materialProfile,
      outerHaloStrength,
    });
    this.gl.drawArrays(this.gl.TRIANGLES,0,6);
  }

  drawBroodNucleus({ time, center, radius, parentCenter, parentRadius, phase = 0, opacity = 1, clipInside = true, colors, glow = 1 }) {
    const gl=this.gl,U=this.NU;
    this.#setScissor(center,Math.max(radius*3.1,0.045));
    this.#useProgram(this.nucleusProgram,this.nucleusPosLoc);
    gl.uniform2f(U.u_resolution,this.canvas.width,this.canvas.height); gl.uniform1f(U.u_viewScale,this.viewScale); gl.uniform1f(U.u_time,time);
    gl.uniform2f(U.u_center,center[0],center[1]); gl.uniform1f(U.u_radius,radius); gl.uniform1f(U.u_phase,phase); gl.uniform1f(U.u_opacity,opacity);
    gl.uniform2f(U.u_parentCenter,parentCenter?.[0]??center[0],parentCenter?.[1]??center[1]); gl.uniform1f(U.u_parentRadius,parentRadius??1); gl.uniform1f(U.u_clipInside,typeof clipInside==='number'?clipInside:(clipInside?1:0));
    gl.uniform3fv(U.u_colorDeep,colors.deep); gl.uniform3fv(U.u_colorMid,colors.mid); gl.uniform3fv(U.u_colorBright,colors.bright); gl.uniform3fv(U.u_colorGlow,colors.glow); gl.uniform1f(U.u_glow,glow); gl.uniform1f(U.u_renderDetail,this.renderDetail);
    gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA); gl.drawArrays(gl.TRIANGLES,0,6); gl.blendFunc(gl.ONE,gl.ONE);
  }

  drawBroodDivision({ time, center, angle, parentRotation = 0, mechanics, fusionVisual, colors, shapePhaseA, shapePhaseB, nucleusPhaseA, nucleusPhaseB, broodStartLocal, smallNucleusRadius, materialProfile = null, outerHaloStrength = 0.46 }) {
    this.#useProgram(this.program,this.mainPosLoc);
    const childDist=mechanics.pairSep*2;
    const bound=childDist+fusionVisual.radius*1.55;
    this.#setScissor(center,bound);
    const inst=shapePhaseA;
    const targetVisual=fusionVisual;
    this.#applyCommon({
      time, center, angle, instancePhase:inst, selectedSingle:false, nucleusCount:2, opacity:1,
      sourceRotations:{a:parentRotation,b:parentRotation},
      phases:{shapeA:1.1+shapePhaseA,shapeB:1.1+shapePhaseB,nucleusA:0.4+nucleusPhaseA,nucleusB:0.4+nucleusPhaseB,fluidA:shapePhaseA,fluidB:shapePhaseB},
      mechanics, sourceVisual:fusionVisual, targetVisual, style:fusionVisual, colors, phase:'dividing',
      customPair:{a:[0,0],b:[childDist,0]},
      customNuclei:{
        targetA:[0,0], targetB:broodStartLocal,
        sourceRadiusA:fusionVisual.nucleusRadius, sourceRadiusB:fusionVisual.nucleusRadius,
        targetRadiusA:fusionVisual.nucleusRadius, targetRadiusB:smallNucleusRadius,
      },
      materialProfile,
      outerHaloStrength,
    });
    this.gl.drawArrays(this.gl.TRIANGLES,0,6);
  }

  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const xCss = clientX - rect.left;
    const yCss = clientY - rect.top;
    const x = xCss / rect.width * this.canvas.width;
    const y = (1 - yCss / rect.height) * this.canvas.height;
    const fit = Math.min(this.canvas.width, this.canvas.height);
    return [
      ((x - 0.5 * this.canvas.width) / fit) * this.viewScale,
      ((y - 0.5 * this.canvas.height) / fit) * this.viewScale,
    ];
  }
}
