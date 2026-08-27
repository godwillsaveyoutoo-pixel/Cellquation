# Recovery Release Audit — v0.7.7a.2

## Status
Static/package gate: **GREEN — 0 errors, 0 warnings**.

## Reported regressions targeted
- Living Networks showing HUD/background but no usable cells/synapses or appearing to stall.
- Cell/Synapse fluorescence visibly weaker after the glow-reduction pass.

## Corrective architecture
The deep-sea image is no longer a DOM/CSS fullscreen blend over WebGL. It is sampled once per framebuffer pixel as the first WebGL pass, then existing Synapse and CellKit passes draw over it.

This intentionally trades a fragile browser compositor dependency for one simple texture sample in the renderer that already owns every gameplay frame.

## Fluorescence target
Useful local emission was restored close to v0.7.6.4.12, while broad aura remains dramatically below that build. See `VISUAL_PIPELINE_AUDIT_V0.7.7a.2.md` for exact ratios.

## Protected content
Hash-identical to v0.7.7a.1:
- user aesthetic preset;
- CellKit profiles, cell model, transition and brood logic;
- Synapse renderer and canonical animation JSON;
- 2-colour Foundations campaign;
- 2-colour Living Networks campaign/layout;
- 3-colour Foundations campaign;
- 3-colour Living Networks campaign/layout.

No audio assets are active in this build.

## Machine checks
See `FINAL_MACHINE_CHECKS_V0.7.7a.2.txt`.

- 31 JavaScript files: syntax OK;
- 10 JSON/manifests: parse OK;
- 2 CSS files: 0 parser errors;
- 72 local module imports: present;
- 79 local HTML refs: present;
- 64 PWA CORE entries: present;
- package SHA-256 manifest: verifies;
- no packaged OGG/MP3/WAV files.

## Browser automation limitation
The managed Chromium environment cannot initialise its ANGLE/GL backend, including with software-GL flags, so a truthful automated WebGL screenshot is unavailable here. This is explicitly not counted as a passed browser test.

## Physical-device gate
Use a fresh port to bypass old Brave service-worker state:

```bash
./run.sh 8081
```

Then verify, in this order:
1. 3 Colour Living Networks opens and cells/synapses appear immediately after the HUD.
2. Background is visible but never covers cells.
3. Membrane/Synapse fluorescence feels close to the earlier bright identity without a large diffuse hue.
4. Test Constrained/Critical once in `?dev=1`.
5. Perform one Fusion/Split transport and confirm frame pacing remains responsive.
