# Cellquation Core v0.7.7a.8

**Pass:** Menu Luminance & Bioluminescence — a brighter, more alive level-select palette plus phase-safe ambient-audio continuity across page navigation.

This build continues directly from **v0.7.7a.6 — Level Status Clarity**.


## v0.7.7a.8 changes

- Lifts Home and level-browser surfaces out of the near-black/grey range without turning the interface into neon.
- Lets more of the deep-sea blue/teal artwork remain visible behind the menu.
- Brightens text, borders, ratio pills and selected world tabs.
- Keeps `NEW` calm, completed cards moderately accented, and `CONTINUE` as the strongest navigation state.
- Keeps three-colour mode distinctly violet after the general luminance lift.
- Replaces broad glow with small concentrated bioluminescent accents.
- Makes underwater ambience phase-safe across page/button navigation: seek to the persisted phase first, then play.
- Preserves the existing volume/mute settings and session-continuity storage.

## v0.7.7a.6 changes

- Level-select status clarity pass: completion, performance, and active/unfinished state are separate signals.
- Completed levels use a compact organic check badge plus a subtle campaign-accent tint.
- Stars are shown only after completion and communicate performance only.
- Unplayed levels show `NEW` without empty stars.
- The last unfinished level can show `▶` + `CONTINUE`; completed levels are never labelled Continue.
- A just-completed level gets one brief check-badge settle animation; reduced-motion users get a static badge.

## v0.7.7a.5 changes

- Adds slow, asynchronous visual drift to every idle Living Network cell.
- Adds a very small whole-cell breathing term and rotational sway.
- Idle synapse endpoints follow the same temporary render pose, so connections stay attached.
- Canonical node positions, sockets, hit targets, routes and action geometry do not move.
- Cells directly involved in Fusion, Split, Brood, Destruct, Swap or Imitation stop their added idle drift during the action.
- Other nodes keep a reduced amount of motion so the network does not freeze as a whole.
- Selected nodes move less for clearer targeting.
- Low/Critical tiers reduce the added motion amplitude.
- `prefers-reduced-motion` disables the added Living Network idle motion.

## Retained from v0.7.7a.4

- Reliable underwater ambience with persistent Pause volume/mute controls.
- Adaptive Living Network camera fitting on wide/fullscreen displays.
- Unified WebGL deep-sea background pipeline and recovered local fluorescence.
- Brood and Imitation accent improvements.

## Run locally

```bash
./run.sh
```

For a cache-clean phone test after older builds:

```bash
./run.sh 8084
```

Then open the printed Smartphone URL while phone and computer are on the same Wi-Fi.


## v0.7.7a.8
Target cells are now nucleus-free organic mini-cells; Living Network idle wobble is visibly stronger; broad artificial gameplay glow fields were removed to expose the deep-sea background more cleanly.
