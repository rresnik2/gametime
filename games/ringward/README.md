# Ringward (greybox)

GameTime's original browser game, at greybox stage: the core mechanic with placeholder shapes,
no art, no sound. It is the **recommended** concept, not yet the chosen one
([decision 009](../../docs/decisions/009-game-concept.md)). Design:
[docs/game/design.md](../../docs/game/design.md); the shortlist it came from:
[docs/game/concepts.md](../../docs/game/concepts.md).

Keep the core alive for two minutes: turn the shield to block shards before they crack it.
Streamed **portrait** (9:16; see the design doc). On a
stream, viewers launch the shards from the GameTime app (*raids*), and a friend can join with a
second shield (*duo*); see [decision 010](../../docs/decisions/010-game-multiplayer-and-viewers.md)
and [hosting-and-interaction.md](../../docs/game/hosting-and-interaction.md). The greybox has the
rules for both; the networking isn't built yet, so viewers are simulated.

## Run it

From the repository root, one command (installs the game's own dependencies, then opens it):

```bash
npm run game
```

Or from this folder: `npm install`, then `npm run dev`. Requires Node 24.

| Command (in this folder) | What it does |
|---|---|
| `npm run dev` | Vite dev server, opens the browser |
| `npm test` | Rule tests (`node --test`, no extra dependencies) |
| `npm run build` | Typecheck, then a static build in `dist/` |
| `npm run preview` | Serve the built `dist/` |

## Controls and options

| Input | Action |
|---|---|
| Mouse | Turn the shield towards the pointer |
| A / D, ← / → | Turn the shield (duo: P1 A / D, P2 ← / →) |
| Click, Space, Enter | Start or restart |
| G | Show the 9:16 crop guides (what survives in GameTime's vertical feed) |
| P | Autopilot on/off |

URL options (combine with `&`):

| Option | What it does |
|---|---|
| `?duo` | Two shields on one keyboard |
| `?viewers=20` | 20 simulated viewers raid (launch shards with their names) |
| `?autopilot` | Shields play themselves and rounds restart; handy as an OBS browser source |
| `?guides` | Start with the 9:16 crop guides on |

In dev, the console has `ringward` (the game state) and `ringwardLaunch({ slot, by })`.

## Layout

| File | Holds |
|---|---|
| `src/game.ts` | The rules: shards, shields (solo and duo), viewer launches, scoring, win/lose. No DOM or network, so it's unit tested |
| `src/waves.ts` | The fixed wave table (tune difficulty here) |
| `src/render.ts` | Canvas drawing and the 9:16-safe layout, in GameTime's palette |
| `src/main.ts` | Canvas setup, input, simulated viewers, the frame loop, best score in `localStorage` |

Plain Canvas + TypeScript with Vite; no game engine. It's kept out of the Expo app's lint,
typecheck and Jest runs, and CI builds it in its own job ("Game").
