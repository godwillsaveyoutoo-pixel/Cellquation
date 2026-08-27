import {clamp} from './math2d.js?v=synapse0.8.7';

const EPS=1e-5;
export const CHANNEL_DEFAULTS=Object.freeze({
  cellDx:0,cellDy:0,cellScaleMul:1,
  bulgeProgressOffset:0,bulgeScaleMul:1,
  mouthAOffset:0,mouthBOffset:0,
});
export const ABSOLUTE_CHANNEL_DEFAULTS=Object.freeze({cellX:0,cellY:0,cellScale:1,mouthAX:0,mouthAY:0,mouthBX:0,mouthBY:0});
const CORRECTION_KEYS=Object.keys(CHANNEL_DEFAULTS);
const ABSOLUTE_KEYS=Object.keys(ABSOLUTE_CHANNEL_DEFAULTS);
const ALL_KEYS=new Set([...CORRECTION_KEYS,...ABSOLUTE_KEYS]);

export const KEY_GROUP_CHANNELS=Object.freeze({
  cellPosition:Object.freeze(['cellX','cellY']),
  cellScale:Object.freeze(['cellScale']),
  synapse:Object.freeze(['mouthAX','mouthAY','mouthBX','mouthBY']),
  bulge:Object.freeze(['bulgeProgressOffset','bulgeScaleMul']),
});

function sameTime(a,b){return Math.abs(a-b)<EPS;}
function cloneFrame(f){return {time:f.time,values:{...f.values},auto:{...(f.auto||{})}};}
function sortedUnique(values){return [...new Set(values.map(v=>Number(v.toFixed(6))))].sort((a,b)=>a-b);}
function finiteNumber(value){const n=Number(value);return value!==null&&value!==''&&Number.isFinite(n)?n:null;}

function monotoneCubic(points,x){
  if(!points.length)return 0;
  if(points.length===1)return points[0][1];
  if(x<=points[0][0])return points[0][1];
  if(x>=points.at(-1)[0])return points.at(-1)[1];
  const n=points.length;
  const h=[],d=[],m=new Array(n).fill(0);
  for(let i=0;i<n-1;i++){
    h[i]=Math.max(EPS,points[i+1][0]-points[i][0]);
    d[i]=(points[i+1][1]-points[i][1])/h[i];
  }
  m[0]=d[0];m[n-1]=d[n-2];
  for(let i=1;i<n-1;i++){
    if(d[i-1]*d[i]<=0){m[i]=0;continue;}
    const w1=2*h[i]+h[i-1],w2=h[i]+2*h[i-1];
    m[i]=(w1+w2)/(w1/d[i-1]+w2/d[i]);
  }
  let i=0;while(i<n-2&&x>points[i+1][0])i++;
  const t=clamp((x-points[i][0])/h[i]);
  const t2=t*t,t3=t2*t;
  const h00=2*t3-3*t2+1,h10=t3-2*t2+t,h01=-2*t3+3*t2,h11=t3-t2;
  return h00*points[i][1]+h10*h[i]*m[i]+h01*points[i+1][1]+h11*h[i]*m[i+1];
}

export class AnimationKeyframes{
  constructor(){this.frames=[];this.stageBounds=[0,1];}
  setStageBounds(bounds){this.stageBounds=sortedUnique([0,...bounds.map(v=>clamp(v)),1]);}
  clear(){this.frames=[];}
  serialize(){return {schema:'cellkit-synapse-animation-keys',version:2,frames:this.frames.map(cloneFrame)};}
  load(data){
    const frames=Array.isArray(data?.frames)?data.frames:[];
    this.frames=frames.map(f=>{
      const values={},auto={};
      for(const [key,value] of Object.entries(f?.values||{})){
        if(!ALL_KEYS.has(key))continue;
        const n=finiteNumber(value);if(n===null)continue;
        values[key]=n;auto[key]=Boolean(f?.auto?.[key]);
      }
      return {time:clamp(Number(f?.time)||0),values,auto};
    }).filter(f=>Object.keys(f.values).length).sort((a,b)=>a.time-b.time);
  }
  frameAt(time,create=false){
    time=clamp(time);
    let f=this.frames.find(k=>sameTime(k.time,time));
    if(!f&&create){f={time,values:{},auto:{}};this.frames.push(f);this.frames.sort((a,b)=>a.time-b.time);}
    return f||null;
  }
  nearestStageBounds(time){
    time=clamp(time);let prev=0,next=1;
    for(const b of this.stageBounds){if(b<=time+EPS)prev=b;if(b>time+EPS){next=b;break;}}
    return [prev,next];
  }
  ensureLocalAnchors(channel,time){
    const [prev,next]=this.nearestStageBounds(time);
    const neutral=CHANNEL_DEFAULTS[channel];
    for(const b of [prev,next]){
      const f=this.frameAt(b,true);
      if(!(channel in f.values)){f.values[channel]=neutral;f.auto[channel]=true;}
    }
  }
  set(channel,time,value,{autoKey=true}={}){
    if(!ALL_KEYS.has(channel))return;
    time=clamp(time);
    if(autoKey&&channel in CHANNEL_DEFAULTS)this.ensureLocalAnchors(channel,time);
    const n=finiteNumber(value);if(n===null)return;
    const f=this.frameAt(time,true);
    f.values[channel]=n;
    f.auto[channel]=false;
  }
  setMany(time,values,opts={}){for(const [k,v] of Object.entries(values))this.set(k,time,v,opts);}
  removeAuthoredAt(time){
    const f=this.frameAt(time,false);if(!f)return false;
    let removed=false;
    for(const k of Object.keys(f.values))if(!f.auto?.[k]){delete f.values[k];removed=true;}
    for(const k of Object.keys(f.auto||{}))if(!Object.prototype.hasOwnProperty.call(f.values,k))delete f.auto[k];
    this.frames=this.frames.filter(fr=>Object.keys(fr.values).length);
    return removed;
  }
  removeAuthoredChannelsAt(time,channels){
    const f=this.frameAt(time,false);if(!f)return false;
    let removed=false;
    for(const k of channels){
      if(k in f.values&&!f.auto?.[k]){delete f.values[k];delete f.auto?.[k];removed=true;}
    }
    this.frames=this.frames.filter(fr=>Object.keys(fr.values).length);
    return removed;
  }
  authoredTimesForChannels(channels){
    const wanted=new Set(channels);
    return sortedUnique(this.frames.filter(f=>Object.keys(f.values).some(k=>wanted.has(k)&&!f.auto?.[k])).map(f=>f.time));
  }
  hasAuthoredChannelsAt(time,channels){
    const f=this.frameAt(time,false);if(!f)return false;
    return channels.some(k=>k in f.values&&!f.auto?.[k]);
  }
  pointsFor(channel,{authoredOnly=false}={}){
    const points=[];
    for(const f of this.frames){
      if(!(channel in f.values))continue;
      if(authoredOnly&&f.auto?.[channel])continue;
      const n=finiteNumber(f.values[channel]);if(n===null)continue;
      points.push([f.time,n]);
    }
    return points;
  }
  evaluateChannel(channel,time){
    const neutral=CHANNEL_DEFAULTS[channel];
    const points=this.pointsFor(channel);
    if(!points.length)return neutral;
    if(points[0][0]>EPS)points.unshift([0,neutral]);
    if(points.at(-1)[0]<1-EPS)points.push([1,neutral]);
    return monotoneCubic(points,clamp(time));
  }
  evaluate(time){
    const out={};for(const k of CORRECTION_KEYS)out[k]=this.evaluateChannel(k,time);return out;
  }
  evaluateAuthored(channel,time,fallback){
    const points=this.pointsFor(channel,{authoredOnly:true});
    if(points.length>=2){
      const first=points[0][0],last=points.at(-1)[0];
      if(time>=first-EPS&&time<=last+EPS)return monotoneCubic(points,clamp(time));
      return fallback;
    }
    if(points.length===1&&sameTime(time,points[0][0]))return points[0][1];
    return fallback;
  }
  evaluateCellScale(time,baseScale){
    const corr=this.evaluate(time);
    return this.evaluateAuthored('cellScale',time,baseScale*corr.cellScaleMul);
  }
  evaluateCell(time,basePosition,baseScale){
    const corr=this.evaluate(time);
    const fallbackPos=[basePosition[0]+corr.cellDx,basePosition[1]+corr.cellDy];
    return {
      position:[
        this.evaluateAuthored('cellX',time,fallbackPos[0]),
        this.evaluateAuthored('cellY',time,fallbackPos[1]),
      ],
      scale:this.evaluateCellScale(time,baseScale),
      corrections:corr,
    };
  }

  evaluateMouth(side,time,basePosition){
    const prefix=side==='A'?'mouthA':'mouthB';
    const fallback=[...basePosition];
    return [
      this.evaluateAuthored(`${prefix}X`,time,fallback[0]),
      this.evaluateAuthored(`${prefix}Y`,time,fallback[1]),
    ];
  }
  authoredTimes(){
    return sortedUnique(this.frames.filter(f=>Object.keys(f.values).some(k=>!f.auto?.[k])).map(f=>f.time));
  }
  hasAuthoredAt(time){const f=this.frameAt(time,false);return !!f&&Object.keys(f.values).some(k=>!f.auto?.[k]);}
}
