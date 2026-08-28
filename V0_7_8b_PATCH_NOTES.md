# Cellquation Core v0.7.8b — Living Networks Dual-Orientation Optimization

- Portrait and landscape are now equal Living Networks targets.
- The already tuned portrait compositions are preserved instead of being replaced.
- Portrait detection now uses the real viewport, fixing 360×640 phones whose cropped stage previously missed the portrait branch.
- Added `runtime/network_orientation_layout_v078b.js` as the shared presentation-only layout engine for both 2C and 3C Living Networks.
- Landscape networks can quarter-turn when that better matches the screen.
- Landscape geometry then opens horizontally and gently flattens vertically, preventing the tiny centred-network problem on wide screens.
- Dense 8–11 node landscape graphs use tighter safe spacing to preserve cell size.
- PWA manifest changed from forced `landscape` to `any`.
- Cache/query version moved to `0.7.8b` / `cellquation-v0.7.8b`.
- Gameplay rules, campaign content, solver state, progress, audio, Settings and background systems are unchanged.
