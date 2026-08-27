# v0.7.6.4.10 — Gesture & Return Flow

Built from v0.7.6.4.9 Streamlined Home + World/Levels.

## Added
- left/right swipe between Worlds on touch devices;
- visible World tabs remain the primary/alternative control;
- one-time persistent-until-used `SWIPE WORLDS ↔` hint on coarse-pointer devices;
- active World tab auto-centering and horizontal scroll snap;
- sticky World tabs on narrow touch screens;
- keyboard Left/Right/Home/End navigation for World tabs;
- per-colour one-tap `CONTINUE` strip on Home after a level has been played;
- per-campaign last-World memory;
- return-to-Levels session scroll restoration;
- subtle last-played level highlight.

## Loading optimization
- Home no longer waits for all four campaign JSON files.
- Only the selected colour mode's two campaign files load initially, in parallel.
- The other colour mode preloads later during idle time.

## Gesture safety
- swipe is never required;
- screen-edge swipe is intentionally not captured;
- vertical scrolling is preserved;
- a committed horizontal swipe suppresses the following accidental tile click;
- reduced-motion preference disables World entrance animation.

## Protected systems
No intentional changes to:
- CellKit renderer or aesthetic preset;
- Synapse renderer/choreography;
- campaign data;
- gameplay rules/actions;
- deep-sea PNG background;
- adaptive gameplay performance governor.
