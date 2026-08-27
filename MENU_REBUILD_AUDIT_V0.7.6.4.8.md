# Menu Rebuild Audit — v0.7.6.4.8

## Architecture
- Canonical hierarchy for all modes: Colour Mode → Campaign → World → Level → Play.
- 3 Colour now has dedicated world and level screens, matching 2 Colour.
- Shared `menu_architecture_v07648.js` populates home, campaign, world and level screens from campaign data.
- Shared design system files: `ui_tokens_v07648.css`, `ui_components_v07648.css`, `ui_layout_v07648.css`.

## Menu consistency checks
- 11 primary menu/navigation HTML pages contain zero inline `<style>` blocks.
- Both 2 Colour and 3 Colour use the same `cq-world-card` and `cq-level-tile` component classes.
- Unsolved level tiles do not expose `Optimal N moves`; solved levels show the player’s own Best result.
- Foundations Tutorial appears at campaign selection only.
- Back controls name the immediate parent level of the hierarchy.

## Runtime preservation
- CellKit renderer: **IDENTICAL** (`bc79b64444b4e662…`)
- Aesthetic preset: **IDENTICAL** (`51806de134e3b8d5…`)
- Synapse renderer: **IDENTICAL** (`6ca523fe7a153c61…`)
- 2C Foundations data: **IDENTICAL** (`dcbf303dac31f4ae…`)
- 2C Networks data: **IDENTICAL** (`596e5d6fd48d176d…`)
- 3C Foundations data: **IDENTICAL** (`4509170ad9d48238…`)
- 3C Networks data: **IDENTICAL** (`5b386a4eda1a5ab4…`)
- Deep-sea background: **IDENTICAL** (`996626f3c164fbfc…`)

## Static QA
- 16 top-level HTML files checked: no missing local `src`/`href` references.
- All top-level, CellKit and canonical Synapse JavaScript files pass `node --check`.
- Browser screenshot automation is blocked by the container browser administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`), so visual phone QA still needs a real browser/device pass.
- Gameplay dock production view is reduced to Levels / Restart / Pause; the existing Stats control remains in the DOM but is shown only when Developer Mode is active.
