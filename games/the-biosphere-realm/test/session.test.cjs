'use strict';
/* The session engine applied to The Biosphere Realm, end to end: the real simulation runs
   headless, and a host, players, AIs and viewers share one world through GTEngine. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBiosphere } = require('./load-headless.cjs');

const { run } = loadBiosphere({ seed: 'gametime-session-test' });
const plain = (v) => JSON.parse(JSON.stringify(v));
let clock = 0;
const SESSION = run('SESSION');
const steps = (n) => run(`for(let i=0;i<${n};i++)simStep()`);
const kingdoms = () => plain(run('tribes.filter(t=>t.alive&&t.pop>0).map(t=>({id:t.id,title:t.title,pop:t.pop,food:t.food,devo:t.devo}))'));
const tribe = (title) => plain(run(`(()=>{const t=tribes.find(t=>t.title===${JSON.stringify(title)});return {title:t.title,food:t.food,devo:t.devo,stab:t.stab,towns:t.towns.length,alive:t.alive}})()`));
const fresh = (settings) => SESSION.create({ now: () => clock, settings });

test('the game loads headless with the engine and its adapter', () => {
  assert.equal(run('typeof GTEngine'), 'object');
  assert.equal(run('typeof SESSION.create'), 'function');
  assert.ok(kingdoms().length >= 5, 'a world with several kingdoms');
  assert.deepEqual(plain(run('GTEngine.checkAdapter(SESSION.GAME)')), [], 'the Biosphere adapter passes the engine’s checks');
});

test('seats: no host needed; each player and AI rules a different kingdom', () => {
  const s = fresh();
  assert.equal(s.host(), null);
  const ks = kingdoms();
  assert.equal(s.join({ id: 'p1', role: 'player', name: 'Ash', kingdom: ks[0].title }).ok, true);
  assert.match(s.join({ id: 'p2', role: 'player', name: 'Bryn', kingdom: ks[0].title }).reasons[0], /already has a ruler/);
  assert.equal(s.join({ id: 'p2', role: 'player', name: 'Bryn' }).ok, true);
  assert.equal(s.join({ id: 'ai1', role: 'ai', name: 'AI 1' }).ok, true);
  const seats = s.members().map((m) => m.seat && m.seat.title).filter(Boolean);
  assert.equal(new Set(seats).size, 3, `three different kingdoms: ${seats.join(', ')}`);
  assert.match(s.join({ id: 'x', role: 'player', kingdom: 'Nowhere' }).reasons[0], /no kingdom called/);
});

test('viewers: an omen names a kingdom from the list, waits for the tick, then lands with the viewer’s name', () => {
  const s = fresh();
  s.join({ id: 'v1', role: 'viewer', name: 'Wren7' });
  const K = kingdoms()[1];
  const before = tribe(K.title).food;
  const r = s.submit('v1', 'omen', { kind: 'harvest', kingdom: K.title });
  assert.equal(r.status, 'queued');
  assert.equal(tribe(K.title).food, before, 'nothing happens until the tick');
  s.tick();
  assert.ok(tribe(K.title).food >= before + 10, 'the harvest filled the stores');
  assert.match(run('logs[0].m'), new RegExp(`Wren7 sent harvest to the ${K.title}`));
});

test('viewers: no free text, no unknown kingdoms, no chaos unless the host allows it, nothing signed out', () => {
  const s = fresh();
  s.join({ id: 'v1', role: 'viewer' });
  s.join({ id: 'anon', role: 'viewer', anonymous: true });
  const K = kingdoms()[0].title;
  assert.match(s.submit('v1', 'omen', { kind: 'harvest', kingdom: 'Kingdom of <b>' }).reasons[0], /not a valid kingdom/);
  assert.match(s.submit('v1', 'omen', { kind: 'harvest', kingdom: K, note: 'hi' }).reasons[0], /"note" is not an argument/);
  assert.match(s.submit('v1', 'omen', { kind: 'lightning', kingdom: K }).reasons[0], /not a valid kind/);
  assert.match(s.submit('anon', 'omen', { kind: 'rain', kingdom: K }).reasons[0], /sign in/);
  assert.match(s.submit('v1', 'decree', { move: 'patronize_arts' }).reasons[0], /a viewer cannot use "decree"/);
});

test('fairness: 5 viewers or 500, the world gets the same number of omens', () => {
  const counts = [];
  for (const audience of [5, 500]) {
    const s = fresh({ viewerBudget: { count: 4, perMs: 20000 }, viewerCooldownMs: 5000 });
    for (let i = 0; i < audience; i++) s.join({ id: `v${i}`, role: 'viewer' });
    const K = kingdoms()[0].title;
    let applied = 0;
    s.on('applied', () => applied++);
    for (let sec = 0; sec < 60; sec++) {
      for (let i = 0; i < audience; i++) s.submit(`v${i}`, 'omen', { kind: 'rain', kingdom: K });
      s.tick();
      clock += 1000;
    }
    counts.push(applied);
  }
  assert.equal(counts[0], counts[1], `5 viewers: ${counts[0]} omens, 500 viewers: ${counts[1]}`);
  assert.equal(counts[0], 12, '4 omens per 20 s, for 60 s');
});

test('players: the ruler’s rules apply, once a year, only for their own kingdom', () => {
  const s = fresh();
  const me = kingdoms()[2].title;
  s.join({ id: 'p1', role: 'player', name: 'Ash', kingdom: me });
  const sit = plain(s.observe('p1'));
  assert.equal(sit.kingdom, me, 'a player sees their own kingdom’s situation report');
  const peaceful = sit.neighbors.find((n) => !n.atWar);
  if (peaceful) assert.match(s.submit('p1', 'decree', { move: 'make_peace', target: peaceful.name }).reasons[0], /not at war with/);
  assert.match(s.submit('p1', 'decree', { move: 'declare_war', target: me }).reasons[0], /not a valid target|not one of your neighbors/);

  const devo = tribe(me).devo;
  assert.equal(s.submit('p1', 'decree', { move: 'patronize_arts' }).ok, true);
  s.tick();
  assert.ok(tribe(me).devo > devo, 'patronage raised devotion');
  assert.match(run('logs[0].m') + run('logs[1].m'), /Ash decrees for the/);
  assert.match(s.submit('p1', 'decree', { move: 'patronize_arts' }).reasons[0], /cooling down: wait 12 months/);
  steps(200);
  assert.equal(s.submit('p1', 'decree', { move: 'patronize_arts' }).ok, true, 'a year later they may rule again');
  s.tick();
});

test('players: a decree may only name what the report names (no slurs or fake names on stream)', () => {
  const s = fresh();
  s.join({ id: 'p1', role: 'player', kingdom: kingdoms()[0].title });
  const r = s.submit('p1', 'decree', { move: 'patronize_arts', decree: 'Praise be to Zorblax the Unknown, our true lord.' });
  assert.equal(r.ok, false);
  assert.match(r.reasons.join(' '), /never mentions/);
});

test('host: optional, but when present holds the controls; chaos omens only with the host’s say-so', () => {
  const s = fresh();
  s.join({ id: 'h', role: 'host', name: 'Host' });
  s.join({ id: 'v1', role: 'viewer', name: 'Rue' });
  s.join({ id: 'p1', role: 'player' });
  const K = kingdoms()[0].title;
  assert.match(s.control('p1', 'chaos', { on: true }).reasons[0], /only the host/);
  assert.equal(s.control('h', 'chaos', { on: true }).ok, true);
  assert.equal(s.submit('v1', 'omen', { kind: 'lightning', kingdom: K }).ok, true);
  s.tick();
  s.control('h', 'set', { key: 'viewersEnabled', value: false });
  clock += 10000;
  assert.match(s.submit('v1', 'omen', { kind: 'rain', kingdom: K }).reasons[0], /switched viewer actions off/);
  const edict = s.submit('h', 'edict', { kingdom: K, move: 'patronize_arts' });
  assert.equal(edict.ok, true, 'the host can decide a move for any kingdom');
  s.tick();
  assert.match(s.submit('h', 'decree', { move: 'patronize_arts' }).reasons[0], /host cannot use "decree"|a host cannot use/);
});

test('a paused world refuses omens, so the queue never piles up behind the host’s pause', () => {
  const s = fresh();
  s.join({ id: 'v1', role: 'viewer' });
  run('speed=0');
  assert.match(s.submit('v1', 'omen', { kind: 'rain', kingdom: kingdoms()[0].title }).reasons[0], /paused/);
  run('speed=1');
});

test('AIs: ten years of play with the local ruler; every move legal, the world keeps running', async () => {
  const s = fresh({ aiTurnMs: 0 });
  const ids = ['ai1', 'ai2', 'ai3'];
  for (const id of ids) {
    assert.equal(s.join({ id, role: 'ai', name: id }).ok, true);
    run(`GTEngine.createAIDriver(SESSION.live,${JSON.stringify(id)},{decide:SESSION.localRuler,everyMs:0})`);
  }
  s.join({ id: 'p1', role: 'player', name: 'Ash' });
  for (let i = 0; i < 40; i++) s.join({ id: `v${i}`, role: 'viewer', name: `viewer${i}` });
  const applied = [];
  const refusedAI = [];
  s.on('applied', (e) => applied.push(plain(e)));
  s.on('refused', (e) => { if (e.member && e.member.role === 'ai') refusedAI.push(plain(e)); });
  const y0 = run('year()');
  for (let k = 0; k < 2000; k++) {
    run('simStep()');
    if (k % 10 === 0) {
      clock += 500;
      const ks = kingdoms();
      const v = `v${k % 40}`;
      if (ks.length) s.submit(v, 'omen', { kind: ['rain', 'harvest', 'herd', 'festival'][k % 4], kingdom: ks[k % ks.length].title });
      s.tick();
      await new Promise((r) => setImmediate(r));
    }
  }
  const years = run('year()') - y0;
  const aiMoves = applied.filter((e) => e.member.role === 'ai');
  const omens = applied.filter((e) => e.action === 'omen');
  console.log(`  ${years} years · ${aiMoves.length} AI decrees (${[...new Set(aiMoves.map((e) => e.result.move))].join(', ')}) · ${omens.length} omens · ${refusedAI.length} AI moves refused`);
  console.log(`  status: ${s.status().line}`);
  assert.equal(years, 10);
  assert.ok(aiMoves.length >= ids.length * 5, 'each AI ruled about once a year');
  assert.ok(aiMoves.every((e) => e.result && e.result.kingdom), 'every applied AI move names its kingdom');
  assert.ok(refusedAI.every((e) => /too late|cooling|fallen|no kingdom/.test(e.reasons[0])), `AI refusals are only timing: ${refusedAI.map((e) => e.reasons[0]).join(' | ')}`);
  assert.ok(omens.length > 0 && omens.length <= Math.ceil((2000 / 10) * 500 / 20000) * 4 + 4, 'omens stayed inside the viewer budget');
  assert.match(s.status().line, /^Year \d+ · \d+ kingdoms · largest: /);
  assert.ok(kingdoms().length > 0, 'the world is still alive');
});

test('a new world releases every seat, and rulers claim a kingdom again', () => {
  const s = fresh();
  s.join({ id: 'p1', role: 'player', name: 'Ash' });
  run('genWorld("another-world")');
  s.tick();
  assert.equal(s.member('p1').seat, null);
  assert.match(s.submit('p1', 'decree', { move: 'patronize_arts' }).reasons[0], /no kingdom; claim one/);
  const free = plain(s.menu('p1').find((m) => m.action === 'claim').args.kingdom.values);
  assert.equal(s.submit('p1', 'claim', { kingdom: free[0] }).status, 'applied');
  assert.equal(s.member('p1').seat.title, free[0]);
  assert.equal(s.submit('p1', 'decree', { move: 'patronize_arts' }).ok, true);
});
