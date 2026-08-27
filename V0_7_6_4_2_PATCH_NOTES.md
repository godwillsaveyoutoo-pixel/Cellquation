# Cellquation Core v0.7.6.4.2 — Developer Quality Mode

Baseline: v0.7.6.4.1 Low-End Interior Material Fix.

## Developer mode
Open the game with `?dev=1`, for example:

`http://PHONE-LAN-IP:8080/?dev=1`

The DEV button then remains available while navigating through Cellquation.
It offers five renderer modes:

- AUTO — normal adaptive governor
- FULL — render detail 100%, edge density up to 1.75x/device DPR
- BALANCED — detail 78%, edge density up to 1.25x
- CONSTRAINED — detail 56%, protected 1.00x edge density
- CRITICAL — detail 34%, protected 1.00x edge density

The panel also shows actual tier, edge density, detail percentage, FPS and jank.
The selected developer tier prevents the adaptive governor from changing quality until AUTO is selected again.

No gameplay rules, cell presets, action animations or campaign data were changed.
