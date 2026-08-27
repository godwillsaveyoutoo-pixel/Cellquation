# CELLQUATION — Menu & Navigation UX Research v1

Baseline audited: `Cellquation_Core_v0.7.6.4.7_DEEPSEA_HUD_FRAMING`

## 1. Scope

This audit covers the complete player-facing navigation path currently present in the build:

1. colour-mode selection (`index.html`)
2. campaign selection (`twocolor.html`, `threecolor.html`)
3. 2-colour world selection (`foundations.html`, `living.html`)
4. 2-colour level selection (`foundation_levels.html`, `living_levels.html`)
5. 3-colour world/level selection (`threecolor_foundations.html`, `threecolor_living.html`)
6. tutorial shell (`tutorial.html`, `tutorial_v075.css`)
7. in-game HUD and bottom dock (`play.html`, `living_play.html`, `threecolor_play.html`, `threecolor_living_play.html`)
8. level-complete result overlay
9. developer/stats controls where they affect production-facing hierarchy

External research considered:
- Xbox Accessibility Guidelines 101, 102, 112, 114
- Apple Human Interface Guidelines: Menus and Accessibility
- Android accessibility and navigation guidance
- GDC: UX Redesign — Creating a Consistent Cross-Platform Experience
- Jacko & Salvendy: Hierarchical Menu Design: Breadth, Depth, and Task Complexity
- progressive-disclosure literature and design-system guidance

---

## 2. Main conclusion

The current menus are not weak because any single page is dramatically bad. The main problem is that Cellquation currently contains **multiple different menu systems** that have grown beside one another.

The most important professionalisation step is therefore **not another cosmetic pass per page**. It is to create one canonical navigation grammar and one canonical UI component system, then rebuild every menu screen from those shared primitives.

The core target should be:

> **One game, one hierarchy, one visual grammar.**

---

## 3. Current information architecture

### 2-colour path

`Colour Mode → Campaign → World → Level → Play`

This is structurally clear.

### 3-colour path

`Colour Mode → Campaign → combined World/Level page → Play`

The same HTML file changes function depending on the `?world=` query parameter. The visual language is also different from the 2-colour route.

### Consequence

A player learns one navigation model in 2 Colour and a second model in 3 Colour. That is unnecessary cognitive load.

**Recommendation:** use the exact same hierarchy for both colour modes:

`Colour Mode → Campaign → World → Level → Play`

The colour mode should alter content and accent colour, not navigation logic.

---

## 4. Screen-by-screen findings

### A. Colour mode screen

**Current strengths**
- only two primary choices;
- large cards;
- progress is visible;
- 2 Colour and 3 Colour are visually differentiated.

**Problems**
- the screen lacks a strong returning-player action;
- `ALL LEVELS UNLOCKED` occupies visual space but is not a decision;
- 3 Colour contains two different messages about difficulty (`BRAINIAC MODE`, `Much harder`), which is redundant;
- progress strings are visually dense.

**Recommended structure**
1. CELLQUATION brand
2. optional `Continue` card for returning players
3. 2 Colour card
4. 3 Colour card
5. compact settings entry

Move `All levels unlocked` out of the permanent footer. If it matters, show it once or make it contextual.

---

### B. Campaign selection

**Current strengths**
- Foundations and Living Networks are easy to distinguish;
- cards contain useful progress;
- tutorial is now full-width.

**Problems**
- tutorial is visually a third choice but semantically is not a campaign;
- the same tutorial entry appears again inside the Foundations world screen;
- the footer again communicates a rule rather than an action;
- Foundations and Living Networks cards contain several layers of copy at once.

**Recommended structure**
- page title: `2 Colour` or `3 Colour`
- subtitle: `Choose a campaign`
- two primary campaign cards
- one clearly secondary full-width `Foundations Tutorial` row below them
- no tutorial duplication on the next screen

A tutorial should be discoverable, but should not compete with the main game modes as if it were a third campaign.

---

### C. World selection

**Current 2-colour implementation**
- world cards with number, title, theme, completion, stars, progress bar.

This is one of the stronger structures in the current build.

**Problems**
- styles are embedded directly inside `foundations.html` and `living.html` rather than coming from the same component system as the campaign cards;
- the tutorial is duplicated in Foundations;
- typography and card dimensions do not exactly match the higher-level menus;
- world context/back naming changes from screen to screen.

**3-colour problem**
The 3-colour world cards use a completely different list-row design and share a screen with level selection.

**Recommendation**
Create one `WorldCard` component used by all four campaigns:
- WORLD 1
- title
- one-line theme
- `4/6 levels · 10/18 ★`
- single progress bar
- chevron

The only visual variation should be campaign/mode accent colour.

---

### D. Level selection

This is currently the largest structural inconsistency.

#### 2 Colour
Uses large square-ish level tiles containing:
- local number
- goal ratio
- stars
- uppercase title

#### 3 Colour
Uses horizontal list rows containing:
- number + title
- optimal/best move text
- goal ratio on the right

These are effectively two separate products.

**Recommendation: one canonical level tile for every mode.**

Suggested contents:
- large local level number (`01`)
- short title in mixed case
- target ratio as the strongest secondary datum
- 0–3 stars
- optional tiny network/topology glyph for Living Networks

Do **not** show `optimal N moves` before a level is solved. It is meta-information and can partially reveal the puzzle's expected route length. After completion, `Best N` can be shown discreetly if desired.

For portrait phones, a 2-column grid is appropriate if each tile keeps a reliable touch area. For particularly narrow screens, reflow to one column rather than shrinking text aggressively.

---

### E. Tutorial

**Current strengths**
- real CellKit cells;
- real action logic;
- clear step counter;
- explicit action feedback.

**Problems**
- tutorial has its own visual system (`panel`, `rulebox`, separate top/control language), distinct from both menus and gameplay;
- `scene-label`, `rulebox`, `try-hint`, and bottom controls create several competing textual layers;
- it reads somewhat like a contained web lesson rather than a normal Cellquation play state.

**Recommendation**
Make the tutorial visually closer to gameplay:
- canonical game top HUD, simplified to `Tutorial · 1/6`;
- real cell scene fills most of the screen;
- one concise instruction capsule at bottom;
- one secondary Back and one primary Next/Try action;
- no extra card inside a card.

The tutorial should teach by temporarily simplifying the game screen, not by introducing an unrelated application shell.

---

### F. Gameplay navigation

Current bottom dock mixes different semantic types:
- `Levels` = destination
- `Restart` = destructive/restart action
- `Pause` = state toggle
- `Stats` = diagnostic tool
- `Campaigns` = distant destination

This is a weak hierarchy even though the dock looks visually consistent.

`Restart` is also visually highlighted, which can read like a selected navigation tab even though it is an action.

**Recommendation for production**
Keep the permanent gameplay dock extremely focused:

- Levels
- Restart
- Pause / Resume
- Settings or Help (only if genuinely needed during play)

`Stats` belongs in Developer Mode, not in the production dock.

`Campaigns` does not need to occupy permanent gameplay space. It can be reached through Levels/Back, or from a dedicated pause/exit state.

This gives more screen to the cells and makes every permanent control more important.

---

### G. Level complete

The current flow is fundamentally sound:
- completion state
- stars
- move summary
- best result
- Replay
- Next Level

**Recommended hierarchy**
- `Next level` = primary
- `Replay` = secondary
- optional `Levels` = tertiary

Use the same panel radius, border treatment, typography tokens and button components as the rest of the UI.

---

## 5. Navigation principles for the redesign

### Principle 1 — Every screen answers one question

- Home: Which colour mode / continue?
- Mode hub: Which campaign?
- Campaign: Which world?
- World: Which level?
- Gameplay: What action do I perform?
- Result: Continue or replay?

Do not ask two navigation questions on one screen unless it clearly reduces friction.

### Principle 2 — Same hierarchy in 2 Colour and 3 Colour

Content may differ. Navigation should not.

### Principle 3 — Persistent context

Every submenu should visibly communicate:
- current colour mode;
- current campaign;
- current world where relevant;
- a predictable Back destination.

Avoid changing between `← Colour Mode`, `← 2 Colour`, `← Three Colours`, `← Worlds`, and bare `← Back` without a common pattern.

Recommended back pattern:
- chevron/back icon + exact parent label
- same location, dimensions and typography on every screen

### Principle 4 — Progressive disclosure

Do not show all metadata everywhere.

Examples:
- home does not need world counts + all unlock rules + detailed stars simultaneously;
- world cards do not need level-specific statistics;
- unsolved level tiles do not need optimal move counts;
- developer FPS/quality data should remain developer-only.

### Principle 5 — One primary action per state

Examples:
- Campaign selection: campaign cards are primary; Tutorial is secondary.
- Result: Next Level primary; Replay secondary.
- Tutorial step: Try/Next primary; Back secondary.

### Principle 6 — Large touch targets, large readable text

Target a minimum effective touch area around 48 CSS px for phone controls. Avoid important metadata under roughly 13–14 CSS px in the intended phone layout; normal descriptive text should usually sit around 15–16 CSS px or above.

Short uppercase kickers are fine. Full sentences and long labels should use mixed case.

---

## 6. Proposed canonical screen architecture

### Screen 1 — Home

CELLQUATION

[ Continue — World 2 · Level 4 ]   (only when progress exists)

[ 2 Colour ]
[ 3 Colour ]

Settings icon / small utility row

### Screen 2 — Mode hub

← Colour mode
2 Colour
Choose a campaign

[ Foundations ]
[ Living Networks ]

[ Foundations tutorial ]

### Screen 3 — Campaign / Worlds

← 2 Colour
FOUNDATIONS
18 / 30 levels · 41 / 90 ★

[ World 1 — First Changes ]
[ World 2 — ... ]
...

### Screen 4 — World / Levels

← Foundations
WORLD 2
Two Shifts
short world description

[01] [02]
[03] [04]
[05] [06]

Each tile: title + target + stars.

### Screen 5 — Gameplay

Top HUD:
level identity | target ratio | moves/current ratio

Playfield dominates.

Bottom dock:
Levels · Restart · Pause
(+ optional one utility only if needed)

### Screen 6 — Result

LEVEL COMPLETE
Title
★★★
N moves · New best

[ Replay ] [ Next level ]
Levels (tertiary)

---

## 7. Visual system recommendation

Create a real UI design system instead of page-specific styling.

### Shared tokens

- `--surface-0`: deep-sea page background
- `--surface-1`: normal menu surface
- `--surface-2`: selected/raised surface
- `--border-soft`
- `--border-active`
- `--text-primary`
- `--text-secondary`
- `--text-muted`
- mode accent: cyan / violet
- campaign accent: foundation / network only where semantically useful

### Shared radii
Use only a small set, for example:
- 12 px small controls
- 18 px standard rows
- 24 px primary cards
- 999 px only for true pills/chips

Current build mixes many pill and rounded-card treatments without a strict semantic rule.

### Shared spacing
Use an 8 px base grid:
- 8
- 12
- 16
- 24
- 32

Do not tune every page independently.

### Typography roles
- Display / game brand
- Screen title
- Card title
- Body
- Metadata
- Kicker
- Button label

Short metadata can use the monospaced technical feel, but body descriptions should remain the normal sans-serif.

---

## 8. Code architecture recommendation

The current UI debt is visible directly in the files:
- 14 top-level HTML files;
- 10 pages still contain their own inline `<style>` blocks;
- 2-colour and 3-colour world/level UIs are implemented separately;
- `menu_v075.css`, `smartphone_ui_v075.css`, `mobile_readability_v075.css`, tutorial CSS and per-page inline CSS override one another;
- old base sizes of 7–10 px still exist and are then corrected later with `!important` overrides.

This makes visual consistency fragile.

### Proposed structure

`ui_tokens.css`
- colours
- spacing
- radii
- type scale
- shadows

`ui_components.css`
- screen header
- card
- progress bar
- world card
- level tile
- buttons
- bottom dock
- result panel

`ui_layout.css`
- phone layouts
- responsive rules
- safe-area handling

`menu_screen.js`
- generic screen/header/back/context behavior

`campaign_screen.js`
- common 2/3-colour campaign/world population

`level_screen.js`
- common level-grid population for all four campaigns

3 Colour should supply data/configuration, not its own menu implementation.

---

## 9. What should NOT be changed

The menu redesign should not disturb:
- CellKit rendering;
- aesthetic presets;
- action animations;
- synapse renderer;
- performance governor;
- campaign/level data;
- progress save format unless necessary.

This should be a UI/navigation refactor, not another gameplay refactor.

---

## 10. Priority order

### Phase A — architecture
1. canonical navigation tree
2. one shared screen header/back pattern
3. one shared WorldCard
4. one shared LevelTile
5. one 2/3-colour data-driven screen implementation

### Phase B — visual system
6. design tokens
7. typography normalization
8. shared spacing/radius system
9. campaign/mode accents
10. proper pressed/focus/selected states

### Phase C — gameplay chrome
11. remove Stats from production dock
12. reduce dock to genuinely frequent actions
13. unify result panel and tutorial chrome with the same components

### Phase D — QA
14. Samsung A20 / low-end Android readability and touch audit
15. 360×780 / 390×844 / larger phone testing
16. back-navigation path test from every screen
17. progress-state tests: fresh save, partial progress, complete campaign
18. 2-colour vs 3-colour structural parity test

---

## Final design rule

> **The player should learn Cellquation's menu language once.**
>
> Colour mode, campaign and world can change; the way the interface behaves should not.
