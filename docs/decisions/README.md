# Decision records

One file per decision, numbered in order. 001–006 match D1–D6 in `PHASE_1_PLAN.md` §3.

| # | Decision | Status |
|---|---|---|
| [001](001-streaming-provider.md) | Streaming provider | **Open** |
| [002](002-in-app-games.md) | Ship one original browser game in the MVP | Decided (round limit superseded by 012, viewer interaction by 010) |
| [003](003-viewer-count.md) | Viewer counts from Realtime Presence | Decided |
| [004](004-anonymous-viewing.md) | Watching without an account | **Open** |
| [005](005-age-gate.md) | Age gate: 13+ to use, 16+ to stream | Decided |
| [006](006-stream-key-security.md) | Stream keys in an owner-only table | Decided |
| [007](007-accounts-and-hosting.md) | Accounts, regions and app IDs | Decided |
| [008](008-brand-mark-and-app-icons.md) | Brand mark and app icons | Decided |
| [009](009-game-concept.md) | The original game: Ringward, re-themed as fish in a barrel (name TBD) | Decided |
| [010](010-game-multiplayer-and-viewers.md) | The MVP game has viewer interaction and a 2-player mode | Decided |
| [011](011-stream-orientation.md) | Vertical feed; landscape streams rotate when you join them | Decided |
| [012](012-game-session-length.md) | The original game may be quick or long-form (replaces 002's round limit) | Decided |
| [013](013-jev-dev-tool.md) | Jev (TypeSafe) as a dev-time judgment tool, not in the app | Decided |
| [014](014-game-session-engine.md) | A shared session engine for every game (host, players, viewers, AIs) | **Proposed** |

## Adding a record

Copy this template to `NNN-short-name.md` with the next free number, fill it in, and add a row
above. To change a decision, write a new record and set the old one's status to
"Superseded by NNN".

```markdown
# NNN. Title

- **Status:** Open | Decided | Superseded by NNN
- **Date:** Mon D, YYYY
- **Decided by:** who

## Context
What problem or question forced a decision.

## Decision
What we chose, in one or two sentences.

## Why
The reasons, and the options we rejected.

## Consequences
What this changes or constrains, and what to revisit later.
```
