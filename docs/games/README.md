# Game behavior specs

These docs describe how each screen-based game behaves today, so the React rewrite can be checked against them. They are written from the legacy source (tag `legacy-static`), which stays playable during the migration from `public/legacy/`, so you can compare old and new side by side.

Each doc has the same sections:

- **Screens and flow**: every state the player can be in and how they move between them
- **Rules and scoring**: the logic to reproduce exactly
- **Messages**: exact user-facing text, including typos, so nothing gets lost by accident
- **Quirks and bugs**: each one tagged **Fix**, **Keep**, or **Decided** (a design choice made before the rewrite, listed below)
- **Acceptance checklist**: what to verify on the React version before deleting the legacy copy
- **Achievement hooks**: suggestions only, for the site-wide achievements system

## Games

| Game | Legacy source | New route | Doc |
|---|---|---|---|
| Rock Paper Scissors | `Pages/RPSApp-master/` | `/games/rock-paper-scissors` | [rock-paper-scissors.md](rock-paper-scissors.md) |
| Memory Game | `Pages/MemoryGame-master/` | `/games/memory-game` | [memory-game.md](memory-game.md) |
| Battleship | `Pages/Battleship/` | `/games/battleship` | [battleship.md](battleship.md) |
| Resistor Challenge | `Pages/ResistorsJS-master/` | `/games/resistor-challenge` | [resistor-challenge.md](resistor-challenge.md) |
| Apostle Flashcards | `Pages/LDS Flashcards/` | `/games/apostle-flashcards` | [apostle-flashcards.md](apostle-flashcards.md) |

### Canvas games

These aren't rewritten. Each is an ES module that exports `start(container)`, which builds the game inside `container` and returns `stop()`, which removes everything it added. React will mount them through a small `GameHost` component. Their docs describe the module contract, how they play, and a regression checklist.

| Game | Legacy source | New route | Doc |
|---|---|---|---|
| Retro Dungeon Crawler | `Pages/RetroCrawler/` | `/games/retro-dungeon-crawler` | [retro-dungeon-crawler.md](retro-dungeon-crawler.md) |
| Carmen Racing | `Pages/Carmen Racing/` | `/games/carmen-racing` | [carmen-racing.md](carmen-racing.md) |
| I, Nephi | `Pages/I Nephi V2/` | `/games/i-nephi` | [i-nephi.md](i-nephi.md) |

Because the canvas games are ES modules, their legacy pages need to be served over HTTP (for example `python3 -m http.server` from the repo root). Opening the HTML files directly (`file://`) no longer works.

## Shared across games

- **Page shell:** every legacy game has its own "Back to Games" form button and no favicon. The React layout replaces both, so those details aren't repeated in each doc.

## Decisions (made 2026-09-18)

Each doc's Quirks table marks these as **Decided**:

1. **Rock Paper Scissors:** totals are saved in the browser, and a **Reset scores** button clears them.
2. **Memory Game:**
   - Add an **Easy / Hard** choice; Hard uses the 14 space images (28 cards).
   - Face-down cards show an illustrated card back instead of numbers.
   - The board shows on load, and the timer starts on the first flip.
3. **Battleship:**
   - Add a difficulty setting: **Easy** fires at random; **Normal** (default) hunts, targets, and remembers damaged ships.
   - Reveal the enemy's unsunk ships at game over.
   - Add a **Randomize** button for placing your fleet.
4. **Resistor Challenge:**
   - Add a **Skip** button (0 points, +3 seconds).
   - Accept shorthand answers like `4.7k`, `4k7`, `2.2M` and `5%`.
5. **Apostle Flashcards:**
   - The timer starts on the first guess or skip.
   - Keep "Well done!" as the end headline.
   - Add a **Misses** stat.
6. **Retro Dungeon Crawler:** an **Easy / Hard** difficulty. On Easy, wandering enemies can catch you; on Hard, they chase you.
7. **I, Nephi:** use Phaser 3.90 from npm in the React app.
