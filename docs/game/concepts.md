# Original game: candidate shortlist

- **Status:** **picked Nov 17, 2026: Ringward, re-themed as "shooting fish in a barrel"**
  ([decision 009](../decisions/009-game-concept.md); the theme is in [design.md](design.md)). The
  other candidates were not picked. This page is the record of the shortlist.
- **Updated:** Nov 16, 2026 (re-scored for the criteria below)
- **Criteria:** [decision 002](../decisions/002-in-app-games.md) as amended by
  [decision 012](../decisions/012-game-session-length.md) (no round-length limit),
  the stream-orientation rules of [decision 011](../decisions/011-stream-orientation.md), and the
  multiplayer and viewer requirements of [decision 010](../decisions/010-game-multiplayer-and-viewers.md)

Five options: three new concepts (A–C), **The Biosphere Realm** as it is (D), which a teammate
added to `games/the-biosphere-realm/` in PR #5, and a streaming adaptation of it (D′).
Everything here is original: its own names, rules and art. The names of A–C are working titles;
search the chosen one before it goes on a game page.

## What changed in the criteria (Nov 16, 2026)

- **No round-length limit.** The project lead dropped decision 002's "rounds of 1–3 minutes":
  the game may be quick or a long "lock-in" game. In its place: **a viewer who swipes in
  mid-stream can tell what's happening within a few seconds.**
  ([Decision 012](../decisions/012-game-session-length.md) supersedes that part of 002.)
- **Orientation (decision 011).** The feed is always vertical. A **portrait** stream fills the
  phone in the feed. A **landscape** stream shows fitted to width, about a third of the screen
  tall, while viewers swipe, and goes landscape full screen only when a viewer joins it. So a
  landscape game must read at both sizes; the vertical-crop-safe rule applies only to portrait
  games. Each candidate is scored in the orientation it would declare.
- **Still standing from 002:** original, browser-based, one core mechanic, readable on a phone
  stream, no accounts or saves of its own. **Still standing from 010:** viewers act in the game,
  a 2-player mode, and hosting from the streamer's browser with no game server.

## The candidates

### A. Ringward (recommended) · portrait
A glowing core sits in the centre of the screen and shards fly at it from every direction. You
rotate a single shield arc around the core with the mouse (or A/D): a shard that hits the shield
ricochets away for points, and a shard that slips past cracks the core. Three cracks and the core
breaks. Hitting a shard with the middle of the shield is a *perfect* block, which builds a combo
multiplier; the waves speed up until the last 20 seconds of a 2-minute round go into
*overdrive*. Every shard flashes a warning on the rim before it launches. On a stream, viewers
launch the shards from the GameTime app with their names on them, and a friend can join with a
second shield.

### B. Lumen Drop · portrait
You steer a falling spark down an endless vertical shaft. Pairs of gates scroll up towards you,
one mint and one red: passing a mint gate adds to your combo, touching red ends the run, and every
ten gates the shaft narrows and speeds up. Score is distance times combo. The shaft is naturally
vertical, but the game's appeal depends on a level generator that stays fair as it speeds up.

### C. Hot Core · portrait
A push-your-luck game on one big button. Hold to pump energy into a reactor; the score you'd bank
grows faster the longer you hold, but the reactor can overload at any moment, and the only warning
is a flicker in its glow that gets harder to read each level. Release to bank the points; overload
and you lose everything since your last bank. Cheapest to build and very readable (one giant
shape, one giant number), but the play is mostly nerve rather than skill.

### D. The Biosphere Realm, as it is · landscape (`games/the-biosphere-realm/`)
A god-simulation sandbox: shape continents, seed peoples and animals, and watch kingdoms grow,
worship, trade, feud and fall, with 100+ powers (terrain, disasters, wonders, diplomacy) across
seven tool tabs. It is already built and polished: procedural pixel art, synthesized music and
sound, about 10,000 lines of plain JavaScript, no dependencies. It is open-ended, which is now
allowed. Its screen is a wide map of small pixel sprites between a tool tray and a stats panel.
It saves worlds only to a file the player keeps (no accounts).

### D′. The Biosphere Realm, streaming mode · landscape
D with a mode built for streams: side panels hidden, the camera locked closer so sprites are
larger, one power tab, a big HUD (year, kingdoms alive, a goal the streamer sets), and viewers
dropping disasters from the app (decision 010). It keeps D's long-form "lock-in" play and adds
stakes a newcomer can read, but means changing a large codebase whose source of truth is another
repository (SudipKing/The-Biosphere-Realm), so the team would fork it or upstream every change.

## Constraints (pass/fail)

"Readable" is judged in the declared orientation: for portrait, full screen in the feed and safe
to crop; for landscape, both fitted to width (a third of the screen) and full screen.

| Constraint | A. Ringward | B. Lumen Drop | C. Hot Core | D. Biosphere | D′. Biosphere streaming |
|---|---|---|---|---|---|
| Original, browser-based | Pass | Pass | Pass | Pass | Pass |
| One core mechanic | Pass (turn the shield) | Pass (steer) | Pass (hold/release) | **Borderline:** one verb (cast a power), 100+ powers | Pass if cut to one tab |
| No accounts or saves of its own | Pass (best score in browser storage) | Pass | Pass | Pass (saves to a local file) | Pass |
| Readable on a phone stream | Pass | Pass | Pass | **Fail:** sprites are a few pixels when fitted to width; key info is in side panels | Borderline: passes full screen, tight fitted to width |
| Swipe-in: clear within a few seconds | Pass | Pass | Pass, mostly | **Fail:** no score, goal or stakes on screen | Pass with the HUD |

## Scores (1–5, 5 is best)

| Criterion | A. Ringward | B. Lumen Drop | C. Hot Core | D. Biosphere | D′. Biosphere streaming |
|---|---|---|---|---|---|
| Fun to watch for 30 seconds | **5**: telegraphed threats, near misses, combos | **4**: speed is exciting; crashes end clips abruptly | **4**: big tension, little visible skill | **3**: lovely, full of stories, few stakes | **4**: disasters with a goal |
| Fun to play (a few minutes or a long session) | **4**: clear skill ceiling | **4**: flow once tuned | **2**: shallow after a few rounds | **5**: enormous depth, now allowed to run long | **4**: depth kept, powers trimmed |
| Readable in its orientation | **5**: portrait, fills the phone in the feed; radial and centred | **4**: portrait; small gates blur | **5**: one shape, one number | **1**: tiny sprites at a third of the screen | **2**: better zoomed, still small fitted to width |
| Swipe-in legibility | **5**: core, shield, shards, timer and score explain it in a second or two | **4**: falling spark and gates are clear | **3**: a growing meter needs a moment to understand | **2**: reads as "a god game", not what's at stake | **3**: the HUD says what's at stake |
| Buildable by one person in ~6 weeks | **4**: greybox done; angle collision, wave table | **3**: fair generation needs tuning | **5**: about two weeks | **5**: already built (as is) | **2**: fork and rework of 10k lines we didn't write |
| Viewer interaction (survives stream delay) | **5**: viewers launch the shards; they pick where, not when | **3**: viewers place gates; each must stay fair | **2**: votes only; delay makes them late | **4**: dropping disasters is fun, few stakes | **5**: disasters against the streamer's goal |
| 2-player mode | **4**: two shields, one core, forced teamwork | **2**: two sparks crowd one shaft | **3**: a race, not teamwork | **3**: two gods, chaotic | **3** |
| Hosting cost (state to sync to a partner) | **5**: under 1 KB | **4**: small | **5**: tiny | **1**: thousands of beings to sync | **2**: smaller, same problem |
| **Total (of 40)** | **37** | 28 | 29 | 24, fails 2 constraints | 25 |

**Ranking:** Ringward 37 · Hot Core 29 · Lumen Drop 28 · Biosphere streaming mode 25 ·
Biosphere as is 24.

## What the new criteria changed
- **The Biosphere Realm no longer fails on round length.** Its long, open-ended play now counts
  for it ("fun to play" 5). What holds it back is readability as a landscape stream at a third of
  the phone screen, and swipe-in legibility, since nothing on screen says what's at stake. The
  streaming mode (D′) fixes most of that, at the cost of forking a large codebase.
- **Portrait is a real advantage.** Under decision 011 a portrait stream fills the phone in the
  feed, while a landscape stream gets a third of it until someone joins. A, B and C can all be
  portrait; D can't without a redesign.
- **Ringward declares portrait.** It already lays itself out in a 9:16 column (verified at
  450×800 and inside 1280×720), so it meets the crop-safe rule that portrait games still need.
  Its fixed 2-minute rounds are now a design choice rather than a rule, and they help swipe-in
  legibility: there is always a timer and a score.

## Recommendation (picked)

**Ringward**, picked by the project lead on Nov 17, 2026 with a new theme (fish in a barrel). It scores highest on every viewer-facing criterion: it fills the phone as a
portrait stream, someone swiping in understands it within a second or two, and viewers have the
most natural way to join in (they throw the shards). It is also the cheapest to host for duo play,
and its greybox already runs with simulated viewers and a second shield. Its risks are wave
tuning (a fixed wave table keeps it small) and stream delay for raids (viewers choose slots, not
moments).

**Why not The Biosphere Realm:** it is the most finished and deepest option, and with the round
limit gone its long play is a strength. But as a landscape stream it is hard to read at a third
of a phone screen, a newcomer can't see what's at stake, and making it stream-ready (D′) means
forking ~10,000 lines owned elsewhere and syncing a large simulation for duo play. It can still be
streamed on GameTime like any other game through OBS.

**Fallback:** if Ringward isn't fun by the end of week 2, cut to **Hot Core**, the smallest.

The final pick is the team's (decision 009). Design: [design.md](design.md); multiplayer and
hosting: [hosting-and-interaction.md](hosting-and-interaction.md); greybox:
[`games/ringward/`](../../games/ringward/).
