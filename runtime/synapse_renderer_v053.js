/*
 * Cellquation v0.5.3 production presentation adapter — v0.7.6.2 GPU fast paths over frozen CellKit Synapse Renderer v0.7.9
 * Canonical transport geometry/choreography is unchanged.
 * Canonical geometry and transport remain frozen. This adapter keeps the controlled
 * CellKit silhouette while strengthening coloured bioluminescence, contact light,
 * and the material continuity between cell and synapse.
 *
 * CellKit Synapse Renderer v0.7.9 — Transport Polish
 *
 * Fundamental change from v0.5.x:
 * - no sampled polygon outline
 * - no polygon distance / segment normals
 * - analytic continuous body + analytic mouth cavities
 * - membrane and cytoplasm intentionally mirror the existing CellKit cell shader
 */

const VS = `attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.0,1.0);}`;

const FS = `
#ifdef GL_ES
precision highp float;
#endif

#define TAU 6.28318530718

uniform vec2 u_resolution;
uniform float u_viewScale;
uniform float u_time;
uniform vec2 u_axisA;
uniform vec2 u_axisB;
uniform vec2 u_mid;
uniform vec2 u_axisDir;
uniform float u_halfLen;
uniform float u_curve;
uniform float u_waist;
uniform float u_endWidth;
uniform float u_shoulderWidth;
uniform float u_mouthWidth;
uniform float u_mouthAngle;
uniform float u_mouthBowl;
uniform float u_mouthWrap;
uniform float u_mouthFlatness;

uniform float u_glow;
uniform float u_opacity;
uniform float u_relief;
uniform float u_flowSpeed;
uniform float u_flowStrength;
uniform float u_living;
uniform float u_breatheStrength;
uniform float u_breatheSpeed;
uniform float u_edgeLife;
uniform float u_mouthFlex;
uniform float u_innerShadowThickness;
uniform float u_innerShadowDarkness;
uniform float u_actionMode;
uniform float u_transportDirection;
uniform float u_transportProgress;
uniform float u_transportBulge;
uniform float u_mouthDilationA;
uniform float u_mouthDilationB;
uniform float u_mouthReachA;
uniform float u_mouthReachB;
uniform float u_transportGlow;
uniform float u_renderMode;
uniform float u_overlayMouthSide;
uniform float u_overlayStrength;
uniform float u_membraneTint;
uniform float u_rimTint;
uniform float u_flowTint;
uniform float u_contactPulse;
uniform float u_renderDetail; // low-end trims internal noise/glow, not the synapse silhouette

/* The synapse receives the same material controls as the frozen cell profile. */
uniform float u_membraneThickness;
uniform float u_volumeDepth;
uniform float u_densityContrast;
uniform float u_fluidWarp;
uniform float u_liquidLights;
uniform float u_fineDetail;
uniform float u_fluidSpeed;
uniform float u_glowStrength;

uniform vec3 u_colorADeep;
uniform vec3 u_colorAMid;
uniform vec3 u_colorABright;
uniform vec3 u_colorAGlow;
uniform vec3 u_colorBDeep;
uniform vec3 u_colorBMid;
uniform vec3 u_colorBBright;
uniform vec3 u_colorBGlow;

float sat(float x){return clamp(x,0.0,1.0);}
float ease(float x){x=sat(x);return x*x*(3.0-2.0*x);}
float band(float v,float c,float hw,float s){return 1.0-smoothstep(hw,hw+s,abs(v-c));}
mat2 rot2(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}

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
  float a=noise2(aP),b=noise2(bP);
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
vec2 livingFlow(vec2 p,float flowBoost){
  float t=u_time*u_fluidSpeed*(0.26+0.18*flowBoost);
  vec2 drift=vec2(t*0.14,-t*0.09);
  float a=evolvingNoise(p*1.52+vec2(2.1,-1.8)+drift,t*0.73);
  float b=evolvingNoise(rot2(1.13)*p*1.47+vec2(-3.6,4.4)-drift*0.7,t*0.81+5.3);
  vec2 f=vec2(a-0.5,b-0.5);
  f+=vec2(-(b-0.5),a-0.5)*0.24;
  return p+f*u_fluidWarp*(0.72+0.30*u_living);
}
float liquidFlecks(vec2 p,float t){
  float a=softFbm(p*7.4+vec2(1.7,-2.4),t*1.26+1.2);
  float b=softFbm(rot2(0.75)*p*11.6+vec2(-4.8,3.1),t*1.58+5.6);
  return pow(sat((0.62*a+0.38*b-0.72)/0.28),2.2);
}

float sminPoly(float a,float b,float k){
  float h=clamp(0.5+0.5*(b-a)/max(k,1e-5),0.0,1.0);
  return mix(b,a,h)-k*h*(1.0-h);
}
float smaxPoly(float a,float b,float k){return -sminPoly(-a,-b,k);}

/* Approximate ellipse SDF. It is smooth and is only used for the mouth cavity,
   where exact Euclidean distance is less important than continuous curvature. */
float sdEllipseApprox(vec2 p,vec2 r){
  vec2 rr=max(r,vec2(1e-4));
  return (length(p/rr)-1.0)*min(rr.x,rr.y);
}

float widthProfile(float u){
  u=sat(u);
  float neck=max(u_waist,0.010);
  float mouth=u_endWidth*(0.64+0.50*u_mouthWidth);
  float exponent=mix(1.58,1.12,sat(u_shoulderWidth));
  float s=ease(pow(u,exponent));
  float shoulder=mouth*(0.010+0.018*u_shoulderWidth)*ease(u);
  return mix(neck,mouth,s)+shoulder;
}

/* Analytic synapse: one continuous variable-width body, then two smooth
   overlapping ellipse cavities create the open receiving mouths. */
float analyticSynapseSDF(vec2 q,out float localWidth){
  /* Segment frame is uniform across the draw. JS computes it once instead of
     every fragment normalizing the same endpoints. */
  float halfLen=max(0.03,u_halfLen);
  float u=sat(abs(q.y)/max(halfLen,1e-4));
  float mouthZone=smoothstep(0.58,0.98,u);
  float shoulderZone=smoothstep(0.26,0.74,u)*(1.0-smoothstep(0.80,0.98,u));
  float centreZone=1.0-smoothstep(0.0,0.62,u);

  float lifeRate=mix(0.65,1.55,u_breatheSpeed);
  float breatheRate=lifeRate*0.82;
  float breathWaveA=sin(u_time*breatheRate+u*2.7+0.8);
  float breathWaveB=sin(u_time*(lifeRate*0.51)+u*5.3+2.1);
  float breathNoise=(evolvingNoise(vec2(u*3.1,0.31),u_time*lifeRate*0.12)-0.5);
  float breathAmp=(0.00055+0.0046*u_breatheStrength)*(0.32+0.68*u_living);
  float bodyBreath=(0.58*breathWaveA+0.27*breathWaveB+0.15*breathNoise)*breathAmp;

  float centreBend=u_curve*(1.0-pow(u,1.45));
  float livingCentre=(sin(q.y*9.0-u_time*lifeRate*0.72)+0.45*sin(q.y*17.0+u_time*lifeRate*0.51+1.7))*(0.00045+0.0028*u_edgeLife)*u_living*(1.0-0.55*u);
  float x=q.x-centreBend-livingCentre;

  float baseW=widthProfile(u);

  /* Compact transport action. The carried cell is not rendered as a full
     cell inside the synapse. Instead the synapse itself develops one small
     travelling pressure bulge. Its amplitude is clamped to the local duct
     width so it can never explode into the giant mouth/chamber seen in
     v0.7.1. Mouth dilation remains a modest lip response only. */
  float sideA=1.0-smoothstep(-halfLen*0.16,halfLen*0.16,q.y);
  float sideB=1.0-sideA;
  float localDilation=sideA*u_mouthDilationA+sideB*u_mouthDilationB;
  baseW += mouthZone*localDilation*0.030;
  /* v0.7.6.2: almost every network edge is idle most frames. The previous
     shader still evaluated travelling-bulge exp/pow math and multiplied it by
     zero. Uniform branching removes that invisible transport work entirely. */
  if(u_actionMode>0.001){
    float transportT=mix(u_transportProgress,1.0-u_transportProgress,step(u_transportDirection,0.0));
    float bulgeY=mix(-halfLen*0.90,halfLen*0.90,sat(transportT));
    float bulgeSigma=max(0.026,u_endWidth*0.34);
    float transportWindow=exp(-pow((q.y-bulgeY)/bulgeSigma,2.0));
    float requestedBulge=0.0045+0.0150*u_transportBulge;
    float safeBulge=min(baseW*0.42,requestedBulge);
    baseW += transportWindow*safeBulge;
  }

  /* Visible living silhouette, deliberately modelled after the cell membrane:
     broad + medium + fine waves, with different phases on both sides. In
     v0.6.1 edgeLife mostly modulated sub-pixel noise and lighting, so the
     slider could look as if it did nothing. Here it directly changes wR/wL. */
  float longitudinal=q.y/max(halfLen,1e-4);
  float edgeAmp=(0.0015+0.0090*u_edgeLife)*u_living;
  float edgeMask=0.34+0.30*shoulderZone+0.46*mouthZone;
  float broadR=sin(longitudinal*TAU*1.10-u_time*lifeRate*0.92+0.35);
  float midR=sin(longitudinal*TAU*2.15+u_time*lifeRate*0.71+1.75);
  float fineR=sin(longitudinal*TAU*3.70-u_time*lifeRate*1.18+4.10);
  float broadL=sin(longitudinal*TAU*1.06+u_time*lifeRate*0.87+2.15);
  float midL=sin(longitudinal*TAU*2.28-u_time*lifeRate*0.69+4.05);
  float fineL=sin(longitudinal*TAU*3.55+u_time*lifeRate*1.12+0.85);
  float edgeWaveR=(0.62*broadR+0.26*midR+0.12*fineR)*edgeAmp*edgeMask;
  float edgeWaveL=(0.62*broadL+0.26*midL+0.12*fineL)*edgeAmp*edgeMask;

  float slowNoise=(evolvingNoise(vec2(q.y*2.4,0.37),u_time*lifeRate*0.16)-0.5)*0.0018*u_living*(0.25+0.75*u_edgeLife);
  float livingWidth=bodyBreath*(0.55+0.45*centreZone);
  float wR=max(0.008,baseW+livingWidth+edgeWaveR+slowNoise);
  float wL=max(0.008,baseW+livingWidth+edgeWaveL-slowNoise*0.70);
  localWidth=0.5*(wR+wL);

  float dSide=max(x-wR,-x-wL);
  float baseOuterY=halfLen+u_endWidth*(0.035+0.105*u_mouthAngle) + bodyBreath*(0.25+0.75*mouthZone);
  float outerYA=baseOuterY+u_mouthReachA*0.120;
  float outerYB=baseOuterY+u_mouthReachB*0.120;
  float dCap=max(q.y-outerYB,-q.y-outerYA);
  float dOuter=smaxPoly(dSide,dCap,max(0.006,u_endWidth*0.055));

  float mouthW=widthProfile(1.0);
  float mouthPulse=sin(u_time*lifeRate*0.88+0.9)*u_mouthFlex*(0.18+0.82*u_living);
  float baseRX=mouthW*mix(0.70,0.88,u_mouthWrap)*(1.0+0.075*mouthPulse)*mix(1.0,0.90,u_mouthFlatness);
  float baseRY=u_endWidth*mix(0.48,0.68,u_mouthBowl)*(1.0+0.12*mouthPulse);
  float cavityRXA=baseRX*(1.0+0.58*u_mouthDilationA);
  float cavityRXB=baseRX*(1.0+0.58*u_mouthDilationB);
  float cavityRYA=baseRY*(1.0+0.72*u_mouthDilationA);
  float cavityRYB=baseRY*(1.0+0.72*u_mouthDilationB);
  float cavityCentreYA=outerYA+cavityRYA*(mix(0.28,0.40,u_mouthFlatness)*(1.0+0.075*mouthPulse));
  float cavityCentreYB=outerYB+cavityRYB*(mix(0.28,0.40,u_mouthFlatness)*(1.0+0.075*mouthPulse));
  float cavityX=(evolvingNoise(vec2(2.1,q.y*0.7),u_time*lifeRate*0.15)-0.5)*0.0018*u_living;

  float topCavity=sdEllipseApprox(vec2(x-cavityX,q.y-cavityCentreYB),vec2(cavityRXB,cavityRYB));
  float bottomCavity=sdEllipseApprox(vec2(x+cavityX,q.y+cavityCentreYA),vec2(cavityRXA,cavityRYA));
  float lipSoft=max(0.0045,u_endWidth*0.035);
  float d=smaxPoly(dOuter,-topCavity,lipSoft);
  d=smaxPoly(d,-bottomCavity,lipSoft);

  /* Same idea as the cells: subtle evolving displacement is part of the
     membrane itself, not a glow painted around a static vector shape. */
  float edgeNoiseA=evolvingNoise(vec2(q.y*2.6,x*2.2)+vec2(1.6,-2.3),u_time*lifeRate*(0.13+0.025*u_edgeLife));
  float edgeNoiseB=evolvingNoise(rot2(0.91)*vec2(q.y*3.9,x*2.8)+vec2(-3.1,4.0),u_time*lifeRate*(0.11+0.025*u_edgeLife)+4.7);
  float edgeShape=(0.34+0.54*mouthZone+0.22*shoulderZone)*(0.20+0.80*u_edgeLife);
  /* Tiny micro-drift only. The actual visible movement now comes from wR/wL
     above, preventing this final displacement from reading as a moving glow. */
  float membraneDrift=((edgeNoiseA-0.5)*0.70+(edgeNoiseB-0.5)*0.30)*0.0012*u_living*edgeShape;
  float breathe=bodyBreath*0.20;
  return d+membraneDrift+breathe;
}

vec3 paletteBlend(vec3 a,vec3 neutral,vec3 b,float t){
  float wl=exp(-pow((t-0.06)/0.28,2.0));
  float wr=exp(-pow((t-0.94)/0.28,2.0));
  float wc=1.10*exp(-pow((t-0.50)/0.31,2.0));
  float sum=max(1e-5,wl+wc+wr);
  return (a*wl+neutral*wc+b*wr)/sum;
}

void main(){
  float fit=min(u_resolution.x,u_resolution.y);
  vec2 p=(gl_FragCoord.xy-0.5*u_resolution.xy)/fit*u_viewScale;

  vec2 mid=u_mid;
  vec2 axis=u_axisDir;
  vec2 nAxis=vec2(-axis.y,axis.x);
  vec2 q=vec2(dot(p-mid,nAxis),dot(p-mid,axis));
  float halfLen=max(0.03,u_halfLen);
  float totalLen=halfLen*2.0;
  float t=sat((q.y+halfLen)/max(totalLen,1e-4));

  /* Cheap conservative reject before the living analytic SDF. The axis-aligned
     scissor of a diagonal segment contains corner pixels that cannot possibly
     touch the duct or its halo; do not run mouth/noise geometry there. */
  float coarseX=abs(u_curve)+u_endWidth*1.32+0.115;
  float coarseY=halfLen+u_endWidth*0.34+max(abs(u_mouthReachA),abs(u_mouthReachB))*0.120+0.115;
  if(abs(q.x)>coarseX || abs(q.y)>coarseY) discard;

  float localWidth=0.02;
  float d=analyticSynapseSDF(q,localWidth);
  float pixel=max(0.00085,u_viewScale/fit*1.45);
  float inside=1.0-smoothstep(-pixel,pixel,d);
  /* The old 0.16 world-unit tail was already essentially black but forced the
     fragment shader to run over a huge rectangle. At 0.095 the remaining halo
     contribution is below a visible phone-pixel threshold. */
  if(inside<0.001&&d>0.095)discard;

  /* v0.7.6.2 dedicated front-lip fast path. Previously a tiny attachment lip
     paid for the complete cytoplasm/noise/transport shader and was masked only
     at the very end. The overlay only needs endpoint membrane light. */
  if(u_renderMode>0.5){
    float endpointCoord=mix(1.0-t,t,step(0.0,u_overlayMouthSide));
    float endpointMask=smoothstep(0.68,0.91,endpointCoord);
    float rimMask=exp(-abs(d)*105.0);
    float innerLip=smoothstep(-0.020,0.004,d)*(1.0-smoothstep(0.004,0.020,d));
    float lipMask=endpointMask*max(rimMask,innerLip*0.72)*u_overlayStrength;
    if(lipMask<0.001) discard;
    float side=step(0.0,u_overlayMouthSide);
    vec3 lipGlow=mix(u_colorAGlow,u_colorBGlow,side);
    vec3 lipBright=mix(u_colorABright,u_colorBBright,side);
    float pulse=0.90+0.10*sin(u_time*(0.58+0.75*u_breatheSpeed)+abs(q.y)*6.2+1.4);
    vec3 lipColor=mix(lipGlow,lipBright,0.30)*(0.42+0.18*pulse);
    lipColor+=lipGlow*u_contactPulse*(0.055+0.025*pulse);
    float alpha=clamp(lipMask*(0.62+0.24*u_opacity),0.0,0.94);
    gl_FragColor=vec4(lipColor,alpha);
    return;
  }

  /* Pixels outside the membrane contribute only the coloured halo. Avoid all
     fluid FBM, flecks, bilateral current and material bands for those pixels. */
  if(inside<0.001){
    vec3 neutralGlow=vec3(0.07,0.59,0.63);
    vec3 cGlow=paletteBlend(u_colorAGlow,neutralGlow,u_colorBGlow,t);
    cGlow=mix(neutralGlow,cGlow,sat(0.76*u_flowTint));
    float halo=exp(-max(d,0.0)*62.0);
    float haloBudget=mix(0.48,1.0,u_renderDetail);
    vec3 color=cGlow*halo*0.118*u_glow*u_glowStrength*haloBudget;
    float alpha=halo*0.024*haloBudget;
    if(alpha<0.0008) discard;
    gl_FragColor=vec4(color,clamp(alpha,0.0,0.97));
    return;
  }

  /* Depth proxy for the non-circular duct. Crucially, interior light is driven
     by depth/density like the cells, not by polygon normals. */
  float z=sqrt(sat((-d+pixel)/max(localWidth*0.92,0.018)));

  vec3 neutralDeep=vec3(0.012,0.070,0.090);
  vec3 neutralMid=vec3(0.050,0.280,0.330);
  /* The shared centre colour is deliberately saturated teal rather than white.
     It keeps mixed-colour edges coherent without recreating a vector-like rim. */
  vec3 neutralBright=vec3(0.16,0.70,0.73);
  vec3 neutralGlow=vec3(0.07,0.59,0.63);

  vec3 cDeep=paletteBlend(u_colorADeep,neutralDeep,u_colorBDeep,t);
  vec3 cMid=paletteBlend(u_colorAMid,neutralMid,u_colorBMid,t);
  vec3 cBright=paletteBlend(u_colorABright,neutralBright,u_colorBBright,t);
  vec3 cGlow=paletteBlend(u_colorAGlow,neutralGlow,u_colorBGlow,t);
  cMid=mix(neutralMid,cMid,sat(0.72*u_membraneTint));
  cBright=mix(neutralBright,cBright,sat(0.70*u_rimTint));
  cGlow=mix(neutralGlow,cGlow,sat(0.76*u_flowTint));

  /* Almost the same fluid recipe as the cell shader. */
  float fluidT=u_time*u_fluidSpeed*(0.20+0.15*u_flowStrength);
  vec2 np=vec2(q.x/max(localWidth*3.2,0.12),q.y/max(halfLen,0.12));
  vec2 drift1=vec2(fluidT*0.17,-fluidT*0.11);
  vec2 drift2=vec2(-fluidT*0.10,fluidT*0.14);
  vec2 fq=livingFlow(np*(0.92+0.08*u_flowStrength)+drift1*(1.0+0.55*u_flowStrength),u_flowStrength);
  vec2 fq2=livingFlow(rot2(0.56)*np*(1.43+0.10*u_flowStrength)+vec2(2.7,-3.8)+drift2*(1.0+0.45*u_flowStrength),u_flowStrength);

  /* v0.7.6.4: preserve analytic body/mouth/edge motion at every tier. On a
     proven weak phone only the interior liquid microstructure is simplified. */
  float macro=softFbm(fq*1.72+vec2(-1.2,2.1),fluidT*0.72+2.4);
  float medium;
  float detail;
  if(u_renderDetail>0.70){
    medium=softFbm(fq2*3.25+vec2(3.9,-1.7),fluidT*1.08+7.3);
    detail=softFbm(rot2(-0.41)*fq*6.7+vec2(-5.1,4.6),fluidT*1.55+11.6);
  }else{
    medium=evolvingNoise(fq2*3.25+vec2(3.9,-1.7),fluidT*1.08+7.3);
    detail=mix(medium,evolvingNoise(rot2(-0.41)*fq*4.1+vec2(-5.1,4.6),fluidT*1.28+11.6),step(0.45,u_renderDetail));
  }
  float density=sat((macro*0.50+medium*0.33+detail*0.17-0.5)*u_densityContrast+0.5);
  float thickness=z*u_volumeDepth;
  float opticalDensity=mix(0.76,1.28,density);
  float transmission=exp(-opticalDensity*thickness*0.92);

  vec3 fluid=cDeep*(0.58+0.30*(1.0-transmission));
  fluid+=cMid*(0.22+0.47*z)*mix(0.75,1.14,density);
  fluid+=cGlow*z*z*0.050*u_volumeDepth;
  fluid*=mix(0.74,1.17,density);

  float current=smoothstep(0.42,0.80,medium)*(0.50+0.50*smoothstep(0.30,0.84,detail));
  fluid+=cBright*current*0.052*u_fineDetail;
  float flecks=0.0;
  if(u_renderDetail>0.70){
    flecks=liquidFlecks(fq,fluidT);
    fluid+=cBright*flecks*0.075*u_liquidLights*(0.18+0.82*z);
    fluid+=cGlow*flecks*0.028*u_liquidLights;
  }else if(u_renderDetail>0.45){
    flecks=pow(sat((evolvingNoise(fq*5.0+vec2(1.7,-2.4),fluidT*1.18)-0.64)/0.36),2.0);
    fluid+=cBright*flecks*0.036*u_liquidLights*(0.20+0.80*z);
  }
  float fine=pow(sat((detail-0.57)/0.43),3.0);
  fluid+=cBright*fine*0.020*u_fineDetail*smoothstep(0.08,0.94,z)*mix(0.38,1.0,u_renderDetail);

  /* Explicit bilateral current. Cell A lives at negative q.y, cell B at
     positive q.y. Both waves originate in the centre and travel outward. */
  float centreBand=exp(-pow(q.x/max(localWidth*0.72,0.010),2.0));
  float regionA=1.0-smoothstep(0.10,0.50,t);
  float regionB=smoothstep(0.50,0.90,t);
  float waveA=(0.5+0.5*sin((-q.y*34.0)-fluidT*7.0+sin(q.x*9.0)*0.55))*regionA;
  float waveB=(0.5+0.5*sin(( q.y*34.0)-fluidT*7.0+sin(q.x*9.0)*0.55))*regionB;
  float sourcePulse=exp(-pow((t-0.5)/0.17,2.0))*(0.5+0.5*sin(fluidT*4.8+macro*1.2));
  float flowA=(waveA+0.22*sourcePulse)*centreBand*inside;
  float flowB=(waveB+0.22*sourcePulse)*centreBand*inside;
  fluid+=u_colorAGlow*flowA*(0.035+0.070*u_flowStrength*u_flowTint);
  fluid+=u_colorABright*flowA*(0.008+0.018*u_flowStrength*u_flowTint);
  fluid+=u_colorBGlow*flowB*(0.035+0.070*u_flowStrength*u_flowTint);
  fluid+=u_colorBBright*flowB*(0.008+0.018*u_flowStrength*u_flowTint);

  if(u_actionMode>0.001){
    float actionT=mix(u_transportProgress,1.0-u_transportProgress,step(u_transportDirection,0.0));
    float actionY=mix(-halfLen,halfLen,sat(actionT));
    float massX=q.x/max(localWidth*0.54,0.016);
    float massY=(q.y-actionY)/max(0.024,u_endWidth*0.28);
    float transportMass=exp(-(massX*massX+massY*massY)*1.72)*u_transportGlow;
    vec3 transportCol=mix(u_colorAGlow,u_colorBGlow,sat(actionT));
    vec3 transportBright=mix(u_colorABright,u_colorBBright,sat(actionT));
    fluid+=transportCol*transportMass*0.22;
    fluid+=transportBright*transportMass*transportMass*0.08;
  }

  vec3 color=fluid*inside;

  float mouthBand=smoothstep(0.54,0.96,abs(t*2.0-1.0));
  float edgePulse=(0.5+0.5*sin(u_time*(0.36+0.55*u_breatheSpeed)+q.y*4.3+macro*1.7));
  float mouthPulse=(0.5+0.5*sin(u_time*(0.58+0.75*u_breatheSpeed)+abs(q.y)*6.2+1.4));

  /* Exact scale philosophy from the CellKit cell membrane: absolute thin
     bands. The previous synapse incorrectly scaled these by the neck width,
     which made the rim read like a luminous vector stroke. */
  float thick=u_membraneThickness*(1.0+0.10*u_relief);
  float outerHair=band(d,0.0002,0.0012*thick,0.0019*thick);
  float cyanSkin=band(d,-0.0055*thick,0.0045*thick,0.0055*thick);
  float glassBody=band(d,-0.0140*thick,0.0108*thick,0.0118*thick);
  float innerShadowScale=max(0.0,u_innerShadowThickness);
  float darkInner=band(d,
    -(0.0120+0.0100*innerShadowScale)*thick,
     (0.0022+0.0030*innerShadowScale)*thick,
     (0.0028+0.0040*innerShadowScale)*thick
  );
  float innerLineA=band(d,-0.0155*thick,0.0015*thick,0.0024*thick);
  float innerLineB=band(d,-0.0235*thick,0.0011*thick,0.0022*thick);

  color*=1.0-darkInner*inside*u_innerShadowDarkness;

  float angle=atan(q.y,q.x);
  float sweep=pow(sat(0.5+0.5*cos(angle-(2.18+u_time*0.055))),12.0);
  float relLen=max(length(q),0.0001);
  vec2 radial=q/relLen;
  /* Preserve a little material direction, but never let one whole side become
     a hard, high-contrast stripe. */
  float directional=0.68+0.32*sat(dot(radial,normalize(vec2(-0.64,0.77)))*0.5+0.5);
  float fresnel=pow(1.0-z,3.0);
  float spec=pow(sat(0.5+0.5*cos(angle-2.20)),18.0)*pow(1.0-z,0.80);

  color+=cGlow*fresnel*glassBody*inside*(0.39+0.34*directional);
  color+=mix(cGlow,cBright,0.38)*cyanSkin*inside*(0.22+0.20*directional+0.11*sweep);
  color+=mix(cGlow,cBright,0.22)*outerHair*(0.29+0.22*sweep)*directional;
  color+=mix(cGlow,cBright,0.16)*spec*glassBody*inside*(0.035+0.075*sweep);
  color+=mix(cGlow,cBright,0.34)*(innerLineA*0.064+innerLineB*0.038)*inside*(0.42+0.58*sweep);
  color+=cGlow*outerHair*(0.010+0.024*u_edgeLife*u_living)*edgePulse;
  color+=cBright*cyanSkin*(0.006+0.018*u_edgeLife*u_living)*(0.55+0.45*edgePulse);
  color+=cGlow*mouthBand*(outerHair*0.55+innerLineA*0.45)*(0.014+0.024*u_mouthFlex*u_living)*mouthPulse;

  /* A small coloured attachment response at both mouths. It is membrane light,
     not a white outline, and gives the cell/synapse junction one shared pulse. */
  float contactWave=0.78+0.22*sin(u_time*0.72+abs(q.y)*5.0);
  float contactLight=mouthBand*(glassBody*0.56+cyanSkin*0.42+innerLineA*0.34)*inside;
  color+=mix(cGlow,cBright,0.18)*contactLight*u_contactPulse*contactWave;

  float outside=max(d,0.0);
  float halo=exp(-outside*62.0)*(1.0-inside);
  color+=cGlow*halo*(0.118+0.025*mouthBand*u_contactPulse)*u_glow*u_glowStrength*mix(0.48,1.0,u_renderDetail);

  float alpha=inside*(0.34+0.50*u_opacity)+outerHair*0.020+glassBody*0.010+halo*0.024;

  gl_FragColor=vec4(color,clamp(alpha,0.0,0.97));
}`;

function compile(gl,type,src){
  const shader=gl.createShader(type);
  gl.shaderSource(shader,src);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader)||'shader compile failed');
  return shader;
}
function makeProgram(gl){
  const vs=compile(gl,gl.VERTEX_SHADER,VS),fs=compile(gl,gl.FRAGMENT_SHADER,FS);
  const p=gl.createProgram();
  gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)||'program link failed');
  return p;
}
function uniforms(gl,p,names){const out={};for(const n of names)out[n]=gl.getUniformLocation(p,n);return out;}
function clamp01(x){return Math.max(0,Math.min(1,x));}
function smooth01(x){x=clamp01(x);return x*x*(3-2*x);}

/* Approximate peak world-space amplitude of the living edge waves. This is
   deliberately regression-tested so the edge-life slider cannot silently
   fall back to a sub-pixel-only effect. */
export function synapseLivingEdgeAmplitudeForTest({living=.54,edgeLife=.56}={}){
  return (.0015+.0090*clamp01(edgeLife))*clamp01(living);
}
export function synapseLivingEdgeOffsetForTest(time,longitudinal,{living=.54,edgeLife=.56,breatheSpeed=.46,side='R'}={}){
  const lifeRate=.65+(1.55-.65)*clamp01(breatheSpeed);
  const amp=synapseLivingEdgeAmplitudeForTest({living,edgeLife});
  const u=Math.min(1,Math.abs(longitudinal));
  const mouthZone=smooth01(Math.max(0,Math.min(1,(u-.58)/(.98-.58))));
  const shIn=smooth01(Math.max(0,Math.min(1,(u-.26)/(.74-.26))));
  const shOut=1-smooth01(Math.max(0,Math.min(1,(u-.80)/(.98-.80))));
  const shoulderZone=shIn*shOut;
  const mask=.34+.30*shoulderZone+.46*mouthZone;
  let broad,mid,fine;
  if(side==='L'){
    broad=Math.sin(longitudinal*Math.PI*2*1.06+time*lifeRate*.87+2.15);
    mid=Math.sin(longitudinal*Math.PI*2*2.28-time*lifeRate*.69+4.05);
    fine=Math.sin(longitudinal*Math.PI*2*3.55+time*lifeRate*1.12+.85);
  }else{
    broad=Math.sin(longitudinal*Math.PI*2*1.10-time*lifeRate*.92+.35);
    mid=Math.sin(longitudinal*Math.PI*2*2.15+time*lifeRate*.71+1.75);
    fine=Math.sin(longitudinal*Math.PI*2*3.70-time*lifeRate*1.18+4.10);
  }
  return (.62*broad+.26*mid+.12*fine)*amp*mask;
}
export function synapseMouthPulseForTest(time,{living=.54,mouthFlex=.48,breatheSpeed=.46}={}){
  const lifeRate=.65+(1.55-.65)*clamp01(breatheSpeed);
  return Math.sin(time*lifeRate*.88+.9)*clamp01(mouthFlex)*(.18+.82*clamp01(living));
}

/* JS mirror of the analytic width profile for regression tests. */
export function synapseWidthProfileForTest(u,{waist=.030,endWidth=.126,shoulderWidth=.58,mouthWidth=.88}={}){
  u=clamp01(u);
  const neck=Math.max(waist,.010);
  const mouth=endWidth*(.64+.50*mouthWidth);
  const exponent=1.58+(1.12-1.58)*clamp01(shoulderWidth);
  const s=smooth01(Math.pow(u,exponent));
  const shoulder=mouth*(.010+.018*shoulderWidth)*smooth01(u);
  return neck+(mouth-neck)*s+shoulder;
}
export function synapseMouthMetricsForTest({waist=.030,endWidth=.126,shoulderWidth=.58,mouthWidth=.88,mouthBowl=.88,mouthWrap=.96,mouthFlatness=.96}={}){
  const mouth=synapseWidthProfileForTest(1,{waist,endWidth,shoulderWidth,mouthWidth});
  return {
    outerHalfWidth:mouth,
    cavityRX:mouth*(.70+(.88-.70)*mouthWrap)*(1+(.90-1)*mouthFlatness),
    cavityRY:endWidth*(.48+(.68-.48)*mouthBowl),
  };
}

export class SynapseRenderer{
  constructor(cellRenderer){
    this.cellRenderer=cellRenderer;
    this.gl=cellRenderer.gl;
    this.canvas=cellRenderer.canvas;
    this.program=makeProgram(this.gl);
    this.pos=this.gl.getAttribLocation(this.program,'a_position');
    this.quad=this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.quad);
    this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),this.gl.STATIC_DRAW);
    this.U=uniforms(this.gl,this.program,[
      'u_resolution','u_viewScale','u_time','u_axisA','u_axisB','u_mid','u_axisDir','u_halfLen','u_curve','u_waist','u_endWidth','u_shoulderWidth','u_mouthWidth','u_mouthAngle','u_mouthBowl','u_mouthWrap','u_mouthFlatness',
      'u_glow','u_opacity','u_relief','u_flowSpeed','u_flowStrength','u_living','u_breatheStrength','u_breatheSpeed','u_edgeLife','u_mouthFlex','u_innerShadowThickness','u_innerShadowDarkness','u_actionMode','u_transportDirection','u_transportProgress','u_transportBulge','u_mouthDilationA','u_mouthDilationB','u_mouthReachA','u_mouthReachB','u_transportGlow','u_renderMode','u_overlayMouthSide','u_overlayStrength','u_membraneTint','u_rimTint','u_flowTint','u_contactPulse','u_renderDetail',
      'u_membraneThickness','u_volumeDepth','u_densityContrast','u_fluidWarp','u_liquidLights','u_fineDetail','u_fluidSpeed','u_glowStrength',
      'u_colorADeep','u_colorAMid','u_colorABright','u_colorAGlow','u_colorBDeep','u_colorBMid','u_colorBBright','u_colorBGlow'
    ]);
  }
  _setSegmentScissor(a,b,{curve=0,endWidth=.126,mouthWidth=.88,mouthReachA=0,mouthReachB=0,renderMode=0,overlayMouthSide=-1}={}){
    const g=this.gl,fit=Math.min(this.canvas.width,this.canvas.height),scale=fit/this.cellRenderer.viewScale;
    /* Conservative AABB around the actual duct + mouths + visible halo. Even
       diagonal edges remain bounded. A front-lip overlay is smaller still: it
       only exists at one endpoint, so never shade the rest of the connection. */
    const mouth=endWidth*(.64+.50*mouthWidth);
    const reach=Math.max(Math.abs(mouthReachA||0),Math.abs(mouthReachB||0))*.120;
    let left,right,bottom,top;
    if(renderMode>0.5){
      const c=overlayMouthSide<0?a:b;
      const pad=mouth*1.18+reach+.050;
      left=c[0]-pad;right=c[0]+pad;bottom=c[1]-pad;top=c[1]+pad;
    }else{
      /* Low-end tier trims only the practically invisible far halo tail. */
      const haloPad=(this.cellRenderer.renderDetail||1)<.70?.064:.100;
      const pad=Math.abs(curve||0)+mouth*1.10+reach+haloPad;
      left=Math.min(a[0],b[0])-pad;right=Math.max(a[0],b[0])+pad;
      bottom=Math.min(a[1],b[1])-pad;top=Math.max(a[1],b[1])+pad;
    }
    const x1=Math.max(0,Math.floor(this.canvas.width*.5+left*scale));
    const x2=Math.min(this.canvas.width,Math.ceil(this.canvas.width*.5+right*scale));
    const y1=Math.max(0,Math.floor(this.canvas.height*.5+bottom*scale));
    const y2=Math.min(this.canvas.height,Math.ceil(this.canvas.height*.5+top*scale));
    g.enable(g.SCISSOR_TEST);
    g.scissor(x1,y1,Math.max(1,x2-x1),Math.max(1,y2-y1));
  }
  draw({
    time,a,b,curve=0,
    waist=.030,endWidth=.126,shoulderWidth=.58,mouthWidth=.88,mouthAngle=.06,mouthBowl=.88,mouthWrap=.96,mouthFlatness=.96,
    glow=.72,opacity=.84,relief=.55,flowSpeed=.78,flowStrength=.82,living=.54,breatheStrength=.42,breatheSpeed=.46,edgeLife=.56,mouthFlex=.48,innerShadowThickness=.42,innerShadowDarkness=.18,
    actionMode=0,transportDirection=1,transportProgress=.5,transportBulge=0,mouthDilationA=0,mouthDilationB=0,mouthReachA=0,mouthReachB=0,transportGlow=0,
    renderMode=0,overlayMouthSide=-1,overlayStrength=1,
    membraneTint=1.06,rimTint=1.05,flowTint=1.92,contactPulse=0,
    material={},paletteA={},paletteB={}
  }){
    const g=this.gl,U=this.U;
    /* v0.7.6.2: synapses are local geometry, not full-screen scene passes. */
    this._setSegmentScissor(a,b,{curve,endWidth,mouthWidth,mouthReachA,mouthReachB,renderMode,overlayMouthSide});
    g.useProgram(this.program);
    g.bindBuffer(g.ARRAY_BUFFER,this.quad);
    g.enableVertexAttribArray(this.pos);
    g.vertexAttribPointer(this.pos,2,g.FLOAT,false,0,0);
    g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);

    g.uniform2f(U.u_resolution,this.canvas.width,this.canvas.height);
    g.uniform1f(U.u_viewScale,this.cellRenderer.viewScale);
    g.uniform1f(U.u_time,time);
    g.uniform2f(U.u_axisA,a[0],a[1]);g.uniform2f(U.u_axisB,b[0],b[1]);
    const dx=b[0]-a[0],dy=b[1]-a[1],segLen=Math.max(.00001,Math.hypot(dx,dy)),invLen=1/segLen;
    g.uniform2f(U.u_mid,(a[0]+b[0])*.5,(a[1]+b[1])*.5);
    g.uniform2f(U.u_axisDir,dx*invLen,dy*invLen);g.uniform1f(U.u_halfLen,Math.max(.03,segLen*.5));
    g.uniform1f(U.u_curve,curve);g.uniform1f(U.u_waist,waist);g.uniform1f(U.u_endWidth,endWidth);g.uniform1f(U.u_shoulderWidth,shoulderWidth);
    g.uniform1f(U.u_mouthWidth,mouthWidth);g.uniform1f(U.u_mouthAngle,mouthAngle);g.uniform1f(U.u_mouthBowl,mouthBowl);g.uniform1f(U.u_mouthWrap,mouthWrap);g.uniform1f(U.u_mouthFlatness,mouthFlatness);
    g.uniform1f(U.u_glow,glow);g.uniform1f(U.u_opacity,opacity);g.uniform1f(U.u_relief,relief);g.uniform1f(U.u_flowSpeed,flowSpeed);g.uniform1f(U.u_flowStrength,flowStrength);g.uniform1f(U.u_living,living);
    g.uniform1f(U.u_breatheStrength,breatheStrength);g.uniform1f(U.u_breatheSpeed,breatheSpeed);g.uniform1f(U.u_edgeLife,edgeLife);g.uniform1f(U.u_mouthFlex,mouthFlex);
    g.uniform1f(U.u_innerShadowThickness,innerShadowThickness);g.uniform1f(U.u_innerShadowDarkness,innerShadowDarkness);
    g.uniform1f(U.u_actionMode,actionMode);g.uniform1f(U.u_transportDirection,transportDirection);g.uniform1f(U.u_transportProgress,transportProgress);g.uniform1f(U.u_transportBulge,transportBulge);
    g.uniform1f(U.u_mouthDilationA,mouthDilationA);g.uniform1f(U.u_mouthDilationB,mouthDilationB);g.uniform1f(U.u_mouthReachA,mouthReachA);g.uniform1f(U.u_mouthReachB,mouthReachB);g.uniform1f(U.u_transportGlow,transportGlow);
    g.uniform1f(U.u_renderMode,renderMode);g.uniform1f(U.u_overlayMouthSide,overlayMouthSide);g.uniform1f(U.u_overlayStrength,overlayStrength);
    g.uniform1f(U.u_membraneTint,membraneTint);g.uniform1f(U.u_rimTint,rimTint);g.uniform1f(U.u_flowTint,flowTint);g.uniform1f(U.u_contactPulse,contactPulse);g.uniform1f(U.u_renderDetail,this.cellRenderer.renderDetail||1);

    g.uniform1f(U.u_membraneThickness,material.membraneThickness??.55);
    g.uniform1f(U.u_volumeDepth,material.volumeDepth??1.05);
    g.uniform1f(U.u_densityContrast,material.densityContrast??1.19);
    g.uniform1f(U.u_fluidWarp,material.fluidWarp??0.0);
    g.uniform1f(U.u_liquidLights,material.liquidLights??2.18);
    g.uniform1f(U.u_fineDetail,material.fineDetail??1.67);
    g.uniform1f(U.u_fluidSpeed,material.fluidSpeed??1.44);
    g.uniform1f(U.u_glowStrength,material.glowStrength??.94);

    g.uniform3fv(U.u_colorADeep,paletteA.deep??[0,.02,.145]);
    g.uniform3fv(U.u_colorAMid,paletteA.mid??[0,.205,.72]);
    g.uniform3fv(U.u_colorABright,paletteA.bright??[.03,.76,1]);
    g.uniform3fv(U.u_colorAGlow,paletteA.glow??[0,.56,1]);
    g.uniform3fv(U.u_colorBDeep,paletteB.deep??[0,.095,.026]);
    g.uniform3fv(U.u_colorBMid,paletteB.mid??[.02,.425,.105]);
    g.uniform3fv(U.u_colorBBright,paletteB.bright??[.18,.94,.35]);
    g.uniform3fv(U.u_colorBGlow,paletteB.glow??[.06,.72,.18]);

    g.drawArrays(g.TRIANGLES,0,6);
    g.blendFunc(g.ONE,g.ONE);
  }
}
