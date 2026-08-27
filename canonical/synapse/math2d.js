export const TAU=Math.PI*2;
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;

export function smoothstep(a,b,x){
  const t=clamp((x-a)/(b-a||1));
  return t*t*(3-2*t);
}

export function smootherstep(a,b,x){
  const t=clamp((x-a)/(b-a||1));
  return t*t*t*(t*(t*6-15)+10);
}

export const ease=smootherstep.bind(null,0,1);
export const lerp2=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t)];
export const sub2=(a,b)=>[a[0]-b[0],a[1]-b[1]];
export const add2=(a,b)=>[a[0]+b[0],a[1]+b[1]];
export const mul2=(a,s)=>[a[0]*s,a[1]*s];
export const len2=a=>Math.hypot(a[0],a[1]);
export function norm2(a){const l=Math.max(1e-6,len2(a));return[a[0]/l,a[1]/l];}
