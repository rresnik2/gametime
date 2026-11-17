# Ringward: hosting, multiplayer and viewer interaction

- **Status:** design for the build in Phases 2–3 ([decision 010](../decisions/010-game-multiplayer-and-viewers.md))
- **Updated:** Nov 16, 2026
- **Rules:** already in the greybox (`games/ringward/src/game.ts`: `launch()`, duo shields).
  Networking is not built yet; `?viewers=N` and `?duo` simulate it locally.

## Who's in a match

| Role | Where | Does what |
|---|---|---|
| **Host** (the streamer) | The game page in their desktop browser, captured by OBS | Runs the only copy of the rules (authoritative), plays P1 |
| **Partner** (duo, optional) | The game page in a friend's browser, joined by invite link | Sends their shield input, sees the host's state, plays P2 |
| **Raiders** (viewers) | The GameTime app, watching the host's stream | Launch shards from a 12-slot ring; see the result in the stream |

There is no game server. The host's browser is the server; Supabase carries messages.

## Message flow

```
Viewer app ──launch {slot}──▶ Edge Function `ringward-launch` ──broadcast──▶ Host
                              (checks JWT, username, block list,
                               4 s cooldown; service role sends)
Host ──raid events (round start/end, queued/full, core breaker)──▶ Viewer apps
Partner ──input {turn, targetAngle} 30 Hz──▶ Host ──state 20 Hz──▶ Partner
```

- **Channels:** Supabase Realtime broadcast, private, one per live stream:
  `ringward:<stream_id>` (raids) and `ringward-duo:<stream_id>` (host ↔ partner).
- **Who may send** (Realtime Authorization policies on `realtime.messages`, with RLS tests):
  raids topic: only the Edge Function (service role) sends launches, only the stream's owner
  sends raid events; duo topic: only the owner and the invited partner.
- **Why an Edge Function for launches:** a broadcast payload is whatever the client sends, so a
  name in it could be faked or offensive. The function attaches the viewer's real username from
  `profiles`, refuses viewers the streamer has blocked (`public.is_blocked_by()`), and enforces
  the cooldown. Anonymous viewers (D4) can watch but not raid.
- **The host still validates everything** with `launch()`: round running, valid slot, cooldown,
  queue of at most 8. Refusals go back as raid events so the app can say "raid full".

## Why raids stay fair at any audience size
A viewer's launch **replaces** the next shard the game would have spawned; it never adds one.
Timing comes from the wave table, so 0, 10 or 10,000 viewers make the same difficulty, and
spam can't overwhelm the streamer. With no viewers (cold start), the game spawns everything
itself. Unit tests cover this ("viewers launching constantly cannot make a round unwinnable").

## Stream delay
Viewers watch the stream a few seconds behind the host (D1: about 2–5 s in low-latency mode,
10 s or more in standard HLS). The design absorbs it:
- Viewers pick **where** (a slot), never **when**, so being late can't make a launch "miss".
- The app answers instantly ("queued, 3rd in line", slot lights up, cooldown ring), and the
  stream shows the outcome a few seconds later with the viewer's name on the shard.
- Crack credits and the core breaker appear on the result card in the stream.
- **Risk:** if D1 picks standard latency, raids feel sluggish. Prefer the low-latency mode.

## Duo partner
- The host's Go Live dashboard shows an invite link; the partner opens it signed in.
- The partner sends input at 30 Hz; the host simulates and sends compact state at 20 Hz
  (two shield angles, at most ~10 shards, score, cracks, timer: well under 1 KB).
- The partner's own shield is predicted locally so it feels instant; shards are interpolated.
  Shields are solid to each other, so players split the ring.
- Without a partner, duo also works on one keyboard (P1 mouse/A-D, P2 arrows).

## In the GameTime app
When the playing stream's game is Ringward, the action rail gets a **Raid** button that opens a
bottom sheet: the 12-slot ring (same layout as the rim ticks in the game), a cooldown ring, and
"your shard is Nth in line". Slots are 44 pt targets. The sheet only appears while a round is on.

## Hosting
- The game is a static Vite build on its own Vercel project (README → "Deploying the game to
  Vercel"), with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` set there.
- The host signs in on the game page with their GameTime account; the page finds their live
  stream (`streams.status = 'live'`, `game_id` = Ringward) to name the channels. Offline or
  signed out, solo and local duo still work.
- Streamer controls: raids on/off, kick partner.

## Who builds what (keeps the game owner near 6 weeks)
| Work | Owner | When |
|---|---|---|
| Full game loop, host networking, partner client | F (game) | Weeks 3–5 |
| `ringward-launch` Edge Function, Realtime policies + RLS tests, a `game_sessions` row (stream, host, partner) | C (backend) | Weeks 4–6 |
| Raid button and bottom sheet in the app | B (app) | Weeks 6–7 |
| Art, sound, polish (reduced), stream tests with the team | F | Weeks 6–8 |

**Cut to make room:** matchmaking (invite link only), leaderboards, persistent per-viewer stats,
shard skins, and a mobile version of the game. "Play with me" (viewers joining the streamer's
own games) stays v2.
