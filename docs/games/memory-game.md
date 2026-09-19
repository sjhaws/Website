# Memory Game

- **Legacy** (in the git tag `legacy-static`): `Pages/MemoryGame-master/` (`index.html`, `js/main.js`, `css/main.css`, `images/`, plus Bootstrap 3 in `css/bootstrap16/`)
- **New route:** `/games/memory-game`
- **Status:** rebuilt in React in `src/games/memory-game/` (2026-09-18). Every **Fix** and **Decided** item below is done, and the game rules have unit tests (`npm test`). Images were resized to 360 px WebP (1.5 MB → 282 KB). All 14 Hard-mode space images were replaced with NASA photos so they match. Four of the originals (Mars, Neptune, Uranus, Venus) also carried VectorStock watermarks. Credits are listed under the board in Hard mode, and sources are in `assets/space/CREDITS.md`. The legacy copy was deleted from the site on 2026-09-18.

Find the 10 pairs of animals among 20 face-down cards. The game counts tries and time.

## Screens and flow

1. **Before starting:** title "Memory Game", a green **New Game** button, "Number of Tries:" and "Time:" (both blank). The board is hidden and every card is disabled.
2. **New Game:** the board appears with 20 blue cards labelled `1` to `20` (5 per row on wide screens). Tries shows `0`, Time shows `0`, and the timer starts. The animals are shuffled across the 20 positions.
3. **Playing:**
   - **First card:** turns orange and shows its animal. It can't be clicked again.
   - **Second card:** turns orange and shows its animal. Then one of two things happens:
     - **Match:** both cards turn teal and stay face up and disabled. Tries +1. The next card can be clicked after 500 ms.
     - **No match:** after 1000 ms both cards turn back to blue with their numbers and become clickable again. Tries +1.
   - **Clicking a third card during either wait:** a browser `alert()` pops up (see Messages), and the click does nothing else.
4. **Win:** after the 10th match (and its 500 ms wait), `alert("You Win!!")` appears and the timer stops. The final time stays on screen.
5. **New Game** at any point resets tries, time and cards, and reshuffles.

## Rules and scoring

- **Tries:** counts every pair turned over, matched or not. A perfect game is 10 tries.
- **Time:** counts up in whole seconds. It shows `0` at the start, then `Min: M Sec: S` (e.g. `Min: 1 Sec: 5`).
- There's no score beyond tries and time, and nothing is saved.

## Messages

| When | Text | Shown as |
|---|---|---|
| Win | `You Win!!` | `alert()` |
| Third card clicked while two are showing | `Slow down turbo, you can only select two options at a time.` | `alert()` |

## Assets

**Used:** 10 animal PNGs in `images/`: dog, cat, bird, elephant, whale, shark, bear, lion, horse and cow. Cat and bird are drawn at 10/12 of the card width; the rest at full width.

**Only used by the unfinished hard mode:** 14 space JPGs (asteroid, blackhole, earth, jupiter, mars, moon, mercury, neptune, pluto, saturn, sun, star, uranus, venus). See Quirks.

## Quirks and bugs

| Behavior | Action |
|---|---|
| Clicking **New Game** during a game starts a second timer without stopping the first, so time counts 2× (or faster) | **Fix** |
| Flipping one card and then clicking **New Game** leaves that card "selected", so the next click is treated as the second card | **Fix** |
| Win and "slow down" messages use browser `alert()` dialogs | **Fix:** show win in the page; ignore clicks while the board is waiting |
| Time shows `0`, then switches to `Min: 0 Sec: 1` format | **Fix:** one format, e.g. `0:00` |
| **Hard mode is half-built:** a 28-card board commented out in `index.html`, plus a list of 30 image slots (15 pairs) that includes `comet.jpg`, which doesn't exist. Players can't reach it. | **Decided:** build it. Add an **Easy / Hard** choice: Easy is the 20 animal cards; Hard is 28 cards from the 14 space images (no comet). Changing difficulty starts a new game. |
| Face-down cards show the numbers 1 to 20 | **Decided:** use an illustrated card back in the site's retro style, with no numbers |
| The board stays hidden until **New Game** is clicked | **Decided:** show a shuffled board on load; the timer starts on the first flip. **New Game** still reshuffles and resets at any time. |
| Loads Bootstrap 4 twice (full and minified) plus Bootstrap 3 | **Fix:** plain CSS Modules in the rewrite |

## Acceptance checklist

- [ ] Easy: 20 cards, 10 animals, each exactly twice, shuffled differently each game
- [ ] Hard: 28 cards, 14 space images, each exactly twice; no missing images
- [ ] Switching between Easy and Hard starts a new game
- [ ] A shuffled board shows on load; face-down cards show the card back, not numbers
- [ ] A matched pair stays face up and can't be clicked
- [ ] A mismatched pair flips back after about 1 second
- [ ] Clicks during the wait are ignored, with no dialog
- [ ] Tries counts every pair; a perfect game shows 10 on Easy, 14 on Hard
- [ ] The timer starts on the first flip and stops on the win, at normal speed even after several New Games
- [ ] New Game mid-game gives a fully clean board: no card left selected, tries 0, time 0
- [ ] The win is announced in the page, not in an `alert()`
- [ ] Usable on a 375 px-wide phone

## Achievement hooks

- Win in 10 tries (perfect memory)
- Win in under 30 seconds
