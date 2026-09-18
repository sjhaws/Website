# Carmen Racing

- **Legacy:** `Pages/Carmen Racing/` (`game.js` module, `index.html`, `style.css`); sprites in `assets/Carmen.webp`, `car.webp`, `tree.webp`
- **New route:** `/games/carmen-racing`
- **Type:** canvas game, moved into React as-is through `start(container)` / `stop()`

An endless top-down racer on a three-lane road. Dodge cars, collect flags, and the road keeps speeding up.

## Module contract

`start(container)` builds the game inside `container`:
- the 320×480 canvas
- on-screen ← and → buttons
- a **Start** button
- the instructions
- a **Restart** button

While running it holds:
- a `keydown` listener on `document`
- `resize` and `orientationchange` listeners on `window`
- one `requestAnimationFrame` loop

`stop()` cancels the loop, removes those listeners, and empties the container.

**Changed in the refactor:** the phone buttons used to talk to the game through custom `window` events and a global `window.carmenGameStarted` flag. Now they call the game directly. This also fixes a bug where, after clicking Restart, resizing a small screen brought the Start button back mid-race.

## How it plays

- **Starting:** the road is still until you press **Space** (or tap **Start** on a small screen).
- **Steering:** ← and → move one lane at a time. On screens under 600 px in either dimension, on-screen arrow buttons do the same.
- **What comes down the road:**
  - A car appears in a random lane every 60 frames, and a flag every 90 frames.
  - Driving over a flag adds 1 to the score.
  - Hitting a car ends the game.
  - Trees on the grass scroll at twice the road speed.
- **Speed:**

  | | Starting speed | Increase every 180 frames | Top speed |
  |---|---|---|---|
  | Desktop | 4 px per frame | +0.5 | 12 |
  | "Mobile" | 2 px per frame | +0.25 | 6 |

  "Mobile" means a phone or tablet browser, or a window under 600 px in either dimension.
- **Game over:** `GAME OVER` and `Press Space or Restart` are drawn on the canvas, and the **Restart** button appears. Space or Restart starts a new race straight away.

## Quirks and bugs

| Behavior | Action |
|---|---|
| Movement is per frame, so on a 120 Hz or 144 Hz display the whole game runs 2 to 2.4 times faster | **Fix:** scale movement by elapsed time |
| The ← and → in the instructions show as `_` in the Press Start 2P font | **Fix** |
| The on-screen arrows only respond to touch, so in a narrow desktop window they show but don't work with a mouse | **Fix:** use pointer events |
| Whether the game counts as "mobile" is rechecked every frame, so resizing mid-race changes the top speed | **Fix:** decide once per race |
| Space and the arrow keys also scroll the page | **Fix:** `preventDefault()` for game keys |

## Regression checklist

- [ ] Canvas, instructions and a hidden **Restart** button appear; the road is still until Space
- [ ] Space starts the race; ← and → change lanes one at a time, stopping at the edges
- [ ] Flags add to the score, and a car ends the race with `GAME OVER`
- [ ] **Restart** and Space both start a new race after a crash
- [ ] On a 375 px-wide screen: the arrows and **Start** show; tapping Start hides it and begins; tapping the arrows changes lanes
- [ ] While playing there's 1 `document` listener, 2 `window` listeners and 1 animation loop (about 60 frames a second); after leaving the game there are none
- [ ] Leaving and reopening the game doesn't make it run faster
