/* Cellquation v0.7.8e — persistent app shell. */
(()=>{
  'use strict';
  const frame=document.getElementById('cqAppFrame');if(!frame)return;
  const allowed=new Set(['home.html','foundations.html','foundation_levels.html','living.html','living_levels.html','play.html','living_play.html','threecolor.html','twocolor.html','threecolor_foundations.html','threecolor_foundation_levels.html','threecolor_living.html','threecolor_living_levels.html','threecolor_play.html','threecolor_living_play.html','tutorial.html']);
  const url=new URL(location.href),requested=url.searchParams.get('screen')||'home.html',screen=allowed.has(requested)?requested:'home.html';
  const child=new URL(screen,location.href);url.searchParams.forEach((v,k)=>{if(k!=='screen')child.searchParams.append(k,v)});child.hash=url.hash;
  frame.src=child.pathname.split('/').pop()+child.search+child.hash;
  // Keep browser address useful without changing the persistent shell document.
  frame.addEventListener('load',()=>{
    try{
      const u=frame.contentWindow.location,topUrl=new URL(location.href);topUrl.search='';topUrl.hash='';
      const file=(u.pathname.split('/').pop()||'home.html');if(file!=='home.html')topUrl.searchParams.set('screen',file);
      new URLSearchParams(u.search).forEach((v,k)=>topUrl.searchParams.append(k,v));topUrl.hash=u.hash;
      history.replaceState(null,'',topUrl);
    }catch{}
  });
})();
