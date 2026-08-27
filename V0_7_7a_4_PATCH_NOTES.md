# v0.7.7a.4 — Audio Reliability & Adaptive Network Scale

## 1. Ambience reliability

A concrete bug was found in v0.7.7a.3:

```js
Number(localStorage.getItem(VOL_KEY))
```

returns `0` when the key does not yet exist because `Number(null) === 0`. This caused a first-time player's intended default ambience volume to become **0%**.

v0.7.7a.4 checks for `null` before conversion and uses a real default of **62%**.

The user-supplied MP3 has also been re-levelled by **+7.5 dB**. Measured average level changes from about `-29.1 dB` to `-22.1 dB`, with a measured maximum around `-5.2 dB`, so useful headroom remains.

The session manager now records active intent before a navigation can unload the current document. If a browser blocks autoplay after navigation, gesture listeners stay armed until playback succeeds.

## 2. Pause audio controls

All four gameplay pause dialogs now contain:

- Ambience volume slider (`0–100%`)
- current percentage
- playback status (`Playing`, `Muted`, `Tap to start`)
- Mute / Unmute

Volume and mute state persist through `localStorage`.

## 3. Adaptive Living Networks scaling

The previous camera fit used:

```js
neededW = maxX * 2
neededH = maxY * 2 * aspect
```

For a wide display this increases camera scale with screen aspect, which makes the network **smaller** as the screen gets wider.

The renderer's actual world bounds are aspect-aware. v0.7.7a.4 therefore fits against those real bounds:

```js
neededScaleX = (maxX * 2) / max(1, aspect)
neededScaleY = (maxY * 2) / max(1, 1/aspect)
```

On a desktop stage around the user's supplied screenshot aspect (~2.4:1), the old camera made typical networks about **2.4× smaller** than the mathematically fitted size. Portrait calculations are unchanged in practice.

## 4. Protected systems

Unchanged relative to v0.7.7a.3:

- CellKit renderer and visual profiles
- user aesthetic preset
- Synapse renderer and canonical animation data
- Foundations game logic
- campaign datasets
- v0.7.7a.3 Imitation/Brood accent work
