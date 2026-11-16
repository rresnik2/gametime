# Ringward: one-page design

- **Status:** draft for the recommended candidate; the team picks between Ringward, the other
  concepts and The Biosphere Realm
  ([decision 009](../decisions/009-game-concept.md), [shortlist](concepts.md))
- **Updated:** Nov 16, 2026
- **Greybox:** [`games/ringward/`](../../games/ringward/) (plain Canvas + TypeScript, Vite)
- **Multiplayer and viewers:** [decision 010](../decisions/010-game-multiplayer-and-viewers.md);
  networking in [hosting-and-interaction.md](hosting-and-interaction.md)

**Pitch:** keep the core alive for two minutes. Shards fly at it from every side, and on a
stream, the viewers are the ones throwing them.

## Modes
| Mode | Who | How |
|---|---|---|
| **Solo** | The streamer | One shield; the game spawns every shard |
| **Duo** | Streamer + a partner | Two shields on one core (P1 purple, P2 white). Shields are solid to each other, so players split the ring. Shards come 30% more often |
| **Raid** (on top of solo or duo, while live) | Viewers in the GameTime app | Each viewer launches a shard from one of 12 rim slots, at most one per 4 s. Their shard carries their username |

Raid launches **replace** the game's own spawns (queue of 8, one per spawn tick), so difficulty
follows the wave table whatever the audience size; with no viewers, the game spawns everything.
Viewers choose where, not when, so stream delay can't make them miss.

## Core loop
1. A shard's launch point flashes on the arena's rim (0.6 s warning).
2. The shard flies straight at the core.
3. The player turns the shield to meet it. Blocked shards ricochet away for points; a block with
   the shield's centre is a *perfect* block and builds the combo faster.
4. A shard that gets past the shield cracks the core and resets the combo.
5. Waves get faster and denser until the round ends. Then: result card, any key to go again.

## Controls
| Input | Action |
|---|---|
| Mouse position | Shield turns towards the pointer's angle around the core |
| A / D or ← / → | Turn the shield left / right (duo on one keyboard: P1 A / D, P2 ← / →) |
| Space, Enter or click | Start, and restart after a round |
| Viewers (app) | Tap a slot on the raid ring |

The shield's turn speed is capped (540°/s), so a pointer flick to the far side still takes time.
That cap is what makes two shards from opposite sides a real decision, and it keeps mouse and
keyboard players even.

## Round length and pacing (one fixed wave table, no procedural generation)
| Time | Shard every | Rim-to-core time | Extras |
|---|---|---|---|
| 0:00–0:20 | 1.4 s | 1.6 s | singles |
| 0:20–1:00 | 1.0 s | 1.35 s | 15% pairs |
| 1:00–1:40 | 0.75 s | 1.1 s | 30% pairs |
| 1:40–2:00 **overdrive** | 0.5 s | 0.85 s | 40% pairs, arena pulses red |

A *pair* is two shards 90–180° apart. The second one launches later by exactly the time the
shield needs to turn between them at full speed, plus 0.15 s, and the next spawn waits for it,
so every pair can be blocked. (Without that delay a 70° shield can never block a pair; the
greybox's first version lost every round by 0:35 because of it, and a unit test now checks that
a full round is winnable.)

## Scoring
- Block: 10 × multiplier. Perfect block (centre third of the shield): 25 × multiplier.
- Combo: +1 per block, +2 per perfect block; a crack resets it to 0.
- Multiplier: 1 + one per 8 combo, max ×5.
- Surviving to 2:00 adds 250 per crack the core can still take (0–3 left).

Raiders don't score points; each viewer's launches and cracks are counted for the result card.

## Win and lose
- **Win, "Core held":** the timer reaches 0:00 with the core intact. In a raid the card says how
  many raiders were beaten.
- **Lose, "Core lost":** the third crack. The result card shows the time survived.
- **Raiders win, "Viewers win":** a viewer's shard landed the third crack; the card names that
  viewer as the core breaker.
- No saves of its own (decision 002). Hosting a raid or duo needs the streamer's GameTime login;
  solo and local duo don't. The best score lives in the browser's local storage only.

## Art direction (GameTime palette, `src/theme/tokens.ts`)
| Element | Token | Colour |
|---|---|---|
| Background | `background` | `#0B0B12` |
| Arena disc, rim | `surface`, `border` | `#16161F`, `#2A2A38` |
| Core (healthy) | `mint` | `#2EF2C3`, dims and fractures with each crack |
| Shield (P1) / (P2, duo) | `primary` / near-white | `#7C5CFF` / `#E8E8F0`, perfect zone brighter |
| Shards, warnings, overdrive | `live` | `#FF3B5C` |
| Score, timer / labels | `text` / `textSecondary` | `#FFFFFF` / `#A1A1B5` |
| Raider names | `text` on a dark pill | inside the rim, beside their shard |

Flat vector shapes with a soft glow, no textures, no small details. Numerals in Space Grotesk
Bold, as in the app. Original synth sound effects (block, perfect, crack, overdrive) come in
Phase 3; the greybox is silent.

## Orientation: portrait (decision 011)
Ringward is streamed **portrait (9:16)**, so it fills the phone in GameTime's vertical feed
instead of a third of it. Everything lives in a centred 9:16 column: the score above the arena,
the cracks below it, and the arena's diameter at most 92% of the column's width. In a portrait
window the arena fills the width; in a landscape window the same column sits in the middle, so
nothing important is ever outside it (the crop-safe rule decision 011 keeps for portrait games).

For streaming, the OBS canvas is portrait (1080×1920, or 720×1280 to save bandwidth), as the OBS
guide will say. The streamer plays in a tall browser window, or full screen and crops the capture
to the column; press **G** (or add `?guides`) to show it. On a 1080p monitor the column is about
608×1080, which OBS scales up; flat shapes survive that well. Check this in the OBS stream test.

## What a viewer sees in the first 5 seconds
A dark screen with one bright mint circle in the middle, a purple arc swinging around it, and red
streaks converging on it from all sides. A huge white score above, and the time left counting
down inside the core. Within a couple of seconds a shard either bounces off the arc with a flash
and a "+25" or hits the core and cracks it: the viewer understands the whole game without
sound or explanation. In a raid, the shards carry other viewers' names and a "12 raiding" line
sits under the arena, so the next thing the viewer wants is the Raid button.

## Out of scope for the MVP
Power-ups, levels, leaderboards, matchmaking, persistent viewer stats, shard skins, more than
two shields, chat-command input, and a mobile or touch version of the game: all v2 at most.
