# 014. A shared session engine for every GameTime game

- **Status:** Proposed (for review; not decided)
- **Date:** Nov 22, 2026
- **Proposed by:** Sudip

## Context
Decision [010](010-game-multiplayer-and-viewers.md) gives the MVP game a host, a duo partner and
viewer raids, and designs them for Ringward alone. The Biosphere Realm already lets Claude rule a
kingdom (`ruler.js`) with its own checks. Each game was growing its own version of the same
rules: who may act, how often, what happens when the audience is large, how to keep viewers from
putting text on stream, what an AI is allowed to do. A future game would have to invent them a
third time.

## Proposal
One small engine, `games/engine/gametime-engine.js`, holds the rules for every game: four roles
(an optional **host**, **players**, **viewers** and **AIs**), and twelve house rules (one
authority, actions applied between steps, every action checked twice, refusals as sentences, a
viewer budget that doesn't grow with the audience, choices instead of free text, signed-out
viewers watch only, host safety controls, AIs under the same rules as people, a one-line status
for swipe-ins, and a log). Each game supplies an adapter: its actions, what each role sees and
its status line. Rules and adapter contract: [games/engine/README.md](../../games/engine/README.md).

Applied first to The Biosphere Realm as the test: players and AIs each rule a kingdom with the
ruler's moves, viewers send omens to a kingdom, and the host holds the controls.

## Why
- The rules are the same for every game, so writing them once means each new game only describes
  its own actions.
- It matches decision 010 (host-authoritative, no game server) and decision 012 (a status line),
  and generalizes Ringward's "viewers can't change difficulty" rule into a budget any game gets.
- AI seats get the same checks as people, which Biosphere's ruler already proved works.
- Rejected: a game server (decision 010 already rejected it), and keeping each game's rules
  separate (three copies of safety rules drift apart).

## Consequences
- **Scope:** AGENTS.md freezes scope at the MVP plus decision 010, and lists a second game as v2.
  This is shared infrastructure, and the Biosphere adapter is a test bed, not a second MVP game.
  The project lead decides whether it is in scope, and whether Ringward moves onto it.
- Ringward is unchanged. Moving it onto the engine is an adapter around its `launch()` plus a
  `.d.ts` (games/engine/README.md, "Applying it to the next game").
- Networking is not built: the engine is transport-agnostic, and the Supabase Realtime and Edge
  Function pieces in decision 010 call `submit()` when they exist.
- `games/the-biosphere-realm/` differs from `SudipKing/The-Biosphere-Realm`: `src/session.js`,
  `src/session-local.js`, `test/`, one line in `src/ui.js`, two script tags and `build.py`.
  **Resolved Nov 22, 2026 by the project lead,** who asked for the rework for streaming: this
  copy is the source of truth, and Sudip's repository is the earlier original.
- New CI job "Engine (session rules, Biosphere end to end)", not a required check.
