const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function clamp01(v) { return Math.max(0, Math.min(1, v)); }
export function smooth01(v) { v = clamp01(v); return v * v * (3 - 2 * v); }
export function smoother(v) { v = clamp01(v); return v*v*v*(v*(v*6-15)+10); }
export function lerp(a,b,t) { return a + (b-a)*t; }
export function lerp2(a,b,t) { return [lerp(a[0],b[0],t), lerp(a[1],b[1],t)]; }

function fract(v) { return v - Math.floor(v); }

export function createBroodNucleus(index, cellSeed = 0, id = null) {
  const seed = cellSeed * 1.731 + (index + 1) * 2.417;
  return {
    id,
    index,
    visualSeed: seed,
    layoutSeed: cellSeed,
    baseAngle: (index * GOLDEN_ANGLE + cellSeed * 0.83) % TAU,
    radialKey: fract((index + 1) * 0.7548776662466927 + cellSeed * 0.137),
    driftKey: fract((index + 1) * 0.5698402909980532 + cellSeed * 0.271),
    age: 0,
    retiring: false,
    retireAge: 0,
  };
}

/**
 * No count cap. Nuclei become smaller continuously as density rises; N itself
 * is never clipped. The visual identity remains the same as the main nucleus.
 */
export function broodNucleusRadius(count, profile) {
  const n = Math.max(1, Number(count) || 1);
  const base = profile.broodNucleusRadius ?? 0.0215;
  const densityScale = Math.min(1, 2.75 / Math.sqrt(n));
  return base * densityScale;
}

/**
 * Calm, fairly regular resting layout around the primary nucleus.
 *
 * No orbital travel: the nuclei keep their assigned place.  For small N they
 * sit on one evenly-spaced ring; larger N uses concentric rings.  N is never
 * capped.  A microscopic pulse keeps them alive without making them wander.
 */
export function buildBroodNucleusLayout(count, cellRadius, profile, seed = 0) {
  const n=Math.max(0,Math.floor(Number(count)||0));
  if(!n) return [];

  const inner=Math.min(cellRadius*0.40, profile.broodOrbitInner ?? 0.066);
  const outer=Math.min(cellRadius*0.72, profile.broodOrbitOuter ?? 0.108);
  const ringCount=Math.max(1,Math.ceil(Math.sqrt(n/8)));
  const radii=[];
  for(let r=0;r<ringCount;r++){
    const t=ringCount===1?0.64:r/(ringCount-1);
    radii.push(lerp(inner,outer,0.18+0.82*t));
  }

  // Allocate nuclei approximately in proportion to circumference, then place
  // them at equal angular intervals on each ring.
  const weights=radii.map(r=>Math.max(0.001,r));
  const sum=weights.reduce((a,b)=>a+b,0);
  const counts=weights.map(w=>Math.max(1,Math.floor(n*w/sum)));
  let assigned=counts.reduce((a,b)=>a+b,0);
  while(assigned<n){
    let best=0,bestScore=-Infinity;
    for(let r=0;r<counts.length;r++){
      const score=weights[r]/counts[r];
      if(score>bestScore){bestScore=score;best=r;}
    }
    counts[best]++; assigned++;
  }
  while(assigned>n){
    let best=-1,bestScore=Infinity;
    for(let r=0;r<counts.length;r++) if(counts[r]>1){
      const score=weights[r]/counts[r];
      if(score<bestScore){bestScore=score;best=r;}
    }
    if(best<0) break;
    counts[best]--; assigned--;
  }

  const out=[];
  const globalPhase=(seed*0.37)%TAU;
  for(let r=0;r<radii.length;r++){
    const m=counts[r];
    const phase=globalPhase + (r%2?Math.PI/Math.max(1,m):0) + r*0.41;
    for(let j=0;j<m && out.length<n;j++){
      const a=phase+TAU*j/m;
      out.push([Math.cos(a)*radii[r],Math.sin(a)*radii[r]]);
    }
  }
  return out;
}

/** Resting local position: essentially fixed, with only a tiny radial pulse. */
export function broodNucleusLocalPosition(nucleus, time, cellRadius, profile, count = 1, layoutIndex = null) {
  const i=layoutIndex==null ? Math.max(0,nucleus.index??0) : Math.max(0,layoutIndex);
  const layout=buildBroodNucleusLayout(Math.max(count,i+1),cellRadius,profile,nucleus.layoutSeed ?? 0);
  const base=layout[Math.min(i,layout.length-1)] ?? [0,0];
  const amp=Math.min(0.0012,cellRadius*0.0075);
  const pulse=Math.sin(time*0.55+nucleus.visualSeed*1.31)*amp;
  const len=Math.max(1e-6,Math.hypot(base[0],base[1]));
  return [base[0]+base[0]/len*pulse,base[1]+base[1]/len*pulse];
}

/**
 * Preserve each nucleus' own radial direction.  The child may move farther
 * outward after pinch-off to obtain collision clearance, but never sideways
 * to a different birth site.
 */
export function buildBroodTargetsFromStarts(starts, parentRadius, childRadius, padding = 0.010) {
  const targets=[];
  const minSep=childRadius*2+padding*2+0.004;
  const baseRadius=parentRadius+childRadius+padding+0.012;
  for(const start of starts){
    const len=Math.max(1e-6,Math.hypot(start[0],start[1]));
    const dir=[start[0]/len,start[1]/len];
    let radius=baseRadius;
    let candidate=[dir[0]*radius,dir[1]*radius];
    let guard=0;
    while(targets.some(p=>Math.hypot(candidate[0]-p[0],candidate[1]-p[1])<minSep) && guard<4096){
      radius+=minSep*0.72;
      candidate=[dir[0]*radius,dir[1]*radius];
      guard++;
    }
    targets.push(candidate);
  }
  return targets;
}


/**
 * Standard local pinch-off destinations for serial Brood divisions.  Unlike
 * buildBroodTargetsFromStarts(), these never push later daughters farther and
 * farther away just because N is large.  Every daughter uses the same short
 * Split-like release distance; world forces clear already-born cells while the
 * next lobe is forming.
 */
export function buildBroodSerialTargetsFromStarts(starts, parentRadius, childRadius, padding = 0.010) {
  const radius = parentRadius + childRadius + padding + 0.018;
  return starts.map(start => {
    const len=Math.max(1e-6,Math.hypot(start[0],start[1]));
    return [start[0]/len*radius,start[1]/len*radius];
  });
}

/**
 * Serial order that gives already-born daughters time to drift clear.  It
 * greedily chooses the direction farthest from every direction already used.
 * For a regular 8-way layout this yields an interleaved order similar to
 * 0,4,2,6,1,3,5,7 instead of walking around adjacent membrane sites.
 */
export function orderBroodSerialIndices(starts) {
  const n=starts.length;
  if(n<=1) return n?[0]:[];
  const angles=starts.map(p=>Math.atan2(p[1],p[0]));
  const remaining=new Set(Array.from({length:n},(_,i)=>i));
  const order=[];
  const circ=(a,b)=>{
    let d=Math.abs(a-b)%TAU;
    return Math.min(d,TAU-d);
  };
  let current=0;
  order.push(current); remaining.delete(current);
  while(remaining.size){
    let best=-1,bestScore=-1;
    for(const i of remaining){
      let minD=Infinity;
      for(const j of order) minD=Math.min(minD,circ(angles[i],angles[j]));
      if(minD>bestScore+1e-12){bestScore=minD;best=i;}
    }
    order.push(best); remaining.delete(best);
  }
  return order;
}

/**
 * Collision-safe child destinations after they have ALREADY pinched off.
 * These are not protrusion origins. Every protrusion starts locally at the
 * mother membrane, exactly as a local Split-Cell division would.
 */
export function buildBroodTargetOffsets(count, parentRadius, childRadius, padding = 0.010, seed = 0) {
  const result = [];
  const safe = childRadius * 2 + padding * 2 + 0.010;
  let ringRadius = parentRadius + childRadius + padding + 0.012;
  let index = 0;
  let ring = 0;
  while (index < count) {
    const ratio = Math.min(0.999999, safe / Math.max(safe + 1e-6, 2 * ringRadius));
    const capacity = Math.max(3, Math.floor(Math.PI / Math.asin(ratio)));
    const onRing = Math.min(capacity, count - index);
    const offset = seed * 0.47 + ring * GOLDEN_ANGLE * 0.63;
    for (let j = 0; j < onRing; j++) {
      const a = offset + TAU * j / onRing;
      result.push([Math.cos(a) * ringRadius, Math.sin(a) * ringRadius]);
      index++;
    }
    ring++;
    ringRadius += safe * 1.03;
  }
  return result;
}

export function broodOuterExtent(count, parentRadius, childRadius, padding = 0.010, seed = 0) {
  const offsets = buildBroodTargetOffsets(count, parentRadius, childRadius, padding, seed);
  let extent = parentRadius;
  for (const p of offsets) extent = Math.max(extent, Math.hypot(p[0], p[1]) + childRadius + padding);
  return extent;
}

/**
 * v0.8.4: a Brood birth starts directly from the nucleus' resting position.
 * There is no pre-division migration phase.  The Split-derived membrane and
 * the small nucleus begin changing together from that exact resting site.
 */
export function evaluateBroodStep({ bud, elapsed, parentRadius, divisionDuration = 3.10 }) {
  const divisionRaw=clamp01(elapsed/Math.max(0.001,divisionDuration));
  const start=bud.startLocal;
  const len=Math.max(1e-6,Math.hypot(start[0],start[1]));
  const dir=[start[0]/len,start[1]/len];
  return {
    stage:'division',
    migrationRaw:1,
    divisionRaw,
    dir,
    wallLocal:[...start],
    migratingNucleusLocal:[...start],
    complete:divisionRaw>=1,
  };
}
