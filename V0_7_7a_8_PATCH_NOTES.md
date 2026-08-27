# Cellquation Core v0.7.7a.8 — Target Cell Restyle + Living Wobble Tuning + Background Glow Cleanup

## 1. Target cells
- Replaced the old ring-like HUD target discs for blue, green and violet.
- New target assets use an organic, slightly irregular membrane silhouette with a gel interior, inner rim and species-colour glow.
- Removed the nucleus / nucleus-like white orb entirely so the target number remains the only central symbol.
- The same target assets continue to work in 2-colour and 3-colour HUDs and in compact menu cell markers.

## 2. Living Networks wobble
- Increased visual-only idle translation from `0.0072` to `0.0175` world units (about 2.43× the previous translation amplitude).
- Kept the motion slow (`speed 0.56`) instead of making it nervous or busy.
- Breathing and rotational sway remain restrained (`0.0068`, `0.018`).
- Each node keeps its own phase/seed, so cells do not sway in sync.
- Gameplay topology, hit sockets and authored network anchors remain unchanged.
- Critical/low quality still reduces the effect, but less aggressively (`0.82`) so it remains perceptible on low-end devices.
- `prefers-reduced-motion` still disables this extra presentation motion.

## 3. Background glow cleanup
- Removed the broad component-centred radial glow generated over Living Networks.
- Retained only smaller, lower-alpha local glow near cells and synapse midpoints.
- Removed the broad top radial stage light sheet from the global playfield CSS.
- Reduced the remaining network-aura compositor opacity from `0.60` to `0.46`.
- Kept a very mild edge vignette so the HUD/gameplay still separates from the display edges.

## Cache / release hygiene
- Bumped Living Network module and HUD asset cache versions to v0.7.7a.8.
- Bumped the service-worker cache key so older target PNGs and glow CSS do not survive the update.
