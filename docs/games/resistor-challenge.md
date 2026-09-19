# Resistor Challenge

- **Legacy** (in the git tag `legacy-static`): `Pages/ResistorsJS-master/` (`index.html`, `index.js`, `main.css`, `download.jpeg`, `Color code.png`)
- **New route:** `/games/resistor-challenge`
- **Status:** rebuilt in React in `src/games/resistor-challenge/` (2026-09-18). Every **Fix** and **Decided** item below is done, and the answer parsing, scoring and high scores have unit tests (`npm test`). The clock now shows time left (60 → 0). A **Rules** button in the round opens the rules and color chart in a pop-up (Close, Escape or a click outside closes it). The clock keeps running while it's open, because the chart is effectively the answer key. A skip shows the answer you missed. The color chart image (from TheEngineeringProjects.com, with their web address on it) and the downloaded resistor symbol were replaced with a built-in table and drawings. High scores are saved under `hawsfun.resistor-challenge.high-scores`. The legacy copy was deleted from the site on 2026-09-18.

Read the color bands on a resistor and type its resistance and tolerance. You get as many correct as you can in 60 seconds.

## Screens and flow

The browser tab title is "Measure the Resistance"; the page heading is "Resistor Challenge".

| Screen | Content | Buttons shown |
|---|---|---|
| **Menu** (start) | Heading and a resistor photo (`download.jpeg`); footer `Copyright HAWSCO 2019` | New Game, High Scores, Rules |
| **Rules** | "How to Play" text (below) and the color chart `Color code.png` | New Game, High Scores, Rules, Main Menu |
| **High Scores** | "High Scores" and a numbered top-5 list (blank until scores exist), plus a **Verify Scores** button | New Game, High Scores, Rules, Main Menu |
| **Game** | "What is the Resistance?", `Score: N`, `Timer: N`, a drawn resistor, **Ohms** and **Tolerance** fields, **Next** button | New Game, Exit Game |

- **New Game** is always visible. Clicking it mid-game restarts the game.
- **Exit Game** returns to the Menu, stops the timer and doesn't record a score.
- **Main Menu** returns to the Menu.
- When High Scores is reached through a game over (not from the menu), High Scores and Rules stay hidden. Only New Game and Main Menu show.

### Game round

1. The timer counts up once per second, from 1 to 60.
2. The resistor shows 4 colored bands, with each color's name printed under its band. The Ohms field has focus.
3. Type the resistance in ohms and the tolerance as a percentage, then press **Next**. Pressing Enter also submits, but only from the Tolerance field.
   - **Correct:** the question's value is added to the score and a new resistor appears. If it was right on the first try, 1 second is taken off the elapsed time, which adds a bonus second.
   - **Wrong:** a `Try Again` warning shows, and the question's value drops by 1, down to a minimum of 1. You can't skip; you must get it right to move on.
4. **After 60 seconds:** `alert("Game Over. Your score was: N")`, then the High Scores screen with this score added to the top 5.

## Rules and scoring

### Generating a question

| Band | Meaning | Possible values |
|---|---|---|
| 1 | First digit | 1–9 |
| 2 | Second digit | 0–9 |
| 3 | Multiplier | ×10⁰ to ×10⁹ |
| 4 | Tolerance | gold = 5%, silver = 10% (equal chance) |

- The correct resistance is `(digit1 × 10 + digit2) × 10^multiplier` ohms, anywhere from 10 Ω to 99,000,000,000 Ω.
- Band colors: black 0, brown 1, red 2, orange 3, yellow 4, green 5, blue 6, violet 7, grey 8, white 9.
- On screen, brown is drawn as `sandybrown` and violet as `purple`.

### Checking the answer

- Answers are compared as numbers:
  - `4700`, `04700` and `4.7e3` all count as correct.
  - `4.7k`, `4,700` and `4700Ω` are all wrong.
- Tolerance must be exactly `5` or `10`; `5%` is wrong.

### Scoring

- Each question starts worth 5 points and loses 1 per wrong try, but never drops below 1.
- High scores are the top 5 kept in memory for the current visit only. A score equal to an existing one goes above it.

## Rules screen text

> You have 60 seconds to get as many correct answers as you can. Questions answered correctly on the first try are worth 5 points and you can only proceed to the next question once you have correctly answered the current question.
>
> The timer will begin at 0 and end when it hits 60 seconds. If you answer a question right the first time it will pause the timer for 1 second, giving you an additional time to answer questions.
>
> Every time a question is answered incorrectly it will lower the value of the question by 1 point (until the question is only worth 1 point, at which point is stays at 1 point until the question is answered).
>
> The figure below is a reminder of how resister values and tolerances are calculated:

This text has typos ("an additional time", "is stays", "resister"). **Fix** them in the rewrite, and add the new Skip rule and the accepted shorthand formats.

## Quirks and bugs

| Behavior | Action |
|---|---|
| During the 60th second the timer shows `Timer: 0` instead of `60` | **Fix** |
| High scores disappear on reload | **Fix:** save them in the browser (localStorage) |
| **Verify Scores** only redraws the list and shows "Scores have been verified" | **Fix:** remove it |
| Game over uses a browser `alert()` | **Fix:** show it in the page |
| Enter only submits from the Tolerance field | **Fix:** Enter submits from either field |
| No skip, so one hard question can use up the whole round | **Decided:** add a **Skip** button. It moves to a new resistor, scores 0 for the skipped one, and adds 3 seconds to the clock. |
| Ohms must be typed as plain digits | **Decided:** accept shorthand. Ohms: `4700`, `4,700`, `4.7k`, `4k7`, `2.2M`, `1G`, case-insensitive (`m` means mega, since no answer is below 10 Ω), with an optional `Ω` / `ohm` / `ohms` suffix and surrounding spaces. Tolerance: `5` or `5%`, `10` or `10%`. |
| The favicon points to an external flaticon URL | **Fix:** the shell provides the favicon |
| Loads Bootstrap 4 three times (grid, minified, full) | **Fix:** plain CSS Modules in the rewrite |

## Acceptance checklist

- [ ] Menu, Rules, High Scores and Game screens show the buttons listed in the table above
- [ ] Bands follow the table, and the correct answer matches the formula for every combination (worth a unit test)
- [ ] A first-try answer scores 5 and adds 1 bonus second
- [ ] Each wrong try lowers the value by 1, never below 1
- [ ] You can't move on without a correct answer or a skip
- [ ] Skip scores 0, shows a new resistor, and adds 3 seconds to the clock
- [ ] Shorthand answers are accepted: `4.7k`, `4k7`, `4,700`, `2.2M`, `1G`, `4700Ω`, `4.7 kohm` for ohms; `5` and `5%` for tolerance (worth a unit test)
- [ ] Answers that are close but wrong are rejected, e.g. `4.7` when the answer is 4700
- [ ] The round ends at 60 seconds, shows the score in the page, and goes to High Scores
- [ ] The top 5 is ordered correctly, includes the new score, and survives a reload
- [ ] Exit Game mid-round stops the timer and records nothing
- [ ] Enter submits from either field
- [ ] Usable on a 375 px-wide phone

## Achievement hooks

- Score 50 or more in one round
- Answer 5 questions in a row on the first try
