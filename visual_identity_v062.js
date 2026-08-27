/* Presentation-only ambient layer. No gameplay clock, no requestAnimationFrame. */
(function(){
  const stage=document.querySelector('.stage');
  if(!stage||stage.querySelector('.world-ambient'))return;
  const ambient=document.createElement('div');ambient.className='world-ambient';ambient.setAttribute('aria-hidden','true');
  const particles=document.createElement('div');particles.className='world-ambient-particles';
  const count=28;
  function hash(n){let x=(n+1)*2654435761>>>0;x^=x>>>16;x=Math.imul(x,2246822519);x^=x>>>13;return (x>>>0)/4294967295}
  for(let i=0;i<count;i++){
    const p=document.createElement('i');p.className='world-mote';
    const r1=hash(i*7+1),r2=hash(i*7+2),r3=hash(i*7+3),r4=hash(i*7+4),r5=hash(i*7+5),r6=hash(i*7+6),r7=hash(i*7+7);
    const band=i%4;
    let left,top;
    if(band===0){left=3+r1*22;top=4+r2*92}
    else if(band===1){left=75+r1*22;top=4+r2*92}
    else if(band===2){left=18+r1*64;top=2+r2*16}
    else {left=18+r1*64;top=82+r2*14}
    const size=(1.6+r3*3.8).toFixed(1);
    const blue=(i%3!==1),rgb=blue?'40,174,236':'39,218,172';
    p.style.cssText=`left:${left.toFixed(2)}%;top:${top.toFixed(2)}%;--s:${size}px;--rgb:${rgb};--a:${(.24+r4*.42).toFixed(3)};--dx:${(-10+r5*20).toFixed(1)}px;--dy:${(-18+r6*36).toFixed(1)}px;--d:${(5.2+r1*6.5).toFixed(1)}s;--delay:${(-r2*8).toFixed(1)}s;filter:blur(${(r7*0.35).toFixed(2)}px);`;
    particles.appendChild(p);
  }
  ambient.appendChild(particles);
  const canvas=stage.querySelector('canvas');
  if(canvas?.nextSibling)stage.insertBefore(ambient,canvas.nextSibling);else stage.appendChild(ambient);
})();
