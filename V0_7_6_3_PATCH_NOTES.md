# Cellquation Core v0.7.6.3 — Foundations No Outer Halo

## Visual change
- Removed the broad external CellKit body halo in **2-colour Foundations** and **3-colour Foundations**.
- This applies to idle cells and the real Fusion, Split and Brood division animation passes.
- The thin membrane rim, inner glow, gel lighting, nucleus glow, material profiles, idle identity and the authored aesthetic preset are unchanged.
- The Swap eclipse/corona and Imitation organelles remain intact.
- Selection feedback remains membrane-bound and subtle.

## Scope
- Living Networks and the tutorial keep their existing CellKit outer-halo behavior.
- Gameplay rules, timings and campaign data are unchanged.

## Performance side effect
- Foundations uses a slightly tighter per-cell scissor when the outer halo is disabled, reducing fragment work without changing the cell body.
