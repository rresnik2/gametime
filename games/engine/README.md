# GameTime session engine

One set of rules for every GameTime game: who is in a session, what each of them may do, and
how their actions reach the game fairly. A game plugs in with a small **adapter**; the engine
does the rest. Proposed in [decision 014](../../docs/decisions/014-game-session-engine.md); first
applied to [The Biosphere Realm](../the-biosphere-realm/src/session.js).

- `gametime-engine.js`: the engine. Plain JavaScript with no dependencies. A classic `<script>`
  sets `window.GTEngine`; Node's `require()` returns the same object.
- `test/engine.test.cjs`: the house rules, tested on a toy game (`node --test games/engine/test/`).

The engine never draws, networks or runs a model. That keeps it the same in a browser, in
tests and behind any transport.

```
  people and AIs                    engine                          game
  ─────────────                     ──────                          ────
  host ──control()──▶  seats, permissions, cooldowns,     ──apply()──▶  adapter
  player ─submit()──▶  viewer budget, queue, 2nd check    ◀─check()───  (actions,
  viewer ─submit()──▶  log + events ──▶ transport/UI      ◀─observe()─   observe,
  AI ◀─menu+view─ driver ─submit()──▶                     ◀─status()──   status)
                                       tick() between simulation steps
```

## Roles

| Role | Seats | What they are | Default rules |
|---|---|---|---|
| **host** | 0 or 1 (always optional) | The streamer, whose browser runs the game (decision 010) | Holds the controls; may use any action unless the action says `hostToo: false` |
| **player** | game sets (default 4) | A person with a seat in the game (a kingdom, a fish, a team) | Uses player actions, with per-action cooldowns in real or game time |
| **viewer** | unlimited | Someone watching the stream in the GameTime app | Small menu, picks from known values only, per-viewer cooldown, shared budget |
| **ai** | game sets (default 4) | A seat played by a model or a bot | Stands in for another role (`actsAs`, default `player`): same menu, same checks, can be paused |

With **no host**, the game itself holds the controls (`control(null, …)`), so an unattended
stream (for example an all-AI showcase) runs on the game's defaults.

## The house rules

Every game gets these. An adapter changes the values in `settings`; the host changes the ones
marked live, during a session.

1. **One authority.** The host's game is the only copy of the rules. Nothing a client sends is
   trusted: every action goes through `submit()`, which checks it.
2. **Actions land between steps.** Accepted actions wait in a queue and are applied in `tick()`,
   which the game calls between simulation steps, never inside one.
3. **Checked twice.** An action is checked when it is sent and again when it is applied. If the
   world moved on in between (a war ended, a kingdom fell), it is refused as "too late".
4. **Every refusal is a sentence.** Reasons such as "cooling down: wait 4 s" or "you are not at
   war with the Horde of Urzdak" go back as they are: to a viewer's app, a player's screen, or an
   AI that gets to try again.
5. **Audience size never changes difficulty.** Viewers share one budget (`viewerBudget`, live:
   default 6 per 30 s) and a queue cap (`queueMax`, live: 8). With 5 or 5,000 viewers the game gets
   the same number of viewer actions; extra taps get an instant "full". Games can go further, as
   Ringward does, by having a viewer's action replace something the game would have done anyway.
6. **Viewers pick where, never when.** Viewer arguments are choices from lists the game already
   knows (a kingdom, a slot), so a stream that runs seconds behind can't make an action miss.
7. **No free text from viewers** (`viewerText: false`). Only names the game knows, and the
   viewer's real username from the transport, ever reach the stream. Free text from players and
   AIs is capped (`textMax`) and plain; a game can check it further (Biosphere's decrees may only
   name what the situation report names).
8. **Signed-out viewers watch, not act** (`anonymousCanAct: false`, decision 010).
9. **The host is in charge of safety:** switch viewer actions or AI seats off
   (`set viewersEnabled / aiEnabled`), `mute`, `kick` and `block` (a blocked id can't rejoin), plus
   any controls the game adds.
10. **AIs play by the same rules as people.** An AI gets the menu and view its seat would get,
    plus `RULES_FOR_AI`; its move goes through `submit()` like anyone's. A refused move goes back
    with the reasons (`aiRetries`, default 2), then the AI waits. A slow model never blocks
    `tick()`: a turn starts in the background and its move lands on a later tick.
11. **Swipe-in legibility** (decision 012): every game gives `status()`, one line that tells
    someone who just swiped in what is going on.
12. **Everything is logged:** joins, applied actions, controls and refusals (except routine
    viewer refusals, which are events only, so a busy audience never floods the log).

## Writing an adapter

```js
const MY_GAME = {
  id: 'my-game', name: 'My Game',
  now: () => gameClock,            // optional: game time, for cooldownGame (default: real time)
  clockUnit: 'rounds',             // how game time reads in messages
  roles: { player: { max: 2 }, ai: { max: 2, actsAs: 'player' } },
  settings: { viewerBudget: { count: 10, perMs: 30000 } },

  onJoin(ctx, req) { return { seat: { team: 'red' } } },  // or { errors: ['...'] }
  onLeave(ctx) {},

  actions: {
    launch: {
      roles: ['viewer'],
      desc: 'Fire from a rim slot.',
      args: { slot: { type: 'int', min: 0, max: 11 } },     // also {type:'enum', values}, {type:'text', max}
      cooldownMs: { viewer: 4000 },                         // or cooldownGame: { player: 12 }
      available: (ctx) => (round.on ? [] : ['no round is running']),   // no arguments needed
      check: (ctx, args) => [],                             // is this exact move legal now?
      apply: (ctx, args) => ({ queued: true }),             // change the game; return what happened
      // immediate: true  skips the queue (for moves that only change the session, like claiming a seat)
    },
  },
  controls: { raids: (ctx, args) => [] },                   // host-only extras
  observe: (ctx) => ({ /* what this seat may see */ }),
  status: (ctx) => 'Round 2 · 0:41 left · 3 cracks',
  onTick: (ctx) => {},
};

const session = GTEngine.createSession(MY_GAME);
session.join({ id: 'u1', role: 'viewer', name: 'Wren' });  // name comes from the transport, never the client
session.submit('u1', 'launch', { slot: 3 });               // → {ok, status:'queued'} or {ok:false, reasons}
session.tick();                                            // in the game loop, between steps
GTEngine.createAIDriver(session, 'ai1', { decide: async (req) => ({ action: 'launch', args: { slot: 0 } }) });
```

`ctx` holds `actor` (who is acting), `seat` (their game data), `settings`, `session` and
`setSeat(seat)`. The session also offers `menu(id)` (each action with its allowed values and
whether it is ready, for a UI or an AI), `observe(id)`, `status()`, `members(role)`, `log(n)`,
`budgetLeft()`, `control(id, cmd, args)` and `on(type, fn)` for events: `join`, `leave`,
`queued`, `refused`, `applied`, `control`, or `*`.

## Connecting it to the network (not built yet)

The engine fits decision 010's design without changes:

- The **host's page** owns the session. A Realtime listener on the game's channel calls
  `submit()`; `on('*')` broadcasts results back (queued, full, applied), so the app can answer at
  once.
- **Viewer actions** reach the host through an Edge Function that attaches the viewer's real
  username and refuses blocked or anonymous viewers before `join()`/`submit()` ever run. The
  engine checks again anyway.
- **Players and partners** send moves on the duo/players channel; the host's session checks them.
- **AI seats** run on the host's machine (Biosphere's ruler bridge, for example) or on a server,
  and only ever call `submit()`.

Until then, each game can simulate the network locally, as Biosphere's `?session` mode does.

## Applying it to the next game

| Engine concept | The Biosphere Realm (done) | Ringward (not done) |
|---|---|---|
| Host | The streamer, with the full power tray and the session controls | The streamer, P1 |
| Player seat | One kingdom each | The duo partner's fish |
| Viewer action | An omen sent to a kingdom (rain, harvest, festival, herd; lightning if allowed) | A cannonball from one of 12 rim slots |
| AI seat | Rules a kingdom with the ruler's moves (`localRuler` or Claude via the bridge) | Could play the partner fish or a raider |
| Game clock | Months (cooldown: one decree a year) | Round seconds |
| Status line | "Year 12 · 7 kingdoms · largest: … · war: …" | "Round 2 · 0:41 left · 3 cracks" |

Ringward already enforces its own raid rules in `launch()` (`games/ringward/src/game.ts`); moving
it onto the engine means an adapter whose `launch` action calls that function, with the engine
adding seats, host controls, the viewer budget and AI seats around it. Its TypeScript would want
a small `.d.ts` for the engine.
