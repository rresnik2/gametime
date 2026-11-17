# 009. Which original game to build

- **Status:** Decided
- **Date:** Nov 16, 2026 (options); decided Nov 17, 2026
- **Decided by:** Reece (project lead)

## Context
Decision [002](002-in-app-games.md) commits the MVP to exactly one small original browser game.
On Nov 16, 2026 the project lead changed the criteria: the 1–3 minute round limit is dropped (the
game may be quick or a long "lock-in" game) and replaced by "a viewer who swipes in mid-stream can
tell what's happening within a few seconds" ([decision 012](012-game-session-length.md)).
Decision [011](011-stream-orientation.md) sets orientation: a portrait game fills the phone in the
feed; a landscape game shows at a third of the screen until a viewer joins, so it must read at
both sizes. Decision [010](010-game-multiplayer-and-viewers.md) adds viewer interaction, a
2-player mode and browser hosting. A teammate already added one candidate, The Biosphere Realm
(PR #5), an open-ended god-sim sandbox; this record weighed it against three new concepts.

## Options
Scored in [docs/game/concepts.md](../game/concepts.md), out of 40 (eight criteria, 1–5 each):

| Candidate | Orientation | One line | Score (of 40) |
|---|---|---|---|
| **Ringward** (new) | Portrait | Turn a shield around a core to block shots from every side; survive 2:00. Viewers fire the shots | **37** |
| Hot Core (new) | Portrait | Hold to charge a reactor, release to bank before it overloads | 29 |
| Lumen Drop (new) | Portrait | Steer a falling spark through mint gates and away from red ones | 28 |
| The Biosphere Realm, streaming mode | Landscape | Panels hidden, closer camera, one power tab, a goal on screen; viewers drop disasters | 25 |
| The Biosphere Realm, as is (PR #5, `games/the-biosphere-realm/`) | Landscape | God-simulation sandbox: shape a world and watch kingdoms rise and fall | 24; fails "readable on a phone stream" and "clear on swipe-in" |

## Decision
**Ringward's mechanics, re-themed as "shooting fish in a barrel".** The lead's words: "lets go
with the ringward concept but change the theme to shooting fish in a barrel. there could be 1 or
2 fishes in the center holding a shield." Further direction the same day: an orange goldfish with
bright red lips, a wooden barrel, tropical with character details, cannonballs as the
projectiles, a faster fish, damage that shows progressively, and an old-timey, nostalgic look.

- **Rules unchanged** except the shield's swing speed (720°/s mouse, 420°/s keys, up from 540 and
  300). Solo is one goldfish holding a shield; duo is two goldfish, each with a shield. Viewer
  raids fire the cannonballs, labelled with usernames.
- **Theme**, recorded in [docs/game/design.md](../game/design.md): a top-down wooden barrel of
  lagoon water; cartoon cannonballs fired in over the rim; a ball that gets through is a "BONK!"
  that adds visible cartoon damage (bump, band-aid, droopy eye, stars), and three make the fish
  "DIZZY!". Non-violent: no blood, wounds or explosions. Old-film, carnival-postcard finish.

## Name (the team's call)
"Ringward" stays the working title in code, paths and the seed row, so nothing breaks. Proposed
names that fit the theme (search each on the web and app stores before using one):

1. **Finvincible**: a goldfish that can't be beaten, as long as you keep swinging.
2. **Goldie's Barrel**: old-timey, like a fairground stall sign.
3. **Bonk Barrel**: says what happens, short enough for a game chip.

Renaming later means: the `games` row's name and slug, the title card in `render.ts`, the docs,
and optionally the folder and Realtime channel prefix (`ringward:`); the folder rename is a
separate, deliberate change.

## Why
Ringward scored highest on every viewer-facing criterion: as a portrait stream it fills the phone,
someone swiping in understands it within a second or two, and viewers join in by firing the shots.
It is also the cheapest to host for duo play. The re-theme keeps all of that and gives it
characters people can root for.

## Consequences
- **The other candidates are not picked.** Lumen Drop and Hot Core were concepts only (nothing
  to remove). **The Biosphere Realm** stays in `games/the-biosphere-realm/` as a game anyone can
  stream through OBS; its local seed row (`…00b`) now has `is_original = false`, so only the MVP
  game is marked original.
- **Seed:** the placeholder "GameTime Original (TBD)" row (`…001`) is now `ringward` / Ringward
  with `is_original = true`. Production gets its row through P3-DATA-06 (#58) as before.
- **Blocker lifted:** backlog tickets marked ⛔ GAME are no longer blocked on the concept; the
  `blocked:game-concept` label comes off their issues.
- **Mockups:** `docs/game/mockups/` still shows the abstract Ringward; the mockups session
  re-themes it from the design doc.
- The game has its own look, outside GameTime's flat palette, by the lead's direction; P1's
  shield keeps a faded GameTime purple. Fonts and art get finalised in Phase 3 (P3-GAME-01).
- Exit criterion 8 still needs the greybox streamed through OBS into the app once.
