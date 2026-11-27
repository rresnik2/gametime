# Ringward: fish in a barrel (greybox)

GameTime's original browser game, **chosen** in [decision 009](../../docs/decisions/009-game-concept.md)
(Nov 17, 2026). "Ringward" is the working title; the final name is the team's call. It's at
greybox stage: the full rules, with code-drawn placeholder art and no sound. Design:
[docs/game/design.md](../../docs/game/design.md); the shortlist it came from:
[docs/game/concepts.md](../../docs/game/concepts.md).

An orange goldfish in a wooden barrel swings a shield on a stick to bat away cartoon cannonballs
for two minutes; each BONK leaves slapstick bruises, a black eye or a band-aid, and three make it
dizzy. Old-timey and tropical, no blood or gore. Streamed
**portrait** (9:16; see the design doc). On a stream, viewers fire the cannonballs from the
GameTime app (*raids*), and a friend can join as a second goldfish with its own shield (*duo*); see [decision 010](../../docs/decisions/010-game-multiplayer-and-viewers.md)
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

## Deploy

Deploy the Git repository as a separate Vercel project with `games/ringward` as its Root Directory.
The [game Vercel config](vercel.json) runs `npm ci` and `npm run build`, then publishes `dist/`.
See [the repository deployment guide](../../README.md#deploying-ringward-to-vercel) for project settings.

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
| `src/game.ts` | The rules: shards (cannonballs), the core (the fish), shields (solo and duo), viewer launches, scoring, win/lose. Neutral names, no DOM or network, so it's unit tested; the code-to-screen glossary is in the design doc |
| `src/waves.ts` | The fixed wave table (tune difficulty here) |
| `src/render.ts` | Canvas drawing: barrel, goldfish, cannonballs, HUD and the old-film finish; the 9:16-safe layout; theme colours in `THEME` and `VINTAGE` |
| `src/main.ts` | Canvas setup, input, simulated viewers, the frame loop, best score in `localStorage` |

Plain Canvas + TypeScript with Vite; no game engine. It's kept out of the Expo app's lint,
typecheck and Jest runs, and CI builds it in its own job ("Game").
