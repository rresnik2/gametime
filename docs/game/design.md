# Ringward (fish in a barrel): one-page design

- **Status:** chosen ([decision 009](../decisions/009-game-concept.md), Nov 17, 2026). "Ringward"
  is the working title in code and paths; the final name is the team's call (009 proposes three).
- **Updated:** Nov 17, 2026
- **Greybox:** [`games/ringward/`](../../games/ringward/) (plain Canvas + TypeScript, Vite)
- **Multiplayer and viewers:** [decision 010](../decisions/010-game-multiplayer-and-viewers.md);
  networking in [hosting-and-interaction.md](hosting-and-interaction.md)

**Pitch:** shooting fish in a barrel, except the fish fights back. A goldfish in a wooden barrel
swings a shield on a stick to bat away cartoon cannonballs fired in from every side, for two
minutes. On a stream, the viewers are the ones firing.

## Theme
An **old-timey, nostalgic, tropical** top-down cartoon: a faded seaside-carnival postcard
("shooting fish in a barrel" as a fairground stall), seen through old film. The barrel is the
arena: lagoon water, lily pads, leaves hanging over a rope-bound wooden rim, carnival-tent stripes
behind it. In the middle swims a round **orange goldfish with bright red lips**, lashes, a blush
and a flower behind its eye, inked like an old cartoon, holding a shield on a stick. Shots are
**cartoon cannonballs** (dark iron balls trailing smoke puffs). Slapstick, not gory: hits leave
bruises, a black eye and band-aids that pile up, but never blood, gore, explosions or fishing
hooks (the app is 13+, decision 005, and streams are public).

**Injuries build up with each bonk**, so viewers can see how close the fish is to going down. In
duo, each fish shows the bonks that landed on its side of the barrel (they still share three
bubbles):

| Bonks on this fish | The fish shows |
|---|---|
| Any bonk | A white flash and a squash, "BONK!", a bubble pops |
| 1 | A purple bruise on its side, a crossed band-aid over it, a bump, a sweat drop; its flower loses a petal |
| 2 | A **black eye** (dark ring, droopy lid), a second bruise, a band-aid on its head, a star circling |
| 3 | A third bruise, a band-aid on its cheek; when the round is lost, a spiral "dizzy" eye and three stars |

The result card sits in the lower part of the barrel, so the battered (or still swimming) fish
stays in view at the end of a round.

## Modes
| Mode | Who | How |
|---|---|---|
| **Solo** | The streamer | One goldfish, one shield; the game fires every cannonball |
| **Duo** | Streamer + a partner | Two goldfish, each with a shield (P1 purple shield and pink hibiscus, P2 white shield and white plumeria). Shields are solid to each other, so players split the barrel. Balls come 30% more often; the fish share three bubbles |
| **Raid** (on top of solo or duo, while live) | Viewers in the GameTime app | Each viewer fires a cannonball from one of 12 slots on the rim (stave joints), at most one per 4 s. Their ball carries their username |

Raid throws **replace** the game's own throws (queue of 8, one per spawn tick), so difficulty
follows the wave table whatever the audience size; with no viewers, the game throws everything.
Viewers choose where, not when, so stream delay can't make them miss.

## Core loop
1. A red ring flashes on the rim where the next cannonball comes in (0.6 s warning).
2. The cannonball flies straight at the fish, trailing smoke.
3. The player swings the shield to meet it. Blocked balls bounce away for points; a block with
   the shield's centre is a *perfect* block and builds the combo faster.
4. A ball that gets past the shield BONKs the fish, pops a bubble and resets the combo.
5. Throws get faster and denser until the round ends. Then: result card, any key to go again.

## Controls
| Input | Action |
|---|---|
| Mouse position | The shield swings towards the pointer's angle around the fish |
| A / D or ← / → | Swing left / right (duo on one keyboard: P1 A / D, P2 ← / →) |
| Space, Enter or click | Start, and restart after a round |
| Viewers (app) | Tap a slot on the throw ring |

The shield's swing speed is capped (720°/s with the mouse, 420°/s with keys; raised from 540 and
300 on Nov 17, 2026 so the fish feels quicker), so a pointer flick to the far side still takes time.
That cap is what makes two balls from opposite sides a real decision, and it keeps mouse and
keyboard players even.

## Round length and pacing (one fixed wave table, no procedural generation)
Fixed 2-minute rounds (a design choice under [decision 012](../decisions/012-game-session-length.md):
the timer and score make it clear to anyone swiping in).

| Time | Ball every | Rim-to-fish time | Extras |
|---|---|---|---|
| 0:00–0:20 | 1.4 s | 1.6 s | singles |
| 0:20–1:00 | 1.0 s | 1.35 s | 15% pairs |
| 1:00–1:40 | 0.75 s | 1.1 s | 30% pairs |
| 1:40–2:00 **FRENZY!** | 0.5 s | 0.85 s | 40% pairs, the hoop and screen edge pulse red |

A *pair* is two balls 90–180° apart. The second one comes in later by exactly the time the shield
needs to swing between them at full speed, plus 0.15 s, and the next throw waits for it, so every
pair can be blocked. (Without that delay a 70° shield can never block a pair; the greybox's first
version lost every round by 0:35 because of it, and a unit test checks a full round is winnable.)

## Scoring
- Block: 10 × multiplier. Perfect block (centre third of the shield): 25 × multiplier.
- Combo: +1 per block, +2 per perfect block; a bonk resets it to 0.
- Multiplier: 1 + one per 8 combo, max ×5.
- Lasting to 2:00 adds 250 per bubble left (0–3).

Viewers don't score points; each viewer's throws and bonks are counted for the result card.

## Win and lose
- **Win, "STILL SWIMMING":** the timer reaches 0:00 before the third bonk. In a raid the card
  says how many throwers were beaten.
- **Lose, "DIZZY!":** the third bonk. The result card shows how long the fish lasted.
- **Viewers win, "VIEWERS WIN":** a viewer's ball landed the third bonk; the card says "Final bonk
  by" that viewer.
- No saves of its own (decision 002). Hosting a raid or duo needs the streamer's GameTime login;
  solo and local duo don't. The best score lives in the browser's local storage only.

## Words: code ↔ screen
The rules in `games/ringward/src/game.ts` keep neutral names; only the screen uses the theme.

| Code | On screen |
|---|---|
| core | the goldfish (two in duo) |
| `hurt[i]` | the injuries on fish *i* |
| shard, `launch()` | cannonball, a shot |
| crack, `cracks` | BONK!, a popped bubble, a new injury |
| `coreBreaker` | "Final bonk by" |
| overdrive | FRENZY! |
| raiders | throwers ("12 throwing") |
| rim slots | stave joints on the barrel rim |

## Art direction
**Each game has its own theme and palette** (project lead, Nov 17, 2026); GameTime's tokens
(`src/theme/tokens.ts`) are for the app and still a work in progress. This game's look: tropical
characters, a wooden barrel, and an old-timey finish, with strong contrast so it reads on a phone
and the HUD stays clear under the app's overlay. P1's shield keeps a faded GameTime purple as a
small link to the app. All colours live at the top of
`games/ringward/src/render.ts` (`THEME` for the scene, `VINTAGE` for the screen).

| Element | Colour |
|---|---|
| Goldfish / shading, bumps, ink outline | `#E98A3C` / `#C96A28`, `#F2B27A`, `#1A1410` |
| Lips | red `#D8323A` |
| Flowers | P1 hibiscus `#E0708E`, P2 plumeria `#F4E7C8`, mustard centres `#E3B04B` |
| Barrel staves / joints, rope hoop | `#8A5A2E` / `#5A3818`, `#D8B37A` |
| Water (centre → edge), lily pads, leaves | `#3F7F78` → `#1F3E3E`, `#6E9452`, `#789F55` |
| Cannonballs | iron `#1A1410` with a faded-red `#D2483C` rim while incoming, cream smoke puffs |
| Shields P1 / P2 | faded purple `#8E6CC4` / cream `#E9DCBE`, perfect zone lighter |
| Background, tent stripes | ink `#17110D`, `#211812` |
| Text (score, cards), secondary text | cream `#F4E7C8`, tan `#C9B591` |
| Warnings, BONK!, FRENZY! | faded red `#D2483C` |
| Bubbles (lives), perfect-block points | sea green `#8CC7A8` |
| Thrower names | cream on a dark pill, inside the rim beside their ball |

**Old-film finish** over everything, kept light so text and balls stay readable on a phone: a warm
sepia wash, a vignette, fine grain, the odd vertical scratch and a gentle flicker. **Lettering:**
a slab-serif poster face (Rockwell where installed, Georgia otherwise; the final font gets licensed
or bundled in Phase 3), with double rules on the title card.

Original: generic vintage-film and carnival-postcard cues, not the style of any particular game
or studio, and nothing borrowed from an existing fish game's characters (no stripes, no
clownfish, no named characters). Sound in Phase 3: a soft "pomf" for each cannon shot, a clang
for a block, BONK, a bubble pop, and a scratchy-record steel-drum sting for FRENZY; the greybox
is silent.

## Orientation: portrait (decision 011)
Streamed **portrait (9:16)**, so it fills the phone in GameTime's vertical feed instead of a third
of it. Everything lives in a centred 9:16 column: the time, score and multiplier above the barrel,
the bubbles below it, and the barrel (rim included) at most 92% of the column's width. In a
landscape window the same column sits in the middle (the crop-safe rule decision 011 keeps for
portrait games).

For streaming, the OBS canvas is portrait (1080×1920, or 720×1280 to save bandwidth). The
streamer plays in a tall browser window, or full screen and crops the capture to the column;
press **G** (or add `?guides`) to show it. Check it in the OBS stream test.

## What a viewer sees in the first 5 seconds
A sepia-toned old postcard come to life: a round wooden barrel of lagoon water filling the phone,
an orange goldfish with red lips in the middle swinging a purple shield on a stick, and
cannonballs trailing smoke flying in from the rim. A huge cream score above, the time left beside
it, three bubbles below; bruises, a black eye and band-aids on the fish show how it's doing. Within a second or two a ball either
bounces off the shield with a "+25" or BONKs the fish: a viewer swiping in gets the whole game
without sound or explanation. In a raid, the balls carry other viewers' names and "12 throwing"
sits under the barrel, so the next thing the viewer wants is the Raid button.

## Out of scope for the MVP
Power-ups, levels, leaderboards, matchmaking, persistent viewer stats, cannonball or fish skins, more
than two fish, chat-command input, and a mobile or touch version of the game: all v2 at most.
