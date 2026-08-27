import {clamp,smootherstep,sub2} from './math2d.js?v=synapse0.8.7';

function dot(a,b){return a[0]*b[0]+a[1]*b[1];}

/*
  Visibility belongs to the *rendering* of the transport cell, not to its
  physical state. The latent cell remains continuous at all times. While its
  centre moves into the duct we fade the normal cell renderer away; the
  synapse deformation remains driven by the same hidden position + scale.
*/
export function transportCellRenderOpacity({stage,position,scale,sourceMouth,targetMouth,travel,baseRadius}){
  const radius=Math.max(.001,baseRadius*Math.max(.10,scale));
  if(stage==='transit')return 0;
  if(stage==='intake'||stage==='compression'){
    const penetration=dot(sub2(position,sourceMouth),travel);
    // Outside / half-entered remains fully readable. Once the centre travels
    // well inside the throat, the normal cell vanishes instead of being seen
    // through the translucent synapse body.
    return clamp(1-smootherstep(-radius*.10,radius*.72,penetration));
  }
  if(stage==='egress'){
    const outside=dot(sub2(position,targetMouth),travel);
    // Hidden behind the receiving mouth until the cell actually approaches
    // the lip plane; then reveal continuously as it emerges.
    return clamp(smootherstep(-radius*.72,radius*.12,outside));
  }
  return 1;
}
