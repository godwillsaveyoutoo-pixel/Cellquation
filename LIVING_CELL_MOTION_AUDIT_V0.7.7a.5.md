# Cellquation v0.7.7a.5 — Living Cell Motion Audit

## Implementation model
The authored `nodeWorld[]` positions remain the sole gameplay truth. `idleNodePose()` derives a temporary render pose from simulation time, node index and the cell visual seed. The temporary cell position/rotation is restored immediately after each draw call.

Idle synapse geometry calls `renderNodePosition()` so endpoints follow the same tiny drift. Sockets, pointer hit testing, route logic, transport geometry and node occupancy continue to use the authored anchors.

## Motion envelope
- Per-axis drift coefficient: `0.0072` world units at full quality / idle state.
- Numerical sampling over 60 seconds / 11 cell phases gives a maximum radial center drift of about `0.00993` world units, ~6.4% of the Fusion radius (`0.155`).
- Whole-cell breathing: ±0.65% maximum coefficient.
- Rotational sway: ~±1.03° coefficient.
- During another cell's canonical action: 34% network motion.
- Selected node: 58% of current idle amplitude.
- Low/Critical tier: 72% of current idle amplitude.
- Reduced-motion preference: 0% added idle motion.

## Action safety
Nodes directly participating in active transport/local actions are forced to a zero idle offset. Static cells are restored to their authored anchor immediately after rendering, so presentation drift cannot leak into canonical Fusion/Split/Brood/Destruct/Swap/Imitation geometry.

## Performance
The added cost is a handful of scalar sine/cosine operations per visible node and reuses the existing draw calls. No extra canvases, particles, textures, DOM elements, WebGL programs or render passes were added.
