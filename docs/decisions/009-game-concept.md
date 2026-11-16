# 009. Which original game to build

- **Status:** Open (recommendation: Ringward; awaiting the team's pick at decision day)
- **Date:** Nov 16, 2026
- **Decided by:** not yet; the project lead and the game owner (workstream F) pick

## Context
Decision [002](002-in-app-games.md) commits the MVP to exactly one small original browser game.
On Nov 16, 2026 the project lead changed the criteria: the 1–3 minute round limit is dropped (the
game may be quick or a long "lock-in" game) and replaced by "a viewer who swipes in mid-stream can
tell what's happening within a few seconds" ([decision 012](012-game-session-length.md)).
Decision [011](011-stream-orientation.md) sets orientation: a portrait game fills the phone in the
feed; a landscape game shows at a third of the screen until a viewer joins, so it must read at
both sizes. Decision [010](010-game-multiplayer-and-viewers.md) adds viewer interaction, a
2-player mode and browser hosting. A teammate already added one candidate, The Biosphere Realm
(PR #5), an open-ended god-sim sandbox; this record weighs it against three new concepts.

## Options
**The final pick is between these candidates, and it is the team's call.** Scored in
[docs/game/concepts.md](../game/concepts.md):

Scores are out of 40 (eight criteria, 1–5 each), re-scored Nov 16, 2026 for the criteria above.

| Candidate | Orientation | One line | Score (of 40) |
|---|---|---|---|
| **Ringward** (new) | Portrait | Turn a shield around a core to block shards from every side; survive 2:00. Viewers launch the shards | **37** |
| Hot Core (new) | Portrait | Hold to charge a reactor, release to bank before it overloads | 29 |
| Lumen Drop (new) | Portrait | Steer a falling spark through mint gates and away from red ones | 28 |
| The Biosphere Realm, streaming mode | Landscape | Panels hidden, closer camera, one power tab, a goal on screen; viewers drop disasters | 25 |
| The Biosphere Realm, as is (PR #5, `games/the-biosphere-realm/`) | Landscape | God-simulation sandbox: shape a world and watch kingdoms rise and fall | 24; fails "readable on a phone stream" and "clear on swipe-in" |

## Recommendation
**Ringward.** Highest on every viewer-facing criterion: as a portrait stream it fills the phone
in the feed, someone swiping in understands it within a second or two, and viewers join in by
throwing the shards. It is also the cheapest to host for duo play. The Biosphere Realm no longer
fails on round length, and its long play is a strength, but as a landscape stream it is hard to
read at a third of a phone screen and doesn't show what's at stake; its streaming mode fixes most
of that but means forking a large codebase whose source of truth is another repository. It can
still be streamed on GameTime like any other game. Fallback if Ringward isn't fun by the end of
week 2: Hot Core, the smallest concept. Design: [docs/game/design.md](../game/design.md); greybox:
`games/ringward/` (plain Canvas + TypeScript with Vite, no engine).

## Consequences (once decided)
- Set this record to Decided, with who picked and when.
- If the pick isn't Ringward, rewrite `docs/game/design.md` for the chosen concept and replace
  the greybox; keep `concepts.md` as the record of the shortlist. Picking The Biosphere Realm
  as is would also mean accepting it as borderline on "one core mechanic" and failing "readable on a
  phone stream" and "clear on swipe-in" (see concepts.md), or building its streaming mode.
- Search the final name before it appears on a game page.
- Add the chosen game to `supabase/seed.sql` with `is_original = true` and a placeholder cover
  (next free id `00000000-0000-4000-a000-00000000000c`), and create its own Vercel project
  (README → "Deploying the game to Vercel").
- Decide what happens to the candidates that aren't picked: keep their folders under `games/`
  or remove them, and whether The Biosphere Realm keeps its local seed row and
  `is_original = true` (only the MVP's one original game should have that flag).
- Exit criterion 8 still needs the greybox streamed through OBS into the app once.
