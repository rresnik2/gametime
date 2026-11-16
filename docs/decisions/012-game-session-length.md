# 012. The original game may be quick or long-form

- **Status:** Decided. Supersedes only the "1–3 minute rounds" limit in
  [decision 002](002-in-app-games.md); 002's other constraints stand.
- **Date:** Nov 16, 2026
- **Decided by:** Reece (project lead)

## Context
Decision 002 limited the MVP's original game to rounds of 1–3 minutes, on the idea that short
rounds suit a feed watched in 30-second bites. That rule ruled out long-form games, such as the
candidate The Biosphere Realm (an open-ended god-simulation sandbox), even though streams of long
sessions are common and a feed has room for both kinds.

## Decision
**There is no round-length limit.** The game can be a quick game with short rounds or a long
"lock-in" game played for a whole session. The rule that replaces it: **a viewer who swipes in
partway through can tell what's happening within a few seconds.**

## Why
- Variety: the feed should mix quick games with long sessions, as streaming does in general.
- The round-length rule was a stand-in for the real need, which is that a stream makes sense at
  the moment someone swipes in. That need applies to long games and short ones alike, so it's the
  rule we keep.
- Rejected: keeping the 1–3 minute limit, and raising it to a longer fixed cap. Both still exclude
  good long-form games for no reason a viewer would notice.

## Consequences
- Decision 002's other constraints are unchanged: original, a browser game streamed through OBS,
  one core mechanic, one screen, no accounts or saves of its own, readable on a phone stream (in
  its declared orientation, [decision 011](011-stream-orientation.md)), buildable by one person in
  Weeks 3–8.
- **Concept scoring** (PHASE_1_PLAN.md §4F) drops "fun to play for 3 minutes" for "fun to play,
  as quick rounds or a long session", and "fun to watch for 30 seconds" now includes someone who
  swipes in mid-session. Candidates are re-scored against this in the game PR
  (rresnik2/gametime#8); the pick is still decision 009.
- **The design doc** states the session length (round length, or what a long session looks like)
  and what a viewer who swipes in mid-session sees in the first 5 seconds.
- **Backlog:** P2-GAME-02, P2-GAME-04, P2-GAME-05 and P3-GAME-03 updated. Issue #30 matches;
  #28, #31 and #65 still show the old text.
- **"No saves of its own"** still holds, so a long session lasts as long as one sitting.

## Open question (design review)
How does someone who swipes into a long session understand it quickly? Proposed: the game shows a
persistent one-line status on screen (for example the current goal or stage), so the stream
explains itself without new app features. An app-side "what's happening" caption or game-state
card would be new scope and goes to the v2 backlog if wanted.
