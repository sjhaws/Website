# Nephi Journey

A small Phaser-based retro platformer prototype themed around Nephi's journey.

## How to run

- Serve the site root with any static web server (for example `python3 -m http.server` from the repo root) and open `Pages/I Nephi V2/index.html`. `game.js` is an ES module, so opening the file directly (`file://`) won't work.
- `game.js` exports `start(container)`, which returns a `stop()` function that destroys the game.

## Controls

- Left and right arrows or `A` / `D`
- Jump with `Up`, `W`, or `Space`
- Touch screen buttons are shown on mobile or tablet screens

## Gameplay

- There are 6 levels.
- Reach the goal at the far right of each 10,000 px level to advance.
- Landing on top of a land enemy removes it; any other touch restarts the current level.
- Scroll pickups grant 3 seconds of invincibility, starting when the scroll message is closed.
