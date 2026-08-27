/* v0.7.2 static sparkle layer — CSS animated, no additional animation loop. */
(function(){
 const stage=document.querySelector('.stage');if(!stage||stage.querySelector('.world-glints'))return;
 const layer=document.createElement('div');layer.className='world-glints';layer.setAttribute('aria-hidden','true');
 function h(n){let x=(n+11)*2654435761>>>0;x^=x>>>16;x=Math.imul(x,2246822519);x^=x>>>13;return(x>>>0)/4294967295}
 for(let i=0;i<14;i++){const e=document.createElement('i');e.className='world-glint';const a=h(i*7),b=h(i*7+1),c=h(i*7+2),d=h(i*7+3);const rgb=i%4===0?'202,113,255':i%3===0?'64,237,188':'67,208,244';const s=1.1+c*2.5;e.style.cssText=`left:${(3+a*94).toFixed(2)}%;top:${(3+b*94).toFixed(2)}%;--s:${s.toFixed(1)}px;--rgb:${rgb};--a:${(.22+d*.42).toFixed(2)};--d:${(4.8+a*7).toFixed(1)}s;--delay:${(-b*8).toFixed(1)}s`;layer.appendChild(e)}
 stage.appendChild(layer);
})();
