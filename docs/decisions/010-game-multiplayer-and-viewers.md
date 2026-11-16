# 010. The MVP game has viewer interaction and a 2-player mode

- **Status:** Decided
- **Date:** Nov 16, 2026
- **Decided by:** Reece (project lead)

## Context
Decision [002](002-in-app-games.md) made viewer interaction with the original game a v2 stretch.
Reviewing the game shortlist ([009](009-game-concept.md)), the project lead asked for the game to
be rethought for multiplayer, hosting and viewer interaction, since a single-player game gives
viewers nothing to do that they couldn't do with any other stream.

## Decision
The MVP's original game ships with:
- **Viewer interaction:** viewers act in the game from the GameTime app (for Ringward: they
  launch the shards, as "raiders").
- **Multiplayer, both kinds:** streamer vs viewers, plus a **2-player duo mode** (a partner
  joins online by invite link, or plays on the same keyboard).
- **Hosting without a game server:** the streamer's browser runs the game; Supabase Realtime
  carries messages; viewer actions go through an Edge Function that checks identity.

## Why
Viewer interaction is what makes an original game worth having on a streaming app: it turns
watching into playing. Options considered: keep it v2 but design for it (rejected: the lead
wants it in the MVP), and online multi-player matches only (rejected: needs netcode and
matchmaking, and ignores viewers). The host-authoritative design needs no server and reuses
Supabase, which the app already uses for chat and presence (decision 003).

## Consequences
- Supersedes the part of 002 that made viewer interaction v2; the rest of 002 stands (one
  browser game, original, streamed via OBS; its round-length limit was dropped by
  [decision 012](012-game-session-length.md)).
- The concept pick (009) now also weighs viewer interaction, duo and hosting cost; Ringward's
  lead grew (see `docs/game/concepts.md`).
- More people touch the game: backend (Edge Function, Realtime Authorization policies and RLS
  tests) and app (a Raid bottom sheet), as in `docs/game/hosting-and-interaction.md`. Phase 2–3
  tickets need owners.
- Cuts to stay near 6 weeks for the game owner: no matchmaking, leaderboards, persistent viewer
  stats, shard skins or mobile version. "Play with me" stays v2.
- Raids depend on stream delay, so D1 should prefer a low-latency mode.
- Safety: only real usernames appear on stream (no free text), blocked viewers can't raid,
  anonymous viewers can't raid, and the streamer can switch raids off.
