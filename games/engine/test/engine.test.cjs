'use strict';
/* The house rules, tested on a toy game so they don't depend on any real one. */
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../gametime-engine.js');

/* a toy game: a shared score, players add to it, viewers nudge it, the host can reset it */
function toy(over = {}) {
  const state = { score: 0, tick: 0, nudges: 0, colors: ['red', 'blue'] };
  const game = {
    id: 'toy',
    name: 'Toy',
    clockUnit: 'ticks',
    now: () => state.tick,
    roles: { player: { max: 2 }, ai: { max: 1, actsAs: 'player' } },
    actions: {
      add: {
        roles: ['player'],
        desc: 'Add 1 to 5 points.',
        args: { n: { type: 'int', min: 1, max: 5 } },
        cooldownGame: { player: 10 },
        check: (ctx, a) => (state.score + a.n > 20 ? ['the score cannot go over 20'] : []),
        apply: (ctx, a) => { state.score += a.n; return { score: state.score }; },
      },
      nudge: {
        roles: ['viewer'],
        desc: 'Paint the score a color.',
        args: { color: { type: 'enum', values: () => state.colors } },
        apply: () => { state.nudges++; return { nudges: state.nudges }; },
      },
      shout: {
        roles: ['viewer', 'player'],
        args: { text: { type: 'text', max: 20 } },
        apply: () => ({}),
      },
      reset: { roles: ['host'], hostToo: true, immediate: true, apply: () => { state.score = 0; return {}; } },
    },
    observe: (ctx) => ({ score: state.score, you: ctx.actor && ctx.actor.role }),
    status: () => `Score ${state.score}`,
    ...over,
  };
  let clock = 0;
  const session = E.createSession(game, { now: () => clock, settings: { viewerBudget: { count: 3, perMs: 10000 }, viewerCooldownMs: 4000 } });
  return { game, state, session, advance: (ms) => (clock += ms), steps: (n) => (state.tick += n) };
}

test('an adapter without actions or ids is refused with reasons', () => {
  assert.deepEqual(E.checkAdapter({}).length > 0, true);
  assert.throws(() => E.createSession({ id: 'x', actions: { a: { roles: ['wizard'], apply() {} } } }), /unknown role "wizard"/);
});

test('roles: the host is optional and there is at most one', () => {
  const { session } = toy();
  assert.equal(session.host(), null);
  assert.equal(session.join({ id: 'p1', role: 'player' }).ok, true);
  assert.equal(session.join({ id: 'h1', role: 'host' }).ok, true);
  const second = session.join({ id: 'h2', role: 'host' });
  assert.equal(second.ok, false);
  assert.match(second.reasons[0], /all 1 host seats are taken/);
});

test('roles: seat limits per role, and only viewers may be anonymous', () => {
  const { session } = toy();
  session.join({ id: 'p1', role: 'player' });
  session.join({ id: 'p2', role: 'player' });
  assert.match(session.join({ id: 'p3', role: 'player' }).reasons[0], /all 2 player seats/);
  assert.match(session.join({ id: 'a', role: 'player', anonymous: true }).reasons[0], /only viewers/);
  assert.equal(session.join({ id: 'v', role: 'viewer', anonymous: true }).ok, true);
  assert.match(session.join({ id: 'x', role: 'wizard' }).reasons[0], /not a role/);
});

test('actions: a role can only use its own actions', () => {
  const { session } = toy();
  session.join({ id: 'p', role: 'player' });
  session.join({ id: 'v', role: 'viewer' });
  assert.match(session.submit('v', 'add', { n: 1 }).reasons[0], /a viewer cannot use "add"/);
  assert.match(session.submit('p', 'nudge', { color: 'red' }).reasons[0], /a player cannot use "nudge"/);
  assert.match(session.submit('p', 'reset').reasons[0], /a player cannot use "reset"/);
  assert.match(session.submit('ghost', 'add', { n: 1 }).reasons[0], /not in this session/);
});

test('actions are queued, then applied on tick, between game steps', () => {
  const { session, state } = toy();
  session.join({ id: 'p', role: 'player' });
  const r = session.submit('p', 'add', { n: 3 });
  assert.equal(r.status, 'queued');
  assert.equal(state.score, 0, 'nothing happens before the tick');
  const out = session.tick();
  assert.equal(out[0].status, 'applied');
  assert.equal(state.score, 3);
});

test('arguments are checked: enums, ranges, missing and unknown keys', () => {
  const { session } = toy();
  session.join({ id: 'p', role: 'player' });
  session.join({ id: 'v', role: 'viewer' });
  assert.match(session.submit('p', 'add', { n: 9 }).reasons[0], /from 1 to 5/);
  assert.match(session.submit('p', 'add', {}).reasons[0], /"n" is required/);
  assert.match(session.submit('p', 'add', { n: 1, x: 2 }).reasons[0], /"x" is not an argument/);
  assert.match(session.submit('v', 'nudge', { color: 'green' }).reasons[0], /not a valid color; choose one of red, blue/);
});

test('viewers can never send free text; players can, plain and short', () => {
  const { session } = toy();
  session.join({ id: 'p', role: 'player' });
  session.join({ id: 'v', role: 'viewer' });
  assert.match(session.submit('v', 'shout', { text: 'hi' }).reasons[0], /viewers cannot send free text/);
  assert.equal(session.submit('p', 'shout', { text: 'hi' }).ok, true);
  assert.match(session.submit('p', 'shout', { text: '<b>x</b>' }).reasons[0], /plain text|cooling/);
});

test('cooldowns: per viewer in real time, per player in game time', () => {
  const { session, advance, steps } = toy();
  session.join({ id: 'p', role: 'player' });
  session.join({ id: 'v', role: 'viewer' });
  assert.equal(session.submit('v', 'nudge', { color: 'red' }).ok, true);
  assert.match(session.submit('v', 'nudge', { color: 'red' }).reasons[0], /cooling down: wait 4 s/);
  advance(4000);
  assert.equal(session.submit('v', 'nudge', { color: 'blue' }).ok, true);

  assert.equal(session.submit('p', 'add', { n: 1 }).ok, true);
  advance(60000);
  assert.match(session.submit('p', 'add', { n: 1 }).reasons[0], /wait 10 ticks/, 'real time does not cool a game-time cooldown');
  steps(10);
  assert.equal(session.submit('p', 'add', { n: 1 }).ok, true);
});

test('fairness: the viewer budget is the same for 3 viewers or 1,000', () => {
  for (const audience of [3, 1000]) {
    const { session, state, advance } = toy();
    for (let i = 0; i < audience; i++) session.join({ id: `v${i}`, role: 'viewer' });
    let accepted = 0;
    for (let round = 0; round < 10; round++) {
      for (let i = 0; i < audience; i++) if (session.submit(`v${i}`, 'nudge', { color: 'red' }).ok) accepted++;
      session.tick();
      advance(1000);
    }
    assert.equal(accepted, 3, `${audience} viewers in 10 s get the same 3 actions`);
    assert.equal(state.nudges, 3);
  }
});

test('fairness: a full queue refuses instantly, so viewers get feedback', () => {
  const s = E.createSession(toy().game, { settings: { queueMax: 2, viewerBudget: null, viewerCooldownMs: 0 } });
  for (const id of ['a', 'b', 'c']) s.join({ id, role: 'viewer' });
  assert.equal(s.submit('a', 'nudge', { color: 'red' }).ok, true);
  assert.equal(s.submit('b', 'nudge', { color: 'red' }).ok, true);
  assert.match(s.submit('c', 'nudge', { color: 'red' }).reasons[0], /full: too many actions are waiting/);
});

test('safety: anonymous viewers watch but cannot act', () => {
  const { session } = toy();
  session.join({ id: 'anon', role: 'viewer', anonymous: true });
  assert.match(session.submit('anon', 'nudge', { color: 'red' }).reasons[0], /sign in to take part/);
});

test('an action is checked again when it is applied ("too late")', () => {
  const { session, state } = toy();
  session.join({ id: 'p1', role: 'player' });
  session.join({ id: 'p2', role: 'player' });
  state.score = 15;
  assert.equal(session.submit('p1', 'add', { n: 4 }).ok, true);
  assert.equal(session.submit('p2', 'add', { n: 4 }).ok, true, 'both fit when they are made');
  const [first, second] = session.tick();
  assert.equal(first.status, 'applied');
  assert.equal(second.status, 'refused');
  assert.match(second.reasons[0], /too late: the score cannot go over 20/);
  assert.equal(state.score, 19);
});

test('host controls: only the host, live settings only, mute, kick and block', () => {
  const { session } = toy();
  session.join({ id: 'h', role: 'host' });
  session.join({ id: 'v', role: 'viewer' });
  session.join({ id: 'p', role: 'player' });
  assert.match(session.control('p', 'set', { key: 'viewersEnabled', value: false }).reasons[0], /only the host/);
  assert.match(session.control('h', 'set', { key: 'logKeep', value: 1 }).reasons[0], /cannot be changed/);
  assert.equal(session.control('h', 'set', { key: 'viewersEnabled', value: false }).ok, true);
  assert.match(session.submit('v', 'nudge', { color: 'red' }).reasons[0], /switched viewer actions off/);
  session.control('h', 'set', { key: 'viewersEnabled', value: true });
  session.control('h', 'mute', { id: 'v' });
  assert.match(session.submit('v', 'nudge', { color: 'red' }).reasons[0], /muted/);
  session.control('h', 'block', { id: 'v' });
  assert.equal(session.member('v'), null);
  assert.match(session.join({ id: 'v', role: 'viewer' }).reasons[0], /blocked/);
  assert.match(session.control('h', 'kick', { id: 'h' }).reasons[0], /host cannot be removed/);
});

test('with no host, the game itself holds the controls', () => {
  const { session } = toy();
  session.join({ id: 'p', role: 'player' });
  assert.match(session.control('p', 'set', { key: 'aiEnabled', value: false }).reasons[0], /only the game/);
  assert.equal(session.control(null, 'set', { key: 'aiEnabled', value: false }).ok, true);
});

test('the host may use any action unless it says hostToo: false; immediate actions skip the queue', () => {
  const { session, state } = toy();
  session.join({ id: 'h', role: 'host' });
  state.score = 7;
  assert.equal(session.submit('h', 'reset').status, 'applied');
  assert.equal(state.score, 0);
  assert.equal(session.submit('h', 'add', { n: 2 }).ok, true);
});

test('menu and status: what a seat can do now, and the one-line status', () => {
  const { session } = toy();
  session.join({ id: 'p', role: 'player', name: 'Pat' });
  session.join({ id: 'v', role: 'viewer' });
  const m = session.menu('p');
  assert.deepEqual(m.map((x) => x.action), ['add', 'shout']);
  assert.equal(m[0].ready, true);
  session.submit('p', 'add', { n: 1 });
  assert.equal(session.menu('p')[0].ready, false);
  assert.deepEqual(session.menu('v')[0].args.color.values, ['red', 'blue']);
  assert.deepEqual(session.status(), { line: 'Score 0', people: 'no host · 1 playing · 1 watching' });
});

test('events and the log record every join, refusal and applied action', () => {
  const { session } = toy();
  const seen = [];
  session.on('*', (e) => seen.push(e.type));
  session.join({ id: 'p', role: 'player' });
  session.submit('p', 'add', { n: 9 });
  session.submit('p', 'add', { n: 1 });
  session.tick();
  assert.deepEqual(seen, ['join', 'refused', 'queued', 'applied']);
  assert.deepEqual(session.log(10).map((l) => l.kind), ['applied', 'refused', 'join']);
});

test('AI: plays by the same rules, retries with the reasons, then gives up', async () => {
  const { session, state } = toy();
  session.join({ id: 'bot', role: 'ai', name: 'Bot' });
  const asked = [];
  const ai = E.createAIDriver(session, 'bot', {
    decide: async (req) => {
      asked.push(req);
      return req.errors.length ? '{"action":"add","args":{"n":2}}' : { action: 'add', args: { n: 99 } };
    },
  });
  const r = await ai.turn();
  assert.equal(r.status, 'queued');
  assert.match(asked[1].errors[0], /from 1 to 5/, 'the refusal went back to the AI');
  assert.equal(asked[0].menu[0].action, 'add', 'an AI standing in for a player sees the player menu');
  assert.equal(asked[0].rules, E.RULES_FOR_AI);
  session.tick();
  assert.equal(state.score, 2);

  const stubborn = E.createAIDriver(session, 'bot', { decide: () => 'not json' });
  const g = await stubborn.turn();
  assert.equal(g.status, 'gave-up');
  assert.match(g.reasons[0], /no JSON object/);
});

test('AI: cannot use actions its seat does not have, and pauses when the host says so', async () => {
  const { session } = toy();
  session.join({ id: 'h', role: 'host' });
  session.join({ id: 'bot', role: 'ai' });
  const ai = E.createAIDriver(session, 'bot', { decide: () => ({ action: 'nudge', args: { color: 'red' } }) });
  const r = await ai.turn();
  assert.match(r.reasons[0], /an? ai cannot use "nudge"/);
  session.control('h', 'set', { key: 'aiEnabled', value: false });
  const ai2 = E.createAIDriver(session, 'bot', { decide: () => ({ action: 'add', args: { n: 1 } }) });
  assert.match((await ai2.turn()).reasons[0], /paused the AI/);
});

test('AI: tick() starts turns when they are due, and a slow model never blocks the tick', async () => {
  const { session, advance } = toy();
  session.join({ id: 'bot', role: 'ai' });
  let calls = 0;
  let release;
  const gate = new Promise((r) => (release = r));
  let clock = 0;
  E.createAIDriver(session, 'bot', { now: () => clock, everyMs: 1000, decide: async () => { calls++; await gate; return { action: 'wait' }; } });
  session.tick();
  session.tick();
  assert.equal(calls, 1, 'one turn at a time');
  release();
  await gate;
  await new Promise((r) => setImmediate(r));
  clock += 1000;
  session.tick();
  assert.equal(calls, 2);
  advance(0);
});
