const KEYS={
  foundations:'cellquation.core.v060.foundations.progress',
  network:'cellquation.core.v060.network.progress',
  threefoundations:'cellquation.core.v070.threefoundations.progress',
  threenetwork:'cellquation.core.v070.threenetwork.progress',
};
const LEGACY={
  foundations:['cellquation.core.progress','cellquation.core.v0.3.progress'],
  network:['cellquation.core.network.progress'],
  threefoundations:[],
  threenetwork:[],
};
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function parse(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function normalize(raw,campaign){
  const count=campaign.levels.length,p={version:1,unlocked:0,best:{}};
  if(raw&&typeof raw==='object'){
    p.unlocked=Number(raw.unlocked)||0;
    if(raw.best&&typeof raw.best==='object')p.best={...raw.best};
  }
  const idx=new Map(campaign.levels.map((l,i)=>[l.id,i]));
  let max=-1;
  for(const id of Object.keys(p.best))if(idx.has(id))max=Math.max(max,idx.get(id));
  if(max>=0)p.unlocked=Math.max(p.unlocked,max+1);
  p.unlocked=clamp(p.unlocked,0,Math.max(0,count-1));
  return p;
}
export function loadProgress(mode,campaign){
  let raw=parse(KEYS[mode]);
  if(!raw){for(const k of LEGACY[mode]||[]){raw=parse(k);if(raw)break}}
  const p=normalize(raw,campaign);saveProgress(mode,p);return p;
}
export function saveProgress(mode,p){localStorage.setItem(KEYS[mode],JSON.stringify({...p,version:1}));}
export function recordCompletion(mode,p,{levelId,levelIndex,moves,stars,levelCount}){
  const old=p.best[levelId];
  if(!old||moves<old.moves||(moves===old.moves&&stars>old.stars))p.best[levelId]={moves,stars};
  if(levelIndex<levelCount-1)p.unlocked=Math.max(p.unlocked,levelIndex+1);
  saveProgress(mode,p);
  try{sessionStorage.setItem('cellquation.menu.justCompleted.v1',JSON.stringify({campaign:mode,levelId,level:levelIndex+1,time:Date.now()}))}catch(_){ }
  return p;
}
export function totalStars(p){return Object.values(p.best||{}).reduce((s,v)=>s+(Number(v?.stars)||0),0)}
export function completedCount(p,campaign){return campaign.levels.reduce((n,l)=>n+(p.best[l.id]?1:0),0)}
export function worldStatus(p,campaign,world){
  const first=world.offset,last=world.offset+world.count-1;
  const completed=campaign.levels.slice(first,last+1).filter(l=>p.best[l.id]).length;
  return {unlocked:p.unlocked>=first,completed,count:world.count,stars:campaign.levels.slice(first,last+1).reduce((s,l)=>s+(p.best[l.id]?.stars||0),0)};
}
