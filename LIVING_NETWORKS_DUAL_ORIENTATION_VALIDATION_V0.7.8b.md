# Living Networks Dual-Orientation Validation — v0.7.8b

## Goal
Portrait and landscape are both first-class Living Networks presentation modes. Gameplay topology, node ids, actions, solver state and authored edge bends remain unchanged.

## Design decision
The earlier portrait work is kept as the canonical portrait presentation instead of being replaced by a new generic layout. v0.7.8b fixes portrait detection on compact phones and introduces a separate landscape composition path.

- **Portrait:** retain authored orientation and the existing portrait fill grammar; detect portrait from the real viewport instead of `canvasAspect < .82`.
- **Landscape:** evaluate original vs quarter-turned geometry, choose the better screen match, then rebalance the layout around its centre so it becomes wider and shallower without changing topology.
- **Dense landscape graphs:** 8–11 node networks use slightly tighter median edge spacing so cells do not become tiny on 215px-high playfields.

## Runtime behaviour
- Device rotation never changes node ids or graph edges.
- Resize during an active Fusion/Split/action is deferred until the action completes via the existing `pendingNetworkTransform` safety path.
- No level is restarted merely because orientation changes.
- The PWA manifest now uses `"orientation": "any"`.

## Validation viewports
The shared layout function was run over all 48 two-colour and all 48 three-colour Living Networks at:
- 390×844 portrait (estimated stage 390×629)
- 360×640 portrait (estimated stage 360×425)
- 640×360 landscape (estimated stage 640×215)
- 780×360 landscape (estimated stage 780×215)
- 1280×720 desktop landscape (estimated stage 1280×543)

## Layout metrics
These are geometry estimates using the Fusion-cell radius. Split/Brood cells can render larger.

### Two-colour Living Networks
| View | Median visual cell | Minimum visual cell | Median fill X | Median fill Y |
|---|---:|---:|---:|---:|
| 390×844 portrait | 53.9 px | 35.5 px | 0.78 | 0.78 |
| 360×640 portrait | 48.5 px | 32.6 px | 0.76 | 0.83 |
| 640×360 landscape | 40.9 px | 33.6 px | 0.64 | 0.64 |
| 780×360 landscape | 43.6 px | 35.9 px | 0.62 | 0.62 |
| 1280×720 desktop | 95.5 px | 77.9 px | 0.67 | 0.67 |

### Three-colour Living Networks
| View | Median visual cell | Minimum visual cell | Median fill X | Median fill Y |
|---|---:|---:|---:|---:|
| 390×844 portrait | 63.0 px | 50.4 px | 0.75 | 0.72 |
| 360×640 portrait | 50.2 px | 38.2 px | 0.66 | 0.82 |
| 640×360 landscape | 46.2 px | 41.9 px | 0.59 | 0.59 |
| 780×360 landscape | 47.8 px | 44.6 px | 0.57 | 0.57 |
| 1280×720 desktop | 108.9 px | 97.9 px | 0.62 | 0.62 |

The densest two-colour layouts can have a visible membrane below 44 px, but the existing node hit radius is about 1.78× the visible Fusion-cell diameter. The minimum interactive target therefore remains roughly 58–60 px on the compact audited phone layouts.

## Collision gate
Minimum centre-to-centre distance divided by visible Fusion-cell diameter:
- 2C, 390×844 portrait: **1.59×**
- 2C, 360×640 portrait: **1.59×**
- 2C, 640×360 landscape: **1.34×**
- 2C, 780×360 landscape: **1.27×**
- 3C, 390×844 portrait: **1.65×**
- 3C, 360×640 portrait: **1.65×**
- 3C, 640×360 landscape: **1.40×**
- 3C, 780×360 landscape: **1.32×**

No audited layout produces cell-centre overlap.

## Orientation choices
- Portrait intentionally keeps the authored orientation for all 48 + 48 networks.
- Landscape selects a quarter-turn for 35/48 layouts in each campaign family; already-horizontal bridge/twin-route/ladder-style structures stay in their more suitable orientation.
- Structural spot-checks were done for the 9-node Y/fork, 10-node double-loop and 11-node asymmetric networks. Their portrait and landscape forms remain recognisably the same graph while using the available axis appropriately.

## Browser limitation
The container Chromium build cannot initialize EGL/WebGL, so the final shader/frame-pacing visual smoke test still belongs on the physical A20/Oppo. The orientation maths, collision spacing, module wiring, resize path and all 96 authored network mappings are validated offline.

## Verdict
**DUAL-ORIENTATION LAYOUT GATE: PASS (physical-device visual smoke test still required).**
