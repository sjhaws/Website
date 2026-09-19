# I, Nephi

- **Legacy** (in the git tag `legacy-static`): `Pages/I Nephi V2/` (`game.js`, `index.html`, `README.md`); sprites in `assets/*.webp`
- **New route:** `/games/i-nephi`
- **Status:** rebuilt in React in `src/games/i-nephi/` (2026-09-18). Every **Fix** and **Decided** item below is done; use the regression checklist to test it. The legacy copy was deleted from the site on 2026-09-18. Nephi got a walk animation on 2026-09-19 (see **How it plays**).
- **Type:** Phaser 3 game (3.80.1, loaded from a CDN as a global), moved into React as-is through `start(container)` / `stop()`

A six-level side-scrolling platformer following Nephi's journey from Jerusalem to the Promised Land. On the Games menu it's "I, Nephi"; the page title and README call it "Nephi Journey". The original V1 was retired.

## Module contract

`start(container)` creates a `Phaser.Game` with `container` as its parent. The game is 960×540 and scales to fit the container.

`stop()` calls `game.destroy(true)`. Phaser removes its canvas, its keyboard, mouse, resize and fullscreen listeners, and its game loop on the next frame.

**Known leftover:** Phaser adds a `visibilitychange` listener to `document` and never removes it. This is true in every version checked: 3.80.1, 3.90.0 and 4.2.1. Each visit to the game leaves one listener behind. It does nothing (it only signals a game that no longer exists), and it holds onto a tiny empty object. **Keep:** accept it, and check again when upgrading Phaser.

**In the React move:** replace the CDN `<script>` with `import Phaser from 'phaser'`, using `phaser@3.90` from npm. The sprite URLs already resolve relative to `game.js` (`new URL(..., import.meta.url)`), a pattern Vite supports.

## How it plays

- **Story card before each level:** `Level N`, the level title, a short story, and **Start** (or press Enter or Space).
- **Controls:**
  - Move with ← / → or `A` / `D`.
  - Jump with ↑, `W` or Space.
  - **Touch screens** (no buttons are drawn; `touchControls.ts`, with tests): slide a finger anywhere in the game's box to walk, and tap or flick up to jump. A second finger touching down also jumps, so it works with one thumb or two. On the ship level, sliding steers and nothing jumps. A tap on a scroll message's button never makes Nephi jump afterwards.
  - On a phone held upright, the game sits at the top of a taller box, and the space below it is part of the touch area, with a "Slide to walk · Tap to jump" hint, so a thumb needn't cover the game.
  - The story card says how to play on the device in use: touch or keyboard.
- **Animation:** every character's art is a single picture, so the game builds an 8-frame loop from each when it loads, by cutting out parts of the picture and moving them (`WALKERS`, `CRAWLERS` and `buildFrames` in `game.js`). Every move is a whole number of screen pixels, so the art doesn't shimmer.
  - **Nephi and the guards walk:** their feet slide back and forth below their clothes, each lifting as it swings forward; their hands swing the opposite way (for a guard, his shield one way and his spear the other); and their bodies dip on each stride. Nephi walks while moving along the ground (20 frames a second), holds a stride in the air, and stands still otherwise. The boat on the ship level doesn't animate.
  - **Snakes slither:** the raised neck and head sway, the tail tip wags, and the tongue flicks in and out (10 frames a second).
  - **Scorpions scuttle:** the tail sways, the legs step in alternating pairs, and the claws open and close (12 frames a second).
  - Enemies always move, each at a pace matching its speed and from a random point in its loop, so they're never in lockstep.
  - While a scroll is open, Nephi stands still and every enemy freezes.
- **Levels:** each is 10,000 px wide, and the goal sits at the far right.

  | # | Title | Goal label | Goal |
  |---|---|---|---|
  | 1 | Leaving Jerusalem | Reach the tent | tent |
  | 2 | Back to Jerusalem | Reach Jerusalem | city |
  | 3 | The Streets of Jerusalem | Find the book | Laban (guards on this level) |
  | 4 | Return to the Family | Return to the family | tent |
  | 5 | The Coastal Paradise | Reach the coast | shore |
  | 6 | Across the Ocean | Reach the promised land | boat (ship level) |

- **Enemies:** snakes and scorpions, plus guards on level 3.
  - Landing on top of a land enemy removes it and bounces you up.
  - Any other touch restarts the level.
  - On the ship level, any touch restarts.
- **Scrolls:** 3 per level, at ¼, ½ and ¾ of the way across. Picking one up pauses the game and shows a message with **Proceed**. After closing it you're invincible for 3 seconds. The counter reads `Scrolls: N/3`.
- **Ending:** after level 6, a "Journey Complete" screen says "Nephi and his family have reached the Promised Land." **Play Again** returns to level 1's story card.

## Quirks and bugs

| Behavior | Action |
|---|---|
| Three `console.log` lines are still in the code, including one that fires on every frame the player overlaps an enemy | **Fix:** remove them, or only log in a debug mode |
| Phaser 3.80.1 comes from a CDN; the latest release is 4.2.1 | **Decided:** install `phaser@3.90` from npm in the React app (the last Phaser 3 release). Play through all six levels once to confirm nothing changed. Phaser 4 can be a separate upgrade later. |
| The `visibilitychange` listener leftover (see Module contract) | **Keep** |

## Regression checklist

- [ ] Level 1's story card appears; **Start**, Enter and Space all begin the level
- [ ] Arrow keys, `A`/`D` and `W`/Space move and jump, and no buttons are drawn on screen
- [ ] On a phone: sliding walks either way, and a tap, a flick up or a second finger jumps; the page doesn't scroll or zoom while playing
- [ ] Nephi's feet step and his hands swing while he walks either way; he stands still when stopped or reading a scroll, and holds a stride in the air
- [ ] Landing on a snake or scorpion removes it; walking into one restarts the level
- [ ] A scroll shows its message, and after **Proceed** you're briefly invincible
- [ ] Reaching the goal moves on to the next level's story card
- [ ] Snakes slither and flick their tongues, scorpions scuttle and snap their claws, and level 3's guards march, none in step with each other, and all freeze while a scroll is open
- [ ] Level 3 has guards and Laban as the goal; level 6 is the ship, with left/right only
- [ ] The ending screen appears after level 6, and **Play Again** returns to level 1
- [ ] After leaving the game the canvas is gone, keys do nothing, and the game loop stops. Exactly one `document` `visibilitychange` listener per visit is expected to remain.
- [ ] Leaving and reopening the game doesn't make it run faster
