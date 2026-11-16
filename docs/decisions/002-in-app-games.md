# 002. Ship one original browser game in the MVP

- **Status:** Decided. The 1–3 minute round limit is superseded by
  [decision 012](012-game-session-length.md), and "viewer interaction is v2" by
  [decision 010](010-game-multiplayer-and-viewers.md); the rest stands.
- **Date:** Nov 15, 2026
- **Decided by:** Reece (project lead)

## Context
The product plan's risk table says the MVP ships 1–2 in-app games, while the rest of the plan
assumes streamers play any existing game through OBS. Building games adds a second product to a
10-week quarter.

## Decision
Both: streamers can stream any game via OBS, **and** the MVP ships exactly one small original
game built for streaming. A second game, and viewer interaction inside the game, are v2. *(Nov 16, 2026: decision 010 moves viewer
interaction and a 2-player mode into the MVP.)*

## Why
Keeping one game gives the demo something unique and gives the team content to stream during
cold start, while the constraints below keep it to one person's work over Weeks 3–8. Dropping
games entirely was the lower-risk option and was rejected.

## Consequences
- It's a **browser game** (Phaser 3 or plain Canvas) in `games/<slug>/`, deployed separately,
  streamed via OBS like any other game. No mobile capture needed.
- One mechanic, one screen, readable on a phone-sized stream. ~~1–3 minute rounds~~: superseded by
  [decision 012](012-game-session-length.md) (quick or long-form; a viewer who swipes in can tell
  what's happening within a few seconds).
- Fully original: its own name, rules, art and sound.
- It's a normal row in `games` with `is_original = true`.
- If it slips, cut to the simplest concept; the app's core loop takes priority over game polish.
