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
  - On levels 4 and 5, `X` or `J` swings Nephi's sword; on touch screens, a quick flick down.
  - On level 3, ↑ / `W` at a ladder climbs it and ↓ / `S` on a roof beside one climbs down; Space jumps off. On touch screens, sliding a finger up or down at a ladder climbs, and a tap jumps off (a flick up on a ladder just climbs).
  - **Touch screens** (no buttons are drawn; `touchControls.ts`, with tests): slide a finger anywhere in the game's box to walk, and tap or flick up to jump. A second finger touching down also jumps, so it works with one thumb or two. On the ship level, sliding steers and nothing jumps. A tap on a scroll message's button never makes Nephi jump afterwards.
  - On a phone held upright, the game sits at the top of a taller box, and the space below it is part of the touch area, with a "Slide to walk · Tap to jump" hint, so a thumb needn't cover the game.
  - The story card says how to play on the device in use: touch or keyboard.
- **Screen size:** the game is as big as the window allows at 16:9, below the header and title, even wider than the rest of the site's pages. On a phone held upright it runs edge to edge.
- **Full screen:** a **Full screen** button beside the title puts the game in the browser's full-screen mode (`useFullscreen.ts`), and on phones that allow it, turns the game sideways. iPhones only allow full screen for videos, and some browsers refuse or never answer, so there the game covers the whole window instead. A ✕ in the corner, Escape, or the phone's back gesture leaves full screen.
  - The game resizes whenever its box changes size (`start` in `game.js` watches it), because Phaser's own occasional size checks could leave the game sized for upright after a phone turned sideways in full screen.
- **Animation:** every character's art is a single picture, so the game builds an 8-frame loop from each when it loads, by cutting out parts of the picture and moving them (`WALKERS`, `CRAWLERS` and `buildFrames` in `game.js`). Every move is a whole number of screen pixels, so the art doesn't shimmer.
  - **Nephi and the guards walk:** their feet slide back and forth below their clothes, each lifting as it swings forward; their hands swing the opposite way (for a guard, his shield one way and his spear the other); and their bodies dip on each stride. Nephi walks while moving along the ground (20 frames a second), holds a stride in the air, and stands still otherwise. The boat on the ship level doesn't animate.
  - **Snakes slither:** the raised neck and head sway, the tail tip wags, and the tongue flicks in and out (10 frames a second).
  - **Scorpions scuttle:** the tail sways, the legs step in alternating pairs, and the claws open and close (12 frames a second).
  - Enemies always move, each at a pace matching its speed and from a random point in its loop, so they're never in lockstep.
  - **Sharks and whales swim:** their tails beat up and down (sharks at 10 frames a second, whales at 6).
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

- **Enemies:** snakes and scorpions, plus guards on level 3, lions on levels 2, 4 and 5, and sharks and whales on level 6.
  - Landing on top of a land enemy removes it and bounces you up.
  - **Level 3 (the streets):** instead of platforms, a row of stone buildings lines the street (`STREET` and `streetLayout` in `game.js`, the same every time). They alternate tall and short: tall roofs are out of jumping reach, so every tall building (every other one) has a ladder; short roofs can be jumped onto from the street, and from them the next roof. Roofs only hold Nephi up from above, so he walks in front of the buildings and jumps up through a roof's edge onto it. Each building and its ladder is drawn once, when the level starts, into a picture of its own (`placeBuilding`): drawn as shapes, the street was nearly 14,000 of them redrawn every frame, which made phones stutter. Climbing shows Nephi from behind (`NephiClimb.webp`, drawn for this site in his style: holding on, then reaching up with one hand and foot and then the other).
  - **Laban's sword (levels 4 and 5):** Nephi carries it upright in his forward fist, where it moves with the fist as he walks (`swordGrip` in `game.js`). A swing is a short move in four poses built from his art like his walk frames (`SWORD_POSES`): he winds up, leaning back with the sword raised; lunges in, stepping forward and thrusting out his fist as the blade whips over with a slash streak; follows through with the fist low and the blade pointing down and ahead; and straightens up as the sword comes back, about a third of a second in all (`SWORD_SWING`). His other hand swings the opposite way for balance. Mid-swing the sword is drawn in front of him, carried behind his fingers. Any enemy the blade touches from the strike to the recovery is killed, in a burst. The sword (`Sword.webp`) was drawn for this site, with a gold hilt after 1 Nephi 4:9.
  - **Lions:** three on each of levels 2, 4 and 5, a quarter, a half and five-sixths of the way along, on the ground. They hunt like the guards (below), chasing at 175 px/s, a bit faster than guards and still slower than Nephi; a platform counts as leaving the ground. Their poses (`Lion.webp`, all facing right) come from a pixel-art lion sheet supplied for the site, reduced to its true pixel grid and cleaned to one palette (`LION_FRAMES` in `game.js`): a 4-step walk on patrol; a roar when one spots Nephi, held for 0.45 s before it bounds after him in a crouching stride and a leap; standing to look around for 0.7 s when it loses him; and, every 5 to 10 seconds on patrol, sitting for 1.5 to 3 seconds, still watching. Beaten by the sword or stomped on, a lion lies down and fades away.
  - **Guards** stay on the street. A guard who sees Nephi (facing him, on the street, within 380 px) shows a red "!" and chases him at 150 px/s, slower than Nephi. When Nephi climbs a ladder or reaches a roof, or gets 640 px away, the guard shows a "?" and patrols again from where he is.
  - Any other touch restarts the level.
  - **Level 6 (at sea):** 7 sharks and 4 whales cruise back and forth under the water, each at its own depth and pace, within 280 px of where it starts. Every 0.9 to 2.4 seconds (a little longer at the start of the level), one within 520 px of the boat hunts it: it dashes along underneath, following the boat for up to 2.5 seconds, then surges up through the surface where it's got to and dives back down. It stops following once it surges, so turning or stopping at that moment dodges it; sharks surge faster than the boat sails, so outrunning them doesn't work. Whales are big and slower (`SEA_CREATURES` and the `SEA_…` settings in `game.js`). Touching one restarts the level.
  - The water's surface is drawn see-through in front of the sea creatures and the boat's hull, so they look underwater.
  - **Art:** the boat (an ancient ship with a striped sail and the family looking over the side), the shark and the whale were drawn for this site as pixel art at 3× to match the other sprites (`Ship.webp`, `Shark.webp`, `Whale.webp`), replacing the triangle boat that was drawn in code.
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
- [ ] The game fills the window without the page scrolling; **Full screen** fills the screen (sideways on Android phones), stays filled and centered when the phone turns either way, and ✕ or Escape leaves it
- [ ] Nephi's feet step and his hands swing while he walks either way; he stands still when stopped or reading a scroll, and holds a stride in the air
- [ ] Landing on a snake or scorpion removes it; walking into one restarts the level
- [ ] A scroll shows its message, and after **Proceed** you're briefly invincible
- [ ] Reaching the goal moves on to the next level's story card
- [ ] Snakes slither and flick their tongues, scorpions scuttle and snap their claws, and level 3's guards march, none in step with each other, and all freeze while a scroll is open
- [ ] Level 3 has guards and Laban as the goal; level 6 is the ship, with left/right only
- [ ] Levels 4 and 5: Nephi carries the sword as he walks and jumps; `X`, `J` or a flick down swings it, and it kills any enemy it touches
- [ ] Levels 2, 4 and 5 each have three lions on the ground that roar and chase Nephi on sight ("!") and give up ("?") when he gets onto a platform; now and then one sits down, and a beaten lion lies down and fades
- [ ] Level 3: buildings line the street; every other one has a ladder that Nephi climbs (shown from behind) up to its roof and back down; short roofs can be jumped onto, and roof to roof; a guard facing Nephi on the street chases him ("!") and gives up ("?") once he climbs
- [ ] On level 6 the boat sits in the water; sharks and whales swim underwater with beating tails, now and then surge up at the boat, and restart the level if they hit it; turning or stopping as one surges dodges it; the boat bobs smoothly, including after picking up scrolls
- [ ] The ending screen appears after level 6, and **Play Again** returns to level 1
- [ ] After leaving the game the canvas is gone, keys do nothing, and the game loop stops. Exactly one `document` `visibilitychange` listener per visit is expected to remain.
- [ ] Leaving and reopening the game doesn't make it run faster
