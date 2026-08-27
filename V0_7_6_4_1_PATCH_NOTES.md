# Cellquation Core v0.7.6.4.1 — Low-End Interior Material Fix

Baseline: **v0.7.6.4 Smooth Mobile Rendering**.

This patch changes only the reduced-detail CellKit material path used after a phone has proven itself constrained/critical.

- Full-quality (`renderDetail > 0.70`) CellKit material recipe is preserved.
- Low-end broad blob fields were replaced with cheaper higher-frequency crossing flow fields.
- Low-end density contrast is tempered so authored high contrast does not become camouflage-like islands.
- Cheap low-end particulate flecks are removed; a narrow flowing sheen replaces them.
- Low-end life-field modulation is softened so the whole interior does not pulse as broad patches.
- Membrane silhouette, edge quality, action animation, cell profiles, palette, nucleus geometry, and aesthetic preset are unchanged.
