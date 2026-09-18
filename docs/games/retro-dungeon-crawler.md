# Retro Dungeon Crawler

- **Legacy:** `public/legacy/Pages/RetroCrawler/` (`game.js` module, `index.html`, `style.css`)
- **New route:** `/games/retro-dungeon-crawler`
- **Status:** rebuilt in React in `src/games/retro-dungeon-crawler/` (2026-09-18). Every **Fix** and **Decided** item below is done; use the regression checklist to test it. The legacy copy is no longer linked from the site and can be deleted once you're happy with the React version.
- **Type:** canvas game, moved into React as-is through `start(container)` / `stop()`

Walk a randomly generated dungeon from the top-left corner to the exit in the bottom-right, avoiding enemies. Each level adds more enemies.

## Module contract

`start(container)` builds an info bar (**Restart** button, status text, level counter) and a 1280×960 canvas inside `container`.

While running it holds:
- one `keydown` listener on `document`
- one interval that moves the enemies every 500 ms
- a `touchstart` listener on its own canvas

`stop()` clears the interval, removes the `keydown` listener, and empties the container.

## How it plays

- **The map:** 40×30 tiles of 32 px, with walls around the edge and about 12% random walls inside.
  - The player is a green circle starting at the top left (1, 1).
  - The exit is a yellow tile at the bottom right (38, 28).
- **Moving:**
  - Arrow keys or `w` `a` `s` `d` move one tile. Walls block.
  - Tapping the canvas moves one step toward the tap, along whichever direction is farther.
- **Enemies:** red triangles, 4 on level 1. Each takes one random step every 500 ms. They never step onto the player's tile.
- **Walking into an enemy:** `Game Over!`. Movement stops until **Restart**.
- **Reaching the exit:** `Level Up!`, the level goes up by 1, and the enemy count is multiplied by 1.5 and rounded up (4, 6, 9, 14, 21, 32, …). The player returns to the start of a new random map.
- **Restart:** back to level 1 with 4 enemies on a new map.

### Messages

| Where | Text |
|---|---|
| Status | `Find the exit!`, `Level Up!`, `Game Over!` |
| Level counter | `Level: N` |

## Quirks and bugs

| Behavior | Action |
|---|---|
| Level 15 needs 1,233 enemies, more than the roughly 930 open tiles, so placing them never finishes and the tab freezes | **Fix:** cap the enemy count |
| Random walls can cut off every path to the exit, or box in the start. The only way out is Restart, which goes back to level 1. | **Fix:** check that a path exists, and regenerate the map if not |
| Enemies never move onto the player, so you can only lose by walking into one | **Decided:** add an **Easy / Hard** difficulty next to **Restart**. Changing it restarts at level 1; Easy is the default. **Easy:** enemies wander at random as now, but one stepping onto your tile ends the game. **Hard:** each enemy steps toward you along whichever direction is farther, trying the other direction if a wall blocks it (so walls can trap them), and catching you ends the game. Enemy counts and speed start the same on both; tune them after playtesting. |
| `w` `a` `s` `d` only work in lowercase, so Shift or Caps Lock breaks them | **Fix** |
| Arrow keys also scroll the page | **Fix:** `preventDefault()` for game keys |
| The 1280 px canvas is wider than most laptops and every phone, and tap-to-move assumes the canvas isn't scaled | **Fix:** scale the canvas to fit, and convert taps using that scale |
| `player.hp` is set to 3 but never used; one hit ends the game | **Fix:** remove the unused field |

## Regression checklist

Run after moving into React (and after any change to the module):

- [ ] The info bar shows **Restart**, `Find the exit!` and `Level: 1`, and the map draws right away
- [ ] Arrow keys and `wasd` move one tile; walls block
- [ ] Enemies move about twice a second
- [ ] **Easy / Hard** can be switched at any time; switching restarts at level 1, and Easy is the default
- [ ] Easy: enemies wander at random, and one stepping onto you shows `Game Over!`
- [ ] Hard: enemies move toward you, get stuck behind walls, and catching you shows `Game Over!`
- [ ] Walking into an enemy shows `Game Over!` and stops movement; **Restart** returns to level 1
- [ ] Reaching the exit shows `Level Up!` and `Level: 2`, with 6 enemies
- [ ] While playing there's 1 `document` `keydown` listener and 1 interval; after leaving the game there are none, and keys do nothing
- [ ] Leaving and reopening the game doesn't make enemies move faster
