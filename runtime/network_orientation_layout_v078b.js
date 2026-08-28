// Cellquation v0.7.8b — Living Networks dual-orientation layout optimizer.
// Presentation only: gameplay topology, node indices and authored edge bends are unchanged.

const EPS=1e-6;

function median(values){
  if(!values.length)return 1;
  const a=[...values].sort((x,y)=>x-y);
  return a[Math.floor(a.length/2)]||1;
}
function center(points){
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const cx=(Math.min(...xs)+Math.max(...xs))/2;
  const cy=(Math.min(...ys)+Math.max(...ys))/2;
  return points.map(([x,y])=>[x-cx,y-cy]);
}
function bounds(points){
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const [x,y] of points){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
  return {minX,maxX,minY,maxY,width:Math.max(EPS,maxX-minX),height:Math.max(EPS,maxY-minY)};
}
function quarterTurn(points){return points.map(([x,y])=>[y,-x])}
function stretch(points,sx,sy){return points.map(([x,y])=>[x*sx,y*sy])}
function inferFamily(authored,levelId=''){
  const explicit=String(authored?.compositionFamily||'').trim();
  if(explicit)return explicit;
  const id=String(levelId).toLowerCase();
  for(const key of ['double_loop','bridge','ladder','chain','loop','tree','asym'])if(id.includes(key))return key;
  if(/(?:^|[-_])y[_-]/.test(id)||id.includes('-y_'))return 'fork';
  return 'generic';
}
function stretchCap(family,orientation){
  // Orientation-specific composition, not just scale-to-fit. Landscape may turn
  // circles into calm ellipses and open chains/forks laterally; portrait may do
  // the inverse. These caps are deliberately broader than the old portrait-only
  // 1.32 stretch because the goal is full use of both screen shapes.
  const landscape={
    chain:2.20,chain6:2.20,bottleneck7:2.10,
    fork:1.85,fork6:1.85,tree:1.85,asym:1.72,
    loop:1.72,loop_tail7:1.82,double_loop:1.72,double_loop8:1.72,
    ring6:1.62,hub7:1.58,diamond6:1.70,
    bridge:1.45,ladder:1.48,twin_route8:1.48,generic:1.82
  };
  const portrait={
    chain:1.78,chain6:1.78,bottleneck7:1.72,
    fork:1.55,fork6:1.55,tree:1.58,asym:1.50,
    loop:1.48,loop_tail7:1.52,double_loop:1.48,double_loop8:1.48,
    ring6:1.38,hub7:1.38,diamond6:1.48,
    bridge:1.58,ladder:1.52,twin_route8:1.52,generic:1.55
  };
  const table=orientation==='landscape'?landscape:portrait;
  return Math.max(1,Number(table[family]||table.generic));
}
function rotationPenalty(family){
  // Radial/symmetric structures gain little from arbitrary turning; everything
  // else may rotate freely when it better matches the screen's shape.
  return ['ring6','hub7','diamond6'].includes(family)?0.055:0.0;
}
function aspectError(points,targetAspect,rotated,family){
  const b=bounds(points),ratio=b.width/b.height;
  const err=Math.abs(Math.log(Math.max(EPS,ratio)/Math.max(EPS,targetAspect)));
  return err+(rotated?rotationPenalty(family):0);
}
function chooseOrientation(points,targetAspect,family){
  const original=center(points),rotated=center(quarterTurn(points));
  const a=aspectError(original,targetAspect,false,family);
  const b=aspectError(rotated,targetAspect,true,family);
  return b+0.015<a?{points:rotated,rotated:true}:{points:original,rotated:false};
}
function adaptAspect(points,targetAspect,family,orientation){
  const b=bounds(points),ratio=b.width/b.height,cap=stretchCap(family,orientation);
  let sx=1,sy=1;
  // Balance the reshape around 1 instead of only stretching the spare axis.
  // This is what actually makes a portrait-authored Y/tree usable in a short
  // landscape stage: it opens laterally *and* gently flattens vertically.
  if(ratio<targetAspect){
    const q=Math.min(cap,Math.sqrt(targetAspect/Math.max(EPS,ratio)));
    sx=q;sy=1/q;
  }else if(ratio>targetAspect){
    const q=Math.min(cap,Math.sqrt(ratio/Math.max(EPS,targetAspect)));
    sx=1/q;sy=q;
  }
  return {points:center(stretch(points,sx,sy)),sx,sy};
}
function dynamicMinView(nodeCount,orientation){
  // The old fixed 1.18 landscape floor was the main reason small networks became
  // tiny islands in wide screens. Keep a safe camera floor, but let small graphs
  // actually occupy the available stage.
  if(nodeCount<=4)return orientation==='landscape'?0.80:0.82;
  if(nodeCount<=6)return orientation==='landscape'?0.88:0.90;
  if(nodeCount<=8)return orientation==='landscape'?0.95:0.96;
  return orientation==='landscape'?1.03:1.02;
}
function orientationFromViewport(viewportWidth,viewportHeight,stageAspect){
  if(viewportWidth>0&&viewportHeight>0&&Math.abs(viewportWidth-viewportHeight)>2)return viewportHeight>=viewportWidth?'portrait':'landscape';
  return stageAspect<=1?'portrait':'landscape';
}


function portraitAuthoredLayout(points,stageAspect,authored,family){
  // Preserve the portrait presentation that was already deliberately tuned in
  // v0.7.2–v0.7.7. The v0.7.8b job is not to throw that work away; it only fixes
  // portrait detection and spends genuinely unused vertical room.
  let out=center(points);
  const padX=.22,padY=.20,minView=1.04,cameraPad=1.025;
  let b=bounds(out),maxX=Math.max(Math.abs(b.minX),Math.abs(b.maxX))+padX;
  const rawMaxY=Math.max(Math.abs(b.minY),Math.abs(b.maxY));
  const widthScale=Math.max(minView,maxX*2)*cameraPad;
  if(rawMaxY>.001){
    const availableHalfY=widthScale/(2*stageAspect)-padY;
    const familyCaps={twin_route8:1.55,diamond6:1.35,fork6:1.16,ring6:1.10,hub7:1.08,loop_tail7:1.06,double_loop8:1.05,bottleneck7:1.05,chain6:1.03};
    const cap=authored?.compositionFamily
      ?Math.max(Number(authored?.portraitYStretchMax||1),Number(familyCaps[family]||1))
      :1.32;
    const yStretch=Math.max(1,Math.min(cap,availableHalfY/rawMaxY));
    out=center(stretch(out,1,yStretch));
  }
  b=bounds(out);maxX=Math.max(Math.abs(b.minX),Math.abs(b.maxX))+padX;
  const maxY=Math.max(Math.abs(b.minY),Math.abs(b.maxY))+padY;
  const halfWidthFactor=Math.max(1,stageAspect),halfHeightFactor=Math.max(1,1/stageAspect);
  const neededScaleX=(maxX*2)/halfWidthFactor,neededScaleY=(maxY*2)/halfHeightFactor;
  return {points:out,viewScale:Math.max(minView,neededScaleX,neededScaleY)*cameraPad};
}

export function optimizeNetworkLayout({
  authoredPoints,
  edges,
  authored=null,
  levelId='',
  stageWidth,
  stageHeight,
  viewportWidth,
  viewportHeight,
  transportScale=0,
  targetMedianWorldLength=.84,
  cellRadius=.155,
  wobbleRadius=.018
}){
  const source=(authoredPoints||[]).map(p=>[Number(p.x??p[0]??0),Number(p.y??p[1]??0)]);
  const edgeList=Array.isArray(edges)?edges:[];
  const lengths=edgeList.map(([a,b])=>Math.hypot(source[b][0]-source[a][0],source[b][1]-source[a][1])).filter(Number.isFinite);
  const authoredMedian=median(lengths)||150;
  const sourceNodeCount=source.length;
  const family=inferFamily(authored,levelId);
  const safeW=Math.max(1,Number(stageWidth)||1),safeH=Math.max(1,Number(stageHeight)||1);
  const stageAspect=Math.max(.25,safeW/safeH);
  const orientation=orientationFromViewport(Number(viewportWidth)||0,Number(viewportHeight)||0,stageAspect);
  // Portrait keeps the already hand-tuned authored spacing. Landscape compacts
  // dense graphs because its playfield is much shallower and then recomposes them
  // horizontally. This preserves portrait quality instead of trading it away.
  let densityFactor=1;
  if(orientation==='landscape'){
    densityFactor=sourceNodeCount>=10?.78:sourceNodeCount===9?.84:sourceNodeCount===8?.92:1;
    if(family==='fork'&&sourceNodeCount>=8)densityFactor*=.88;
    densityFactor=Math.max(.70,densityFactor);
  }
  const worldScale=Number(transportScale)||(Number(targetMedianWorldLength||.84)*densityFactor)/authoredMedian;
  // Match the renderer's y-up world convention before orientation optimization.
  let world=center(source.map(([x,y])=>[x*worldScale,-y*worldScale]));

  if(orientation==='portrait'){
    const portrait=portraitAuthoredLayout(world,stageAspect,authored,family);
    world=portrait.points;
    const finalBounds=bounds(world),worldCapacityW=portrait.viewScale*Math.max(1,stageAspect),worldCapacityH=portrait.viewScale*Math.max(1,1/stageAspect);
    const fitPx=Math.min(safeW,safeH);
    return {points:world,viewScale:portrait.viewScale,metrics:{orientation,family,rotated:false,stretchX:1,stretchY:finalBounds.height/Math.max(EPS,bounds(center(source.map(([x,y])=>[x*worldScale,-y*worldScale]))).height),stageAspect,fillX:finalBounds.width/worldCapacityW,fillY:finalBounds.height/worldCapacityH,cellDiameterPx:2*cellRadius/portrait.viewScale*fitPx,nodeCount:sourceNodeCount}};
  }

  const choice=chooseOrientation(world,stageAspect,family);
  const adapted=adaptAspect(choice.points,stageAspect,family,orientation);
  world=adapted.points;

  // Padding includes the visible membrane + the tuned idle wobble. Node count adds
  // a small comfort margin for dense graphs without shrinking small graphs globally.
  const nodeCount=world.length;
  const densityPad=nodeCount>=10?.07:nodeCount>=8?.045:nodeCount>=6?.025:0;
  const membranePad=Math.max(.19,cellRadius*1.30+wobbleRadius*1.25);
  const padX=membranePad+densityPad+(orientation==='landscape'?.015:.025);
  const padY=membranePad+densityPad+(orientation==='portrait'?.015:.025);
  const b=bounds(world);
  const maxX=Math.max(Math.abs(b.minX),Math.abs(b.maxX))+padX;
  const maxY=Math.max(Math.abs(b.minY),Math.abs(b.maxY))+padY;

  // Renderer world bounds: on wide canvases horizontal capacity grows with aspect;
  // on tall canvases vertical capacity grows with 1/aspect.
  const halfWidthFactor=Math.max(1,stageAspect);
  const halfHeightFactor=Math.max(1,1/stageAspect);
  const neededScaleX=(maxX*2)/halfWidthFactor;
  const neededScaleY=(maxY*2)/halfHeightFactor;
  const minView=dynamicMinView(nodeCount,orientation);
  const cameraPad=orientation==='landscape'?1.025:1.02;
  const viewScale=Math.max(minView,neededScaleX,neededScaleY)*cameraPad;

  const finalBounds=bounds(world);
  const worldCapacityW=viewScale*halfWidthFactor;
  const worldCapacityH=viewScale*halfHeightFactor;
  const fillX=finalBounds.width/worldCapacityW;
  const fillY=finalBounds.height/worldCapacityH;
  const fitPx=Math.min(safeW,safeH);
  const cellDiameterPx=2*cellRadius/viewScale*fitPx;

  return {
    points:world,
    viewScale,
    metrics:{
      orientation,family,rotated:choice.rotated,
      stretchX:adapted.sx,stretchY:adapted.sy,
      stageAspect,fillX,fillY,cellDiameterPx,nodeCount
    }
  };
}
