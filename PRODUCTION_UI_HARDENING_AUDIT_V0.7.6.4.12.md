# Cellquation v0.7.6.4.12 — Production UI Hardening Audit

## Executive assessment

v0.7.6.4.12 reaches the intended **production-quality UI shell** threshold. The navigation architecture is now stable and should be frozen unless real player testing reveals a concrete usability problem.

The normal path remains:

> **Home (2/3 Colours + campaign) → World/Levels → Play**

Swipe is an accelerator between worlds, never the only control. Continue, world memory and level return state are persistent. The UI no longer depends on successive generations of CSS overrides.

## Automated / structural stop-gates

All of the following passed:

- 31 JavaScript files: `node --check` clean.
- 9 JSON files + web manifest: parse clean.
- 2 active CSS files: `tinycss2` parse clean, zero parser errors.
- 16 top-level HTML files: all local `href` / `src` targets resolve.
- All local ES-module imports resolve.
- PWA manifest valid for this portrait-first Cellquation build; 192×192 and 512×512 icons match declared dimensions.
- PWA precache covers the full playable runtime; every listed cache entry exists.
- Version-query resources and level URLs resolve from offline cache using `ignoreSearch`.
- `run.sh` exists and is executable.
- No `user-scalable=no` remains.
- Active CSS dependency set is only:
  - `ui_production_v076412.css`
  - `visual_environment_v076412.css`
- `ui_production_v076412.css`: only 10 targeted `!important` declarations; environment sheet: 0.
- Campaign structure checks:
  - 2C Foundations: 5 worlds / 30 levels
  - 2C Living Networks: 6 worlds / 48 levels
  - 3C Foundations: 5 worlds / 30 levels
  - 3C Living Networks: 6 worlds / 48 levels
- World offsets/counts are contiguous and goal arity matches 2C/3C mode.
- Eight protected renderer/data/background files are SHA-256 byte-identical to v0.7.6.4.11.
- 2C gameplay has no `progress.unlocked` selection clamp.
- All four gameplay modes write resume state from the actual active level flow.
- Pause and result dialogs have accessible dialog shells and focus management.
- Global `:focus-visible`, 48 px control baseline, narrow 3C HUD layout and full-bleed stage rules are present.

## Critical UX scoring after hardening

Scores are for the **mobile UI/product shell**, not a claim that every gameplay mechanic is accessible to every assistive technology.

| Area | Score | Critical judgment |
|---|---:|---|
| Navigation architecture | **9.5/10** | Two-screen route before play; no redundant colour/campaign/world page depth. Freeze this architecture. |
| Home UX | **9.2/10** | Strong brand hierarchy, mode toggle, two primary campaigns, secondary tutorial, optional Continue. |
| World/Level navigation | **9.3/10** | Visible tabs + optional swipe, persistent world, concise progress, truthful free level selection. |
| Gesture/return flow | **9.3/10** | Swipe has visible alternative and discovery cue; return state/Continue follow actual play. |
| Touch/readability calibration | **9.1/10** | Primary compact controls remain ~48 px; secondary metadata is removed before primary UI is shrunk. |
| Menu visual identity | **9.0/10** | Deep-sea shell, real cell-derived campaign art and disciplined colour semantics form one product language. |
| Gameplay HUD | **9.1/10** | Full-bleed world, coherent top/bottom instrumentation, corrected narrow metadata and 3-target portrait layout. |
| Tutorial UX shell | **9.0/10** | Uses the live CellKit action world and a much simpler gameplay-like shell; no separate app/dashboard feel. |
| Visual homogeneity | **9.2/10** | Home, browser, tutorial, pause, result and HUD use the same tokens/material language. |
| Code/UI homogeneity | **9.4/10** | One production UI sheet + one environment sheet; legacy level pages redirect instead of duplicating components. |
| Accessibility of UI shell | **9.0/10** | Zoom, focus-visible, dialogs, focus trapping, labels and tutorial keyboard activation are substantially hardened. |
| Mobile browser / PWA polish | **9.2/10** | Fullscreen control, manifest, icons, shared SW registration and complete runtime offline cache. |
| Performance architecture | **9.3/10** | No new heavy blur/compositor effects; static PNG environment and tiered particle suppression remain intact. |

**Production-shell mean: 9.22/10.**

## What is intentionally not scored as “finished”

### Real-device release confidence

A real Samsung A20 / Brave run is still required because the managed Chromium environment blocks local/data/file navigation before the game is allowed to render. This is an **environmental QA gate**, not a hidden 9/10 claim. It should verify:

1. Home at actual device CSS viewport.
2. 2C + 3C World/Levels touch and swipe.
3. 3-colour top HUD with long titles/ratios.
4. Pause → Fullscreen → Resume in Brave.
5. Result → Next Level → Home Continue correctness.
6. PWA installation/launch behavior if installed.
7. Constrained/Critical renderer quality and frame pacing.

### Full non-visual gameplay accessibility

The UI shell is accessible to a strong standard, but the canvas-based core game is fundamentally designed around direct spatial touch/cell manipulation. A full screen-reader/keyboard alternative for every puzzle action would be a separate accessibility feature project, not a menu-polish task.

### Additional languages

This build remains an English production baseline. Campaign data already carries EN/NL fields, but a complete language selector and fully translated 3-colour/tutorial copy should be handled as a dedicated localization pass rather than mixed into this UI freeze.

## Freeze recommendation

If the A20/Brave device gate does not expose a concrete defect, **freeze the menu/HUD architecture at v0.7.6.4.12**. Further work should move to campaign quality, sound/causal feedback, player testing and gameplay content rather than repeated menu redesign.
