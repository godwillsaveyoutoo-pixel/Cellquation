# Cellquation v0.7.6.4.11 — UI Calibration & Homogeneity Audit

## Scope
This is a precision/polish pass on v0.7.6.4.10. Navigation remains:

**Home (2/3 Colours + campaign) → World/Levels → Play**

World swipe, visible World tabs, Continue, return-to-world and scroll restoration are unchanged.

## Visual calibration
- CELLQUATION is now the strongest Home heading both visually and semantically (page H1).
- “Choose your campaign” is a secondary H2 instruction.
- Redundant Home mode-meta is hidden; the visible 2/3 Colours toggle already communicates state.
- Campaign cards use quieter surfaces/shadows and a simpler information hierarchy.
- Foundations/general interaction uses cyan; Living Networks uses green; 3-colour Foundations uses violet.
- World summary changed from a nested heavy card to a light information header with one divider.
- Level tiles keep the same data but use quieter chrome.
- Restart is no longer permanently cyan in gameplay; bottom actions are neutral until interaction.
- Result and tutorial surfaces use the same radius, border, surface and typography family as the menus.

## Compact-layout rule
The v0.7.6.4.10 short-landscape layout sometimes dropped controls/text into the 8–10px range. v0.7.6.4.11 follows a different rule:

> **remove secondary information before shrinking primary information.**

At short landscape:
- 2/3 Colours controls: >= 48px high
- tutorial action: >= 48px high
- World tabs: >= 48px high
- Back: >= 48px high
- tutorial controls: >= 48px high
- primary menu metadata is kept around 11.5px or above
- descriptions, Best text and swipe hint may be hidden when space is genuinely constrained

## Chromium composition QA
The managed environment blocks navigation to the local runtime URL, so a full dynamic local-browser smoke test cannot be claimed. To still validate exact CSS composition, representative Home, World/Levels and gameplay DOMs were rendered **in-memory in Chromium** with the production v0.7.6.4.11 CSS stack.

### Home
- 780×360: no horizontal/vertical overflow; colour control 48px; tutorial action 48px.
- 640×360: no horizontal/vertical overflow; colour control 48px; campaign card ~75px high; tutorial action 48px.
- 412×915: no overflow; colour control 50px; campaign card ~129px; tutorial action 50px.

### World/Levels
- 780×360 synthetic 8-tile test: World tab 48px; level tile 88px. Vertical scrolling remains available for long level lists.
- 640×360 synthetic 8-tile test: World tab 48px; level tile 88px.
- 412×915 synthetic 8-tile test: World tab 50px; level tile ~154px; horizontal World strip behaves as the expected compact browser.

### Gameplay HUD
Representative production CSS composition rendered without overflow at 640×360 and 412×915. The real WebGL/cell renderer was not replaced or invoked by this static composition test.

## Syntax / reference QA
- CSS parser: no syntax errors in `ui_tokens_v076411.css`, `ui_components_v076411.css`, `ui_layout_v076411.css`, `ui_homogeneity_v076411.css`.
- JavaScript syntax: green across the package.
- Top-level HTML local asset/script/style references: no missing references.
- `run.sh` retained and updated to v0.7.6.4.11.

## Protected-system hashes
These files are byte-identical to v0.7.6.4.10:

- CellKit renderer: `bc79b64444b4e6621d9e12362bf52194e2fabcf0e8becf2f9b3a940c94e665cd`
- Synapse renderer: `6ca523fe7a153c61618a02f2cfbb4fc1999a7d1fa56b09d5d3e83fd161c508fb`
- Aesthetic preset: `51806de134e3b8d543e3c652ab9caf1bba32c6554307f63d86ab15f08b26d201`
- Deep-sea PNG: `996626f3c164fbfc4ee23b2b5e2c9dd3d709ddffed1720631ca932fa706d29f8`
- `foundation_game_v0611.js`
- `network_game_v0611.js`
- `threecolor_foundation_game_v071.js`
- `threecolor_network_game_v071.js`
- all four active campaign JSON datasets

The gameplay HTML receives only a screen-scoping attribute and the final shared homogeneity stylesheet. Game logic is unchanged.

## Remaining real-device gate
The final production judgment still needs tactile/visual inspection on the target smartphone, especially:
- actual text rasterization on the target phone;
- Brave browser chrome/fullscreen interaction;
- deep-sea PNG contrast behind real cells;
- 3-colour HUD fit with three target cells;
- tutorial touch feel.
