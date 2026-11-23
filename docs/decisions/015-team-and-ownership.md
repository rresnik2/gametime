# 015. Team of two: Reece builds the app, Sudip builds the game and the streaming backend

- **Status:** Decided
- **Date:** Nov 22, 2026
- **Decided by:** Reece (project lead)

## Context
The Phase 1 plan's workstreams (§4) are written for 4–5 people. The team is two: Reece
(`rresnik2`) and Sudip (`SudipKing`). The Phases 2–4 backlog is 90 issues, 153 points when sized
S = 1, M = 2, L = 4, for weeks 3–10.

## Decision
Split the work by area and by folder, so the two rarely edit the same files.

| | Reece | Sudip |
|---|---|---|
| Area | The Expo app and everything users touch: feed, in-app playback, auth, onboarding, profiles, chat, reactions, Discover, the Go Live screens, safety UI. The app's data: feed ranking, profiles, search, chat filters, schedule. Design, QA, release and the demo | The original game (Ringward, decision 009) and everything that happens when someone goes live: provider and ingest, the start/end webhook, stream cleanup, viewer-count snapshots, summary stats, OBS settings and the OBS guide's content, the fallback loop. The game's sessions, Realtime policies and `ringward-launch` function. Edge Functions in CI |
| Folders | `src/`, the app's migrations | `games/`, `supabase/functions/`, the game's and the stream lifecycle's migrations |
| Issues | 59 (100 points) | 31 (53 points) |

The two halves meet at the `streams` table (`status`, `playback_url`, `viewer_count`,
`orientation`) and at the game's channel messages
([docs/game/hosting-and-interaction.md](../game/hosting-and-interaction.md)). A change to either
goes in a PR the other person reviews. Phase 4's QA and demo tickets are Reece's to run; both take
part.

Phase 1, week 2:
- **Reece:** the provider account (AWS for IVS, per decision 001's cost estimate) with access for
  Sudip; add Sudip to the Expo team and the Supabase org; raise required PR approvals to 1; D4;
  the clickable prototype and hallway test (§4A).
- **Sudip:** the rest of the D1 spike (OBS ingest, start/end events, latency, Android),
  `docs/obs-setup.md`, and streaming the Ringward greybox through OBS (exit criterion 8).
- **Both:** the wireframe review and the game's name.

## Why
- Splitting "app" from "games" alone gave Reece 71 issues (120 points) and Sudip 19 (33). The
  streaming backend is server-side and apart from the app's screens, and Sudip needs OBS → app
  working to test the game anyway.
- Owning folders keeps two people out of each other's files, and reviewing each other's PRs
  spreads knowledge both ways.
- Rejected: splitting by phase (both people in every file), and giving Sudip design or the app's
  data queries (both tied to Reece's screens day to day).

## Consequences
- Each issue's assignee and **Owner** field, and [docs/backlog.md](../backlog.md), name the owner
  (Nov 22, 2026). Reassign on the issue first, then the file.
- Reece still carries about twice Sudip's points. Look for cuts on the app side when Phase 2
  starts. Moving the online duo partner (P2-GAME-08, #105, size L) to v2 is an option on the game
  side, not decided.
- Sudip hasn't worked in `games/ringward/` yet: start from [docs/game/design.md](../game/design.md),
  [hosting-and-interaction.md](../game/hosting-and-interaction.md) and the greybox.
- Open: whether The Biosphere Realm also ships in the MVP. Shipping it would supersede decision
  002's "exactly one original game" and add to Sudip's half.
- With two people, one person out stalls half the project. Required reviews are the mitigation.
