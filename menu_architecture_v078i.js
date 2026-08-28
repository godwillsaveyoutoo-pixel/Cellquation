import {loadProgress,totalStars,completedCount,worldStatus} from './progress_v060.js?v=0.7.7a.7';

const CAMPAIGNS={
  foundations:{colour:'two',label:'FOUNDATIONS',modeLabel:'2 COLOUR',path:'./content/runtime/FOUNDATIONS_30_RUNTIME.json',browser:'foundations.html',play:'play.html',tutorial:'tutorial.html?mode=2f',accent:'foundation',icon:'foundation'},
  network:{colour:'two',label:'LIVING NETWORKS',modeLabel:'2 COLOUR',path:'./content/runtime/LIVING_NETWORKS_48_V28_RUNTIME.json',browser:'living.html',play:'living_play.html',accent:'network',icon:'network'},
  threefoundations:{colour:'three',label:'FOUNDATIONS',modeLabel:'3 COLOUR',path:'./content/threecolor/FOUNDATIONS_FULL_30_V071.json',browser:'threecolor_foundations.html',play:'threecolor_play.html',tutorial:'tutorial.html?mode=3f',accent:'three',icon:'foundation'},
  threenetwork:{colour:'three',label:'LIVING NETWORKS',modeLabel:'3 COLOUR',path:'./content/threecolor/LIVING_NETWORKS_FULL_48_V071.json',browser:'threecolor_living.html',play:'threecolor_living_play.html',accent:'network',icon:'network'},
};
const DATA_CACHE=new Map();
const RESUME_KEY='cellquation.menu.resume.v1';
const SWIPE_SEEN_KEY='cellquation.menu.worldSwipeSeen.v1';
const WORLD_KEY_PREFIX='cellquation.menu.world.';
const SCROLL_KEY_PREFIX='cellquation.menu.scroll.';
const JUST_COMPLETED_KEY='cellquation.menu.justCompleted.v1';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

async function getCampaign(key){
  if(DATA_CACHE.has(key))return DATA_CACHE.get(key);
  const cfg=CAMPAIGNS[key];
  const c=await fetch(cfg.path).then(r=>{if(!r.ok)throw new Error(`Could not load ${cfg.path}`);return r.json()});
  DATA_CACHE.set(key,c);return c;
}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
function href(a,url){a.href=url;return a}
function pct(n,d){return d?Math.max(0,Math.min(100,n/d*100)):0}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function titleText(v){return v?.en||v?.nl||String(v||'')}
function ratioNode(goal){
  const r=el('div','cq-ratio');
  const species=['blue','green','violet'];
  (goal||[]).forEach((v,i)=>{
    if(i){const colon=el('span','cq-ratio__colon',':');colon.setAttribute('aria-hidden','true');r.append(colon)}
    const sp=species[i]||'blue',part=el('span',`cq-ratio__part cq-ratio__cell is-${sp}`);
    const img=document.createElement('img');img.src=`assets/ui/hud_goal_${sp}.png?v=0.7.7a.8`;img.alt='';img.decoding='async';img.draggable=false;
    const value=el('strong','cq-ratio__value',String(v));part.append(img,value);r.append(part);
  });
  return r;
}
function progressBar(value){const b=el('div','cq-progress'),i=document.createElement('i');i.style.width=`${value.toFixed(2)}%`;b.append(i);return b}
function cardArt(kind,colour){
  return `<canvas class="cq-campaign-mini" data-mini-kind="${kind}" data-mini-colour="${colour}" aria-hidden="true"></canvas>`;
}
function card({url,accent='foundation',icon='foundation',colour='two',kicker,title,desc,meta=[],progress=0}){
  const a=href(el('a','cq-card'),url);a.dataset.accent=accent;const ic=el('div','cq-card__icon');ic.innerHTML=cardArt(icon,colour);a.append(ic);
  const copy=el('div','cq-card__copy');copy.append(el('div','cq-card__kicker',kicker),el('div','cq-card__title',title));if(desc)copy.append(el('div','cq-card__desc',desc));
  const m=el('div','cq-card__meta');meta.forEach(x=>m.append(el('span','',x)));copy.append(m,progressBar(progress));a.append(copy,el('div','cq-card__chev','›'));return a;
}
async function totals(key){const c=await getCampaign(key),p=loadProgress(key,c);return {campaign:c,progress:p,done:completedCount(p,c),stars:totalStars(p),total:c.levels.length}}
function normalizeMode(raw){return raw==='3'||raw==='three'?'three':'two'}
function modeQuery(colour){return colour==='three'?'3':'2'}
function campaignKeys(colour){return colour==='three'?['threefoundations','threenetwork']:['foundations','network']}
function storedWorld(key,count){return clamp(Number(localStorage.getItem(WORLD_KEY_PREFIX+key))||1,1,Math.max(1,count))}
function browserUrl(key,count){return `${CAMPAIGNS[key].browser}?world=${storedWorld(key,count)}`}
function loadResume(){try{return JSON.parse(localStorage.getItem(RESUME_KEY)||'{}')||{}}catch{return {}}}
function saveResume(colour,value){const all=loadResume();all[colour]=value;localStorage.setItem(RESUME_KEY,JSON.stringify(all))}
function coarsePointer(){return matchMedia('(pointer: coarse)').matches}
function loadJustCompleted(){
  try{
    const v=JSON.parse(sessionStorage.getItem(JUST_COMPLETED_KEY)||'null');
    if(!v||Date.now()-Number(v.time||0)>10*60*1000){sessionStorage.removeItem(JUST_COMPLETED_KEY);return null}
    return v;
  }catch{return null}
}

async function home(){
  const root=document.getElementById('campaignChoices'),toggle=document.getElementById('colourToggle');if(!root||!toggle)return;
  const qs=new URL(location.href).searchParams;
  let colour=normalizeMode(qs.get('mode')||localStorage.getItem('cellquation.menu.colour')||'two');
  const main=document.querySelector('.cq-shell'),modeMeta=document.getElementById('modeMeta'),tutorial=document.getElementById('tutorialAction'),continueAction=document.getElementById('continueAction');
  const data={},pending=new Map();
  async function ensureColour(c){
    const keys=campaignKeys(c);
    await Promise.all(keys.map(k=>{
      if(data[k])return data[k];
      if(!pending.has(k))pending.set(k,totals(k).then(v=>(data[k]=v,pending.delete(k),v)));
      return pending.get(k);
    }));
  }
  function drawContinue(){
    if(!continueAction)return;
    const resume=loadResume()[colour],cfg=resume&&CAMPAIGNS[resume.campaign],resumeData=resume&&data[resume.campaign];
    const resumeLevel=resumeData?.campaign?.levels?.[Number(resume?.level)-1],alreadyComplete=!!(resumeLevel&&resumeData?.progress?.best?.[resumeLevel.id]);
    if(!resume||!cfg||cfg.colour!==colour||alreadyComplete){continueAction.hidden=true;continueAction.removeAttribute('href');continueAction.replaceChildren();return}
    continueAction.hidden=false;continueAction.href=`${cfg.play}?level=${resume.level}`;continueAction.setAttribute('aria-label',`Continue ${resume.campaignLabel}, World ${resume.world}, Level ${resume.local}: ${resume.title||'last played level'}`);
    const icon=el('span','cq-continue__play','▶'),copy=el('span','cq-continue__copy'),kicker=el('span','cq-continue__kicker','CONTINUE');
    const strong=el('strong','cq-continue__title',`${resume.campaignLabel} · W${resume.world} · L${String(resume.local).padStart(2,'0')}`);
    const sub=el('span','cq-continue__sub',resume.title||'Last played level');copy.append(kicker,strong,sub);continueAction.replaceChildren(icon,copy,el('span','cq-continue__chev','›'));
  }
  function draw(){
    localStorage.setItem('cellquation.menu.colour',colour);main.dataset.colour=colour;
    toggle.querySelectorAll('button').forEach(b=>{const active=b.dataset.colour===colour;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});
    const [fk,nk]=campaignKeys(colour),f=data[fk],n=data[nk],three=colour==='three';if(!f||!n)return;
    if(modeMeta)modeMeta.textContent=three?'3 COLOUR · EXPERT SYSTEM':'2 COLOUR · CLASSIC SYSTEM';
    root.replaceChildren(
      card({url:browserUrl(fk,f.campaign.worlds.length),accent:three?'three':'foundation',icon:'foundation',colour:three?'three':'two',kicker:`${f.campaign.worlds.length} WORLDS · ${f.total} LEVELS`,title:'Foundations',desc:three?'Three-colour puzzles in free space.':'Learn the cell actions in free space.',meta:[`${f.done}/${f.total} complete · ${f.stars} ★`],progress:pct(f.done,f.total)}),
      card({url:browserUrl(nk,n.campaign.worlds.length),accent:'network',icon:'network',colour:three?'three':'two',kicker:`${n.campaign.worlds.length} WORLDS · ${n.total} LEVELS`,title:'Living Networks',desc:three?'Three colours inside connected systems.':'Connected puzzles where routes matter.',meta:[`${n.done}/${n.total} complete · ${n.stars} ★`],progress:pct(n.done,n.total)})
    );
    if(tutorial){tutorial.href=CAMPAIGNS[fk].tutorial;tutorial.textContent=three?'3 Colour Foundations tutorial':'2 Colour Foundations tutorial'}
    drawContinue();
    const u=new URL(location.href);u.searchParams.set('mode',modeQuery(colour));history.replaceState(null,'',u);
  }
  await ensureColour(colour);draw();
  toggle.addEventListener('click',async e=>{
    const b=e.target.closest('button[data-colour]');if(!b||b.dataset.colour===colour)return;
    const next=b.dataset.colour;root.setAttribute('aria-busy','true');colour=next;main.dataset.colour=colour;
    toggle.querySelectorAll('button').forEach(x=>{const active=x.dataset.colour===colour;x.classList.toggle('is-active',active);x.setAttribute('aria-pressed',String(active))});
    await ensureColour(colour);root.removeAttribute('aria-busy');draw();
  });
  const other=colour==='two'?'three':'two';
  const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,500));idle(()=>ensureColour(other).catch(()=>{}));
}

function worldTab(w,i,s,active){
  const b=el('button',`cq-world-tab${active?' is-active':''}`);b.type='button';b.id=`cq-world-tab-${i+1}`;b.dataset.world=String(i+1);b.setAttribute('aria-selected',String(active));b.setAttribute('aria-controls','worldPager');b.setAttribute('aria-label',`World ${i+1}: ${titleText(w.title)}. ${s.completed} of ${w.count} complete`);b.setAttribute('role','tab');b.tabIndex=active?0:-1;
  b.append(el('span','cq-world-tab__number',`W${i+1}`),el('span','cq-world-tab__status',s.completed>=w.count?'✓':s.completed>0?'•':''));return b;
}
async function browser(){
  const key=document.body.dataset.campaign,cfg=CAMPAIGNS[key],levelGrid=document.getElementById('levelGrid'),worldTabs=document.getElementById('worldTabs'),pager=document.getElementById('worldPager'),swipeHint=document.getElementById('swipeHint');if(!cfg||!levelGrid||!worldTabs||!pager)return;
  const c=await getCampaign(key),p=loadProgress(key,c),main=document.querySelector('.cq-shell'),url=new URL(location.href),statuses=c.worlds.map(x=>worldStatus(p,c,x));
  const stored=storedWorld(key,c.worlds.length),requested=Number(url.searchParams.get('world'))||stored;
  let wi=clamp(requested-1,0,c.worlds.length-1),suppressClickUntil=0,refFromPlay=null,justCompleted=loadJustCompleted();
  try{
    const ref=new URL(document.referrer||'',location.href);
    if(ref.origin===location.origin&&ref.pathname.endsWith('/'+cfg.play)){
      refFromPlay=ref;const levelNumber=clamp(Number(ref.searchParams.get('level'))||1,1,c.levels.length),l=c.levels[levelNumber-1];
      if(l)saveResume(cfg.colour,{campaign:key,campaignLabel:cfg.label==='FOUNDATIONS'?'Foundations':'Living Networks',level:levelNumber,world:l.world+1,local:l.local+1,title:titleText(l.title),time:Date.now()});
    }
  }catch(_){ }
  main.dataset.colour=cfg.colour;main.dataset.accent=cfg.accent;
  document.getElementById('backLink').href=`home.html?mode=${modeQuery(cfg.colour)}`;
  document.getElementById('campaignKicker').textContent=`${cfg.modeLabel} · ${c.worlds.length} WORLDS`;
  document.getElementById('campaignTitle').textContent=cfg.label;
  document.getElementById('campaignProgress').textContent=`${completedCount(p,c)}/${c.levels.length} levels`;
  const worldIntroEl=document.getElementById('worldIntro');
  let ratioPrimer=document.getElementById('ratioPrimer');
  if(worldIntroEl&&!ratioPrimer){ratioPrimer=el('div','cq-ratio-primer');ratioPrimer.id='ratioPrimer';worldIntroEl.insertAdjacentElement('afterend',ratioPrimer)}
  worldTabs.style.setProperty('--cq-world-count',String(c.worlds.length));
  const fragTabs=document.createDocumentFragment();c.worlds.forEach((x,i)=>fragTabs.append(worldTab(x,i,statuses[i],i===wi)));worldTabs.replaceChildren(fragTabs);
  const tabButtons=[...worldTabs.querySelectorAll('.cq-world-tab')];

  function centerActiveTab(animate=true){
    const active=tabButtons[wi];if(!active)return;
    const left=active.offsetLeft-(worldTabs.clientWidth-active.offsetWidth)/2;
    worldTabs.scrollTo({left:Math.max(0,left),behavior:animate&&!reducedMotion?'smooth':'auto'});
  }
  function updateTabs(){
    tabButtons.forEach((b,i)=>{const active=i===wi;b.classList.toggle('is-active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});
    pager.setAttribute('aria-labelledby',`cq-world-tab-${wi+1}`);centerActiveTab(true);
  }
  function rememberLevel(global,local,l){
    saveResume(cfg.colour,{campaign:key,campaignLabel:cfg.label==='FOUNDATIONS'?'Foundations':'Living Networks',level:global+1,world:wi+1,local:local+1,title:titleText(l.title),time:Date.now()});
    sessionStorage.setItem(SCROLL_KEY_PREFIX+key,JSON.stringify({world:wi+1,y:scrollY,time:Date.now()}));
  }
  function animateWorldIn(direction){
    if(reducedMotion||!direction)return;
    pager.classList.remove('cq-enter-from-left','cq-enter-from-right');void pager.offsetWidth;
    pager.classList.add(direction>0?'cq-enter-from-right':'cq-enter-from-left');
    setTimeout(()=>pager.classList.remove('cq-enter-from-left','cq-enter-from-right'),190);
  }
  function drawWorld(push=false,direction=0){
    const w=c.worlds[wi],ls=c.levels.slice(w.offset,w.offset+w.count),resume=loadResume()[cfg.colour];
    localStorage.setItem(WORLD_KEY_PREFIX+key,String(wi+1));updateTabs();
    document.getElementById('worldKicker').textContent=`WORLD ${wi+1} · ${ls.length} LEVELS`;
    document.getElementById('worldTitle').textContent=titleText(w.title);
    document.getElementById('worldIntro').textContent=titleText(w.intro)||titleText(w.theme);
    if(ratioPrimer){
      const firstLearningMoment=wi===0&&completedCount(p,c)===0;
      ratioPrimer.hidden=!firstLearningMoment;
      if(firstLearningMoment){
        ratioPrimer.innerHTML=cfg.colour==='three'?'<strong>Proportion, not total:</strong> 1 : 2 : 1 also matches 2 : 4 : 2.' : '<strong>Proportion, not total:</strong> 1 : 2 also matches 2 : 4 or 3 : 6.';
      }
    }
    const stars=ls.reduce((s,l)=>s+(p.best[l.id]?.stars||0),0),done=ls.filter(l=>p.best[l.id]).length;
    document.getElementById('worldProgress').textContent=`${done}/${ls.length} complete · ${stars}/${ls.length*3} ★`;
    pager.setAttribute('aria-label',`World ${wi+1} of ${c.worlds.length}: ${titleText(w.title)}`);
    const frag=document.createDocumentFragment();
    let consumedCompletion=false;
    ls.forEach((l,i)=>{
      const best=p.best[l.id],global=w.offset+i,isResume=!best&&resume?.campaign===key&&resume.level===global+1,isJustCompleted=!!best&&justCompleted?.campaign===key&&justCompleted?.levelId===l.id;
      const a=href(el('a',`cq-level-tile${best?' is-done':''}${isResume?' is-resume':''}${isJustCompleted?' is-just-completed':''}`),`${cfg.play}?level=${global+1}`);a.dataset.level=String(global+1);a.dataset.local=String(i+1);a.dataset.levelId=l.id;
      const head=el('div','cq-level-tile__head');head.append(el('div','cq-level-tile__number',String(i+1).padStart(2,'0')));
      if(best){const badge=el('span','cq-level-tile__status-badge is-complete','✓');badge.setAttribute('aria-hidden','true');head.append(badge)}
      else if(isResume){const badge=el('span','cq-level-tile__status-badge is-continue','▶');badge.setAttribute('aria-hidden','true');head.append(badge)}
      const title=titleText(l.title),ratio=(l.goal||[]).join(' to '),footer=el('div','cq-level-tile__footer');
      if(best){
        const starCount=Number(best.stars)||0,starText='★'.repeat(starCount)+'☆'.repeat(3-starCount),starsNode=el('span','cq-level-tile__stars',starText),bestNode=el('span','cq-level-tile__best',`BEST ${best.moves} ${best.moves===1?'MOVE':'MOVES'}`);
        starsNode.setAttribute('role','img');starsNode.setAttribute('aria-label',`${starCount} of 3 stars`);footer.append(starsNode,bestNode);
        a.setAttribute('aria-label',`Level ${i+1}: ${title}. Ratio ${ratio}. Completed. ${starCount} of 3 stars. Best ${best.moves} ${best.moves===1?'move':'moves'}.`);
      }else{
        const state=el('span',`cq-level-tile__state${isResume?' is-continue':' is-new'}`,isResume?'CONTINUE':'NEW');footer.append(state);
        a.setAttribute('aria-label',`Level ${i+1}: ${title}. Ratio ${ratio}. ${isResume?'Continue unfinished level':'New level'}.`);
      }
      a.append(head,el('div','cq-level-tile__title',title),ratioNode(l.goal),footer);frag.append(a);
      if(isJustCompleted)consumedCompletion=true;
    });
    levelGrid.replaceChildren(frag);
    if(consumedCompletion){try{sessionStorage.removeItem(JUST_COMPLETED_KEY)}catch(_){ }justCompleted=null}
    const u=new URL(location.href);u.searchParams.set('world',String(wi+1));if(push)history.pushState({world:wi},'',u);else history.replaceState({world:wi},'',u);
    animateWorldIn(direction);
  }
  function setWorld(next,{push=true,source='tap'}={}){
    const target=clamp(next,0,c.worlds.length-1);if(target===wi)return false;
    const direction=target>wi?1:-1;wi=target;drawWorld(push,direction);
    if(source==='swipe'&&swipeHint){localStorage.setItem(SWIPE_SEEN_KEY,'1');swipeHint.hidden=true}
    return true;
  }

  worldTabs.addEventListener('click',e=>{const b=e.target.closest('button[data-world]');if(!b)return;setWorld(Number(b.dataset.world)-1,{push:true,source:'tap'})});
  worldTabs.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
    let next=wi;if(e.key==='Home')next=0;else if(e.key==='End')next=c.worlds.length-1;else if(e.key==='ArrowRight')next=(wi+1)%c.worlds.length;else next=(wi-1+c.worlds.length)%c.worlds.length;
    setWorld(next,{push:true,source:'keyboard'});tabButtons[next]?.focus();
  });
  levelGrid.addEventListener('click',e=>{
    if(performance.now()<suppressClickUntil){e.preventDefault();e.stopPropagation();return}
    const a=e.target.closest('a[data-level]');if(!a)return;const global=Number(a.dataset.level)-1,local=Number(a.dataset.local)-1,l=c.levels[global];if(l)rememberLevel(global,local,l);
  },true);

  if(coarsePointer()){
    if(swipeHint&&localStorage.getItem(SWIPE_SEEN_KEY)!=='1')swipeHint.hidden=false;
    let tracking=false,pointerId=-1,startX=0,startY=0,lastX=0,lastY=0,axis=null;
    const resetDrag=()=>{pager.classList.remove('is-dragging');pager.style.removeProperty('--cq-drag-x')};
    pager.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse')return;const rect=pager.getBoundingClientRect();if(e.clientX-rect.left<24||rect.right-e.clientX<24)return;
      tracking=true;pointerId=e.pointerId;startX=lastX=e.clientX;startY=lastY=e.clientY;axis=null;
    },{passive:true});
    pager.addEventListener('pointermove',e=>{
      if(!tracking||e.pointerId!==pointerId)return;lastX=e.clientX;lastY=e.clientY;const dx=lastX-startX,dy=lastY-startY,ax=Math.abs(dx),ay=Math.abs(dy);
      if(!axis&&(ax>8||ay>8))axis=ax>ay*1.15?'x':'y';if(axis!=='x')return;e.preventDefault();
      const edge=(dx>0&&wi===0)||(dx<0&&wi===c.worlds.length-1),factor=edge?.14:.32,drag=clamp(dx*factor,-54,54);pager.classList.add('is-dragging');pager.style.setProperty('--cq-drag-x',`${drag}px`);
    },{passive:false});
    const finish=e=>{
      if(!tracking||e.pointerId!==pointerId)return;lastX=e.clientX??lastX;lastY=e.clientY??lastY;const dx=lastX-startX,dy=lastY-startY,ax=Math.abs(dx),ay=Math.abs(dy),horizontal=axis==='x'&&ax>=48&&ax>ay*1.25;
      tracking=false;pointerId=-1;resetDrag();if(!horizontal)return;suppressClickUntil=performance.now()+420;setWorld(wi+(dx<0?1:-1),{push:true,source:'swipe'});
    };
    pager.addEventListener('pointerup',finish,{passive:true});pager.addEventListener('pointercancel',finish,{passive:true});
  }else if(swipeHint)swipeHint.hidden=true;

  addEventListener('popstate',()=>{const u=new URL(location.href),next=clamp((Number(u.searchParams.get('world'))||1)-1,0,c.worlds.length-1);if(next!==wi){const direction=next>wi?1:-1;wi=next;drawWorld(false,direction)}});
  drawWorld(false,0);requestAnimationFrame(()=>centerActiveTab(false));

  try{
    const saved=JSON.parse(sessionStorage.getItem(SCROLL_KEY_PREFIX+key)||'null');
    if(saved&&refFromPlay&&saved.world===wi+1&&Date.now()-saved.time<30*60*1000)requestAnimationFrame(()=>scrollTo(0,Math.max(0,Number(saved.y)||0)));
  }catch(_){ }
}

const screen=document.body.dataset.screen;
try{if(screen==='home')await home();else if(screen==='browser')await browser()}catch(err){console.error(err);const root=document.querySelector('#campaignChoices,#levelGrid');if(root)root.replaceChildren(el('div','cq-empty','This menu could not be loaded.'))}
