import {clamp,smootherstep,add2,mul2,sub2,norm2,len2} from './math2d.js?v=synapse0.8.7';

export function pointOnSynapse(progress,ends,curve=0){
  const a=ends[0],b=ends[1],axis=norm2(sub2(b,a)),n=[-axis[1],axis[0]],len=Math.max(.001,len2(sub2(b,a))),half=len*.5;
  const qy=-half+clamp(progress)*len,u=Math.abs(qy)/half,x=curve*(1-Math.pow(u,1.45));
  const mid=[(a[0]+b[0])*.5,(a[1]+b[1])*.5];
  return add2(add2(mid,mul2(axis,qy)),mul2(n,x));
}

export function closestPointOnSynapse(world,ends,curve=0){
  // Deterministic sampled closest point + ternary refinement. Robust for the
  // gentle analytic bends used by the synapse and cheap for one transport cell.
  let bestT=0,bestPoint=pointOnSynapse(0,ends,curve),bestD=len2(sub2(world,bestPoint));
  const samples=64;
  for(let i=1;i<=samples;i++){
    const t=i/samples,p=pointOnSynapse(t,ends,curve),d=len2(sub2(world,p));
    if(d<bestD){bestT=t;bestPoint=p;bestD=d;}
  }
  let lo=Math.max(0,bestT-1/samples),hi=Math.min(1,bestT+1/samples);
  for(let k=0;k<7;k++){
    const t1=lo+(hi-lo)/3,t2=hi-(hi-lo)/3;
    const p1=pointOnSynapse(t1,ends,curve),p2=pointOnSynapse(t2,ends,curve);
    const d1=len2(sub2(world,p1)),d2=len2(sub2(world,p2));
    if(d1<=d2)hi=t2;else lo=t1;
  }
  bestT=(lo+hi)*.5;bestPoint=pointOnSynapse(bestT,ends,curve);bestD=len2(sub2(world,bestPoint));
  return {progress:bestT,point:bestPoint,distance:bestD};
}

export function pressureBulgeFromCell({position,scale,ends,curve=0,baseCellRadius,waist,endWidth,stage='transit',stageProgress=0}){
  const nearest=closestPointOnSynapse(position,ends,curve);
  const radius=Math.max(.001,baseCellRadius*Math.max(.10,scale));
  const membraneReach=Math.max(.034,waist*1.8,endWidth*.32);
  const influence=Math.max(.025,radius+membraneReach);
  let coupling=1-smootherstep(influence*.62,influence*1.50,nearest.distance);
  if(stage==='intake')coupling*=smootherstep(.30,.95,stageProgress);
  if(stage==='egress')coupling*=1-smootherstep(.48,.98,stageProgress);
  coupling=clamp(coupling);
  return {
    progress:nearest.progress,
    bulge:Math.max(0,scale*.78*coupling),
    coupling,
    distance:nearest.distance,
    nearestPoint:nearest.point,
  };
}
