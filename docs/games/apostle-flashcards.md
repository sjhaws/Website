# Apostle Flashcards

- **Legacy** (in the git tag `legacy-static`): `Pages/LDS Flashcards/called-to-serve-flashcards.html`. One self-contained file holding all the CSS, JS, leader data and 15 photos embedded as base64.
- **New route:** `/games/apostle-flashcards`
- **Status:** rebuilt in React in `src/games/apostle-flashcards/` (2026-09-18). Every **Fix** and **Decided** item below is done, and the rules and the leader data have unit tests (`npm test`). The data is in `leaders.ts` (with `LEADERS_AS_OF`), and the photos are `photos/<slug>.jpg`. Four clues used to fit more than one leader: Rasband's and Stevenson's identical "Called to the Quorum of the Twelve Apostles on October 3, 2015", Renlund's "Sustained … October 3, 2015", and Soares's "Sustained … March 31, 2018" (Gong was sustained the same day). Each was reworded with a detail from that leader's own facts, and a test now fails if two leaders ever share an identical fact. The legacy copy was deleted from the site on 2026-09-18.

"Called to Serve — Flashcards". Each card shows one fact about a member of the First Presidency or the Quorum of the Twelve Apostles, and you pick that leader's name from a roster.

## Screens and flow

### Layout

- **Header:** "Flashcards" above the title "Called to Serve", three gold spire icons, and the subtitle:
  > Read the clue, then pick the leader it describes from the roster. Learn the First Presidency and Quorum of the Twelve Apostles of The Church of Jesus Christ of Latter-day Saints as of March 2026.
- **Stats bar:** **Matched** `0 / 15`, **Streak** `0`, **Time** `0:00`, and a **New Game** button.
- **Two columns:**
  - **Card column:** a progress bar, the flashcard, and a caption `Card N of 15`.
  - **Roster column:** "The Roster", the hint "Tap the name that matches the clue on the card.", and 15 name buttons in 2 columns, sorted by surname.
- **Narrow screens:** one column at 820 px wide or less; the roster becomes a single column at 480 px or less.

### Flow

1. **A new game starts automatically when the page loads.** The timer starts right away.
   - The 15 leaders are shuffled into the card order.
   - Each leader gets one of their 5 facts at random as the clue.
2. **Clue card:**
   - a temple icon
   - `Clue N of 15`
   - the clue text
   - the hint "Choose the matching name from the roster"
   - a button: `I don't know — show the answer`
3. **Correct name clicked:**
   - Matched +1 and the progress bar grows. Streak +1, and the best streak is tracked.
   - That name button turns green with `✓` and is disabled.
   - The **answer card** appears with a green inner border.
4. **Wrong name clicked:** Streak resets to 0 and the button shakes for 400 ms. You can keep guessing, with no limit.
5. **Skip button:** the right leader's name turns amber with `–` and is disabled, Streak resets to 0, and the answer card appears with an amber border.
6. **Answer card:**
   - the leader's photo, or initials on a colored circle if there's no photo
   - name and role
   - all 5 facts as a list
   - a **Next Card** button, which says **Finish** on the last card

   Roster clicks are ignored while it's showing.
7. **After Finish:**
   - The timer stops.
   - A pop-up shows "Well done!" and `You matched X of 15 leaders in M:SS, with a best streak of N.`
   - **Play Again** starts a new game.
8. **New Game** at any time reshuffles everything and resets the stats and timer.

## Rules and scoring

- **Matched:** leaders you named correctly. Skipped leaders don't count.
- **Streak:** correct answers in a row. A wrong guess or a skip resets it.
- **Time:** shown as `m:ss`, running from page load to Finish.
- Nothing is saved.

## Data

- **15 leaders**, each with `name`, `role` and exactly 5 `facts`, current as of March 2026:
  - the First Presidency (3)
  - the Acting President of the Twelve
  - 11 other members of the Quorum of the Twelve
- **Photos:** one per leader, 220×220 JPEG, about 7 KB each.
- **Fallback avatar:** initials of the first and last word of the name, on one of 6 colors chosen from a hash of the name.

**In the rewrite,** move the data into its own file and the photos into image files, so updating the roster doesn't mean editing game code:

```ts
// src/games/apostle-flashcards/leaders.ts
export const LEADERS_AS_OF = "2026-03";
export interface Leader {
  slug: string;    // "dallin-h-oaks" -> ./photos/dallin-h-oaks.jpg
  name: string;
  role: string;
  facts: string[]; // one is chosen at random as the clue
}
```

## Look

This game has its own theme, separate from the site's retro style:
- navy background (`#16233d` / `#0e182c`) with cream `#f4efe2` text and gold `#b6903f` / `#d8b877` accents
- serif headings ("Iowan Old Style", Georgia), sans-serif body text
- correct is green `#4a7a5c`, skipped is amber `#a66a2e`

**Keep** this look inside the shared site layout.

## Quirks and bugs

| Behavior | Action |
|---|---|
| The timer starts on page load, before the player has done anything | **Decided:** start the timer on the first name click or skip. It shows `0:00` until then. |
| The end pop-up always says "Well done!", even if every card was skipped | **Decided:** keep "Well done!" as the fixed headline |
| Wrong guesses only reset the streak and aren't counted anywhere | **Decided:** add a **Misses** stat next to Matched, Streak and Time, counting every wrong name click. Include it in the end summary, e.g. `You matched 14 of 15 leaders in 2:31 with 3 misses and a best streak of 9.` |
| Every matched or skipped name is disabled, so the last card can always be answered by elimination | **Keep** (it's by design); just be aware of it |
| Photos are base64 strings inside the HTML file | **Fix:** real image files |
| The roster is dated "as of March 2026" and will go out of date | **Fix:** keep the as-of date in the data file and show it from there |

## Acceptance checklist

- [ ] 15 cards, each leader exactly once, in a new order each game
- [ ] Each clue is one of that leader's 5 facts
- [ ] The roster is sorted by surname and doesn't change order during a game
- [ ] A correct pick: ✓ on the name, Matched and progress bar go up, Streak +1, answer card with green border
- [ ] A wrong pick: the button shakes, Streak goes to 0, Misses goes up by 1, and you can guess again
- [ ] Skip: `–` on the right name, Streak goes to 0, answer card with amber border
- [ ] Roster clicks are ignored while the answer card is showing
- [ ] The timer shows `0:00` until the first name click or skip, then counts up
- [ ] The last card's button says **Finish**; the pop-up says "Well done!" and shows matched count, time, misses and best streak
- [ ] New Game and Play Again fully reset, including the timer and Misses
- [ ] A missing photo falls back to the initials avatar
- [ ] Two columns on desktop, one column at 820 px and below
- [ ] Usable on a 375 px-wide phone

## Achievement hooks

- Match all 15 without skipping
- Finish with 0 misses and 0 skips
- Streak of 15, a perfect game
- Finish in under 2 minutes
