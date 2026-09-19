# I, Nephi

- **Legacy** (in the git tag `legacy-static`): `Pages/I Nephi V2/` (`game.js`, `index.html`, `README.md`); sprites in `assets/*.webp`
- **New route:** `/games/i-nephi`
- **Status:** rebuilt in React in `src/games/i-nephi/` (2026-09-18). Every **Fix** and **Decided** item below is done; use the regression checklist to test it. The legacy copy was deleted from the site on 2026-09-18.
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
  - On-screen `<` `>` `^` buttons are always shown. The ship level has no jump button.
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
- [ ] Arrow keys, `A`/`D`, `W`/Space and the on-screen buttons move and jump
- [ ] Landing on a snake or scorpion removes it; walking into one restarts the level
- [ ] A scroll shows its message, and after **Proceed** you're briefly invincible
- [ ] Reaching the goal moves on to the next level's story card
- [ ] Level 3 has guards and Laban as the goal; level 6 is the ship, with left/right only
- [ ] The ending screen appears after level 6, and **Play Again** returns to level 1
- [ ] After leaving the game the canvas is gone, keys do nothing, and the game loop stops. Exactly one `document` `visibilitychange` listener per visit is expected to remain.
- [ ] Leaving and reopening the game doesn't make it run faster
