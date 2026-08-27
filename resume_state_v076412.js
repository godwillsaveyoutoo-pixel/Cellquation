const KEY='cellquation.menu.resume.v1';
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function text(v){return v?.en||v?.nl||String(v||'')}
export function saveGameplayResume({colour,campaign,campaignLabel,level,index}){
  if(!level)return;const all=read();all[colour]={campaign,campaignLabel,level:index+1,world:(Number(level.world)||0)+1,local:(Number(level.local)||0)+1,title:text(level.title),time:Date.now()};localStorage.setItem(KEY,JSON.stringify(all));
}
