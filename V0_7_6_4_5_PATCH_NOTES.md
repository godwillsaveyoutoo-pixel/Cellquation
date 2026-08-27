# Cellquation Core v0.7.6.4.5 — Living Environment Pass

Baseline: v0.7.6.4.4.

## Goal
Keep the approved cells exactly intact while improving the environment around them.

## Changes
- replaced the technical/repeating stage grid language with quieter biological chamber depth;
- added broad organic edge arcs and soft depth pools while keeping the centre calm;
- refined suspended ambient particles and reduced their count (42→28 motes, 24→14 glints);
- refined top and bottom HUD backgrounds with static gradients and cleaner light seams;
- removed HUD backdrop blur dependency to avoid wasting compositor budget on weak phones;
- integrated the instruction hint more naturally into the playfield;
- balanced/constrained/critical tiers keep the same visual composition but disable ambient motion first.

## Explicitly unchanged
- `cellkit_latest/renderer.js`
- CellKit profiles and aesthetic preset
- cell geometry, membrane, nucleus, internal material, colours
- action animations
- Synapse renderer and choreography
- campaign/gameplay data and rules
