# HawsFun

Retro browser games and experiments, built with React, TypeScript and Vite, and hosted on Netlify.

## Running it locally

Needs Node 22.22 or later (see `.nvmrc`).

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

| Command           | What it does                               |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Development server with live reload        |
| `npm run build`   | Type-check and build the site into `dist/` |
| `npm run preview` | Serve the built `dist/` locally            |
| `npm run lint`    | Check the code with oxlint                 |
| `npm run format`  | Format the code with Prettier              |

## How it's organized

- `src/router.tsx`: every page's URL
- `src/games/registry.ts`: the list of games on the Games menu
- `src/games/<slug>/`: one folder per game, with its code, styles and images
- `src/games/GameHost.tsx`: runs a canvas game (a module exporting `start(container)`, which returns `stop()`) while its page is open
- `src/pages/`: Home, Games, Sandbox and About
- `src/styles/tokens.css`: the site's colors, fonts and sizes
- `docs/games/`: how each game behaves, the decisions for its rebuild, and a checklist to test it against

## Deploying

Netlify builds the site with `npm run build` and serves `dist/` (see `netlify.toml`). Any path that isn't a real file is sent to the React app, so links like `/games/carmen-racing` survive a page refresh.
