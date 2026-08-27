# Cellquation Menu Interaction Research v2

## Scope

This follow-up research examines the streamlined v0.7.6.4.9 flow and asks how it can feel faster and more game-like on a phone without hiding essential navigation behind gestures.

Current normal flow before this pass:

**Home (2/3 Colours + campaign) → World/Levels → Play**

That hierarchy is already compact. The largest remaining gains are therefore *interaction* and *return-flow* improvements rather than adding or removing another screen.

## External guidance reviewed

### Apple Human Interface Guidelines — Gestures
https://developer.apple.com/design/human-interface-guidelines/gestures/

Relevant principles:
- standard gestures such as tap and swipe are familiar;
- gestures should respond immediately and visibly;
- custom/shortcut gestures should supplement standard controls, not replace them;
- avoid gestures that conflict with system navigation gestures.

### Apple Human Interface Guidelines — Accessibility
https://developer.apple.com/design/human-interface-guidelines/accessibility/

Relevant principles:
- provide alternatives to gestures for core functionality;
- use simple, consistent interactions;
- sufficiently large controls and adequate spacing improve reliable touch use;
- iOS default controls are typically 44×44 pt.

### Android Developers — Accessibility
https://developer.android.com/design/ui/mobile/guides/foundations/accessibility

Relevant principles:
- do not rely on gestures as the only way to complete an action;
- target about 48 dp minimum for touch controls;
- simple controls and multiple input routes improve accessibility.

### Microsoft Xbox Accessibility Guideline 112 — UI Navigation
https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/112

Relevant principles:
- UI navigation should remain consistent and predictable across the game;
- repeated components should appear and behave consistently;
- digital/keyboard navigation should follow the same meaningful structure;
- tab/page navigation should have a logical focus order.

### Microsoft Xbox Accessibility Guideline 114 — UI Context
https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/114

Relevant principle:
- players should always understand where they are and what an interaction will do before activating it.

### Nielsen Norman Group — historical gesture usability research
The iPad App and Website Usability reports document an enduring discoverability problem with gesture-only navigation: people may never discover a swipe when no visual alternative or cue exists.

## Findings for Cellquation

### 1. Swipe is useful specifically between Worlds
Worlds are peers in a horizontal sequence. Moving W1 ↔ W2 ↔ W3 is therefore a natural use of a left/right swipe.

However, the visible World tabs must remain. Swipe is an accelerator, not the only route.

**Decision:** support left/right swipe over the World content while keeping W1/W2/W3 tabs fully tappable.

### 2. Do not add edge-swipe Back
Brave/Android and iOS already use edge gestures for browser/system navigation. Adding a Cellquation edge gesture risks conflict and accidental exits.

**Decision:** keep the visible Home/Back control; do not hijack screen edges.

### 3. Do not make 2/3 Colours swipe-only
There are only two clear states and the segmented toggle is already faster and more discoverable than a hidden gesture.

**Decision:** keep the explicit 2 COLOURS / 3 COLOURS toggle.

### 4. Gesture discoverability needs a cue
Because swipe is secondary, a tiny non-timed hint can teach it without becoming a tutorial modal.

**Decision:** on coarse-pointer/touch devices show `SWIPE WORLDS ↔` until the player successfully uses the gesture once. It is then remembered locally. The tabs remain usable before, during and after this hint.

### 5. Return flow currently loses context
A player who enters a level from lower in a World page can return via Levels and land back at the top. This creates unnecessary re-navigation.

**Decision:** remember the current campaign/world and session scroll position when a level is launched; if the player returns from that gameplay page, restore the same location.

### 6. Repeated play needs a Continue shortcut
The hierarchy is now short, but a returning player should not have to repeat it every time.

**Decision:** remember the last played level separately for 2 Colour and 3 Colour. Home displays a compact `CONTINUE` strip for the currently selected colour mode. Campaign cards still remain the normal browse route.

### 7. Remember the last World per campaign
Opening Foundations repeatedly should not always reset the browser to W1.

**Decision:** each campaign remembers its last selected World; reopening the campaign returns there.

### 8. Active World tabs should stay in view
On narrow phones, six World tabs require horizontal scrolling. The selected World can otherwise drift off-screen.

**Decision:** automatically center the active tab in the horizontal strip. The tab strip uses lightweight scroll snap and stays sticky on narrow touch screens, but not in the very short landscape layout.

### 9. Keyboard/tab semantics should match the visual model
Professional game UI should not make touch the only viable menu input.

**Decision:** World tabs use `role=tab`, one active tab in the tab order, `aria-selected`, `aria-controls`, and Left/Right/Home/End keyboard navigation.

### 10. Menu performance can improve without lowering visual quality
v0.7.6.4.9 loaded all four campaign JSON files before drawing Home even though only one colour mode is visible.

**Decision:** load only the two campaigns for the selected colour mode in parallel. Preload the other two later during idle time. This reduces first-use work without changing campaign data or visual quality.

## Interaction contract after the pass

### Home
- Tap **2 COLOURS / 3 COLOURS** to change system.
- Tap **Foundations / Living Networks** to browse.
- If available, tap **CONTINUE** for one-step return to the last level in the selected colour system.

### World/Levels
- Tap any visible World tab.
- Or swipe left/right across the World content on touch devices.
- Tabs remain the canonical visible navigation.
- Returning from gameplay restores the previous World and scroll position when possible.

### What is intentionally *not* added
- no gesture-only commands;
- no edge-swipe Back override;
- no swipe requirement for 2/3 Colours;
- no heavy blur/parallax/menu animation;
- no new gameplay rules;
- no changes to CellKit, Synapse, campaign data or the deep-sea background.

## Production recommendation

This is the interaction layer I would keep for the production menu architecture. Further polish should focus on real-device spacing/readability and not on adding more gesture vocabulary. A small number of predictable shortcuts is more professional than many hidden gestures.
