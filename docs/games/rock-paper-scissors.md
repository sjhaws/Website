# Rock Paper Scissors

- **Legacy:** `public/legacy/Pages/RPSApp-master/` (`index.html`, `js/main.js`, `css/main.css`, `images/`)
- **New route:** `/games/rock-paper-scissors`
- **Status:** rebuilt in React in `src/games/rock-paper-scissors/` (2026-09-18). Every **Fix** and **Decided** item below is done, and the rules have unit tests (`npm test`). Totals are saved under the browser storage key `hawsfun.rock-paper-scissors.totals`. The legacy copy is no longer linked from the site and can be deleted once you're happy with the React version.

Endless rounds against a computer that picks at random. The only state is three running totals.

## Screens and flow

One screen, with no start or end:

1. Header: `images/logo.png` and the title "Rock, Paper, Scissors".
2. White panel with:
   - a **Result** box showing the outcome of the last round (empty before the first round)
   - three image buttons: rock, paper, scissors
   - **Your Choice:** and **Computer's Choice:**, which show `Rock`, `Paper` or `Scissors`
   - **Your Score:**, **Number of Draws:** and **Computer's Score:**

All values are blank until the first round, then update after every click.

## Rules and scoring

- Clicking a button plays one round right away. The computer picks Rock, Paper or Scissors with equal probability.
- Rock beats Scissors, Scissors beats Paper, Paper beats Rock. The same choice on both sides is a draw.
- Win: your score +1. Loss: computer score +1. Draw: draws +1.
- Totals only reset when the page reloads.

## Messages

| When | Text | Color |
|---|---|---|
| Win | `You Win` | green |
| Loss | `You Loose` | red |
| Draw | `Draw` | orange |

## Assets

`images/logo.png` (283×178), `images/rock1.jpeg`, `images/paper1.jpeg`, `images/scissors1.jpeg` (214×236 each).

## Quirks and bugs

| Behavior | Action |
|---|---|
| Loss message is misspelled "You Loose" | **Fix:** "You Lose" |
| Scores are blank, not 0, before the first round | **Fix:** start at 0 |
| Totals are lost on reload, and there's no way to reset them | **Decided:** save the totals in the browser so they survive leaving and returning, and add a **Reset scores** button that sets them back to 0 |
| Fixed 900 px-tall panel with a float-based grid; not responsive | **Fix:** responsive layout |

## Acceptance checklist

- [ ] Each of the three buttons plays exactly one round
- [ ] All 9 combinations score correctly: 3 wins, 3 losses, 3 draws
- [ ] Your choice and the computer's choice are shown after each round
- [ ] The outcome message and its color match the table above (with the typo fixed)
- [ ] Totals start at 0 on a first visit and add up to the number of rounds played
- [ ] Totals are still there after leaving the game and coming back, and after a reload
- [ ] **Reset scores** sets all three totals to 0 and clears the last result
- [ ] Usable on a 375 px-wide phone

## Achievement hooks

- Win 3 rounds in a row
- Play 50 rounds
