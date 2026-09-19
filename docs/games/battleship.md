# Battleship

- **Legacy** (in the git tag `legacy-static`): `Pages/Battleship/` (`index.html`, `game.js`, `style.css`); ship art in `assets/*.webp`
- **New route:** `/games/battleship`
- **Status:** rebuilt in React in `src/games/battleship/` (2026-09-18). Every **Fix** and **Decided** item below is done, and the rules and game flow have unit tests (`npm test`). Two additions: a placement preview under the pointer, and a **Start Battle** button, so the battle no longer starts the moment the last ship is placed (you can re-Randomize or change difficulty first). The legacy copy was deleted from the site on 2026-09-18.

Classic Battleship against a computer. Place five ships, then take turns firing until one fleet is sunk.

## Screens and flow

The page shows the title "Battleship", two 10×10 boards side by side ("Your Board" and "Enemy Board"), one message line, and a **Restart** button that only appears when the game ends.

### 1. Placement

- Ships are placed in a fixed order:

  | Ship | Size |
  |---|---|
  | Carrier | 5 |
  | Battleship | 4 |
  | Cruiser | 3 |
  | Submarine | 3 |
  | Destroyer | 2 |

- The clicked cell on your board is the ship's first cell. The ship runs to the right (horizontal, the default) or downward (vertical).
- **R** (either case, handled on the whole window) switches between horizontal and vertical. It only works during placement.
- Every cell where the current ship would fit gets a green outline (`2px solid #2d7a2d`). Clicking anywhere else does nothing.
- Ships can't overlap or leave the board, but they may touch.
- Each placed ship shows its artwork. The art is drawn vertically, so horizontal ships are rotated 90°.
- After the Destroyer, the enemy fleet is placed randomly under the same rules, and your turn begins.

### 2. Battle

- **Your turn:** click any enemy cell you haven't fired at.
  - Hit: the cell turns red with `X`.
  - Miss: the cell turns green with `•`.
  - The enemy board then stops accepting clicks, and the enemy fires 800 ms later.
- **Enemy turn:** the result is marked on your board the same way (red `X` for a hit, green `•` for a miss). A hit cell covers that part of the ship art. Then it's your turn again.
- **Enemy targeting:**
  - With nothing queued, it fires at a random cell it hasn't tried.
  - On a hit, it queues the 4 neighboring cells (up, down, left, right) that haven't been fired at and aren't already queued. It fires at queued cells in the order they were added.
  - When it sinks any ship, it clears the whole queue.

### 3. Game over

- **The first side to land 17 hits wins** (all five ships).
- Win message: `You win! All enemy ships sunk!`. Loss message: `You lose! All your ships sunk!`.
- **Restart** appears and goes back to placement with empty boards.
- Enemy ships are never revealed, even after you lose.

## Messages

| When | Text |
|---|---|
| Placing a ship | `Place your <Ship> (<n> cells). Click to place. Press R to rotate.` |
| Placement done | `Your turn! Click a cell on the enemy board.` |
| You hit | `Hit!` |
| You sink a ship | `You sank the enemy's <Ship>!` |
| You miss | `Miss!` |
| Enemy hits | `Enemy hit your ship!` |
| Enemy sinks a ship | `Enemy sank your <Ship>!` |
| Enemy misses | `Enemy missed!` |
| Win / loss | `You win! All enemy ships sunk!` / `You lose! All your ships sunk!` |

## Look

The site's retro theme:
- 'Press Start 2P' font, yellow `#FBD000` text with a green shadow, black background
- Cells are 32 px squares with 2 px gaps on a dark board with a green glow
- Hit cells are red `#E52521`; miss cells are green `#43B047`

## Quirks and bugs

| Behavior | Action |
|---|---|
| Your hit or sink message only shows for 800 ms before the enemy's result replaces it | **Fix:** show both, e.g. two lines or a short log |
| When the enemy sinks one ship it forgets about damaged ships it hasn't finished | **Decided:** add a difficulty setting, chosen during placement and locked once the battle starts. **Easy:** fires at random untried cells. **Normal** (default): hunt and target, and after a sink it keeps chasing hits on ships it hasn't sunk yet. |
| The enemy fleet is never shown, even when you lose | **Decided:** when the game ends, show the enemy's unsunk ships on their board |
| Rotating needs the **R** key, so phone and tablet players can't rotate | **Fix:** add a Rotate button |
| The two boards need about 750 px of width and overflow on phones | **Fix:** stack the boards on narrow screens |
| No random placement for the player, and no undo | **Decided:** add a **Randomize** button that places the whole fleet at once, replacing any ships already placed. No undo. |
| The **R** listener is attached to `window` | **Fix:** remove it when the game unmounts (it would leak in the single-page app) |
| The "Back to Games" button is clipped by a `margin-left: 45%` rule | **Fix:** the shell provides navigation |

## Acceptance checklist

- [ ] Ships are placed in the order Carrier, Battleship, Cruiser, Submarine, Destroyer
- [ ] Only cells where the ship fits are highlighted and clickable
- [ ] Rotate works by keyboard and by touch
- [ ] **Randomize** places all five ships legally and replaces any placed by hand
- [ ] Difficulty can be changed during placement but not once the battle starts; Normal is the default
- [ ] Ship art lines up with the cells in both directions
- [ ] The enemy fleet is placed randomly and never overlaps
- [ ] The enemy board ignores clicks during the enemy's turn and on cells already fired at
- [ ] The enemy fires about 800 ms after your shot
- [ ] Easy: enemy shots are random and never repeat a cell
- [ ] Normal: the enemy targets neighbors after a hit, and after sinking a ship it goes back to any other ship it has damaged
- [ ] Sinking messages name the right ship for both sides
- [ ] The game ends at 17 hits with the right message, and Restart gives a clean placement phase
- [ ] After a loss, the enemy's unsunk ships are shown on their board
- [ ] Pressing **R** after leaving the page does nothing (listener removed)
- [ ] Usable on a 375 px-wide phone

## Achievement hooks

- Win a game
- Win without losing a ship
- Sink the enemy fleet in under 40 shots
