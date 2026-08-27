# Cellquation Core v0.7.6.4.4 — Subtle Low-End Interior Pass

Baseline: v0.7.6.4.3 Developer Mode Navigation Fix.

## Goal
Make Constrained and Critical visually calm and elegant on weak phones without touching the protected membrane silhouette or the Full/Balanced authored CellKit material.

## Changes
- removed the low-end filament/`lowStream` mask that created worm-like internal contours;
- removed all thresholded low-end spot/ridge behavior from the cell body;
- replaced it with two low-cost, smooth single-octave gel fields plus a very low-amplitude broad flow wave;
- strongly reduced low-end density contrast so authored high-contrast cell profiles cannot turn the cheap field into dark islands;
- removed low-end fine flecks entirely;
- reduced low-end internal life-pulse amplitude; the cell still breathes/moves through its membrane and action animation;
- Critical intentionally renders calmer than Constrained rather than using a coarser pattern.

## Preserved
- Full and Balanced material path;
- membrane shape and edge quality;
- nucleus rendering;
- cell profiles/aesthetic preset;
- gameplay and action animations;
- developer quality override and navigation persistence.
