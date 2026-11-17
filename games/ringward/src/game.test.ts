import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CORE_R,
  MAX_CRACKS,
  MIN_SHIELD_GAP,
  RAID_QUEUE_MAX,
  RAID_SLOTS,
  ROUND_SECONDS,
  SHIELD_R,
  SURVIVAL_BONUS_PER_CRACK,
  VIEWER_COOLDOWN_SECONDS,
  autopilotInputs,
  createGame,
  launch,
  multiplier,
  slotAngle,
  startRound,
  topRaiders,
  update,
  wrapAngle,
  type Game,
  type GameOptions,
  type Input,
  type Shard,
} from './game.ts';
import { WAVES, waveAt } from './waves.ts';

const STEP = 1 / 60;

function seeded(seed: number): () => number {
  let x = seed;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
}

/** A game with spawning pushed far into the future, so tests control the shards. */
function quietGame(options: GameOptions = {}): Game {
  const game = createGame(() => 0.5, options);
  startRound(game);
  game.untilSpawn = 1e9;
  return game;
}

function flyingShard(angle: number, by: string | null = null): Shard {
  return { angle, dist: SHIELD_R + 0.2, speed: 1, state: 'flying', warning: 0, by };
}

function run(game: Game, seconds: number, inputs: readonly Input[] = []): void {
  for (let t = 0; t < seconds; t += STEP) update(game, inputs, STEP);
}

function autoplay(game: Game, seconds: number, everyStep?: (game: Game) => void): void {
  for (let i = 0; i < seconds * 60 && game.phase === 'playing'; i++) {
    everyStep?.(game);
    update(game, autopilotInputs(game), STEP);
  }
}

test('wrapAngle keeps angles in (-PI, PI]', () => {
  assert.ok(Math.abs(wrapAngle(3 * Math.PI) - Math.PI) < 1e-9);
  assert.ok(Math.abs(wrapAngle(-Math.PI / 2) + Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(wrapAngle(2 * Math.PI)) < 1e-9);
});

test('a shard hitting the centre of the shield is a perfect block', () => {
  const game = quietGame();
  game.shards.push(flyingShard(game.shields[0]));
  run(game, 0.5);
  assert.equal(game.perfects, 1);
  assert.equal(game.score, 25);
  assert.equal(game.combo, 2);
  assert.equal(game.cracks, 0);
});

test('a shard at the edge of the shield is a normal block', () => {
  const game = quietGame();
  game.shards.push(flyingShard(game.shields[0] + 0.5));
  run(game, 0.5);
  assert.equal(game.blocks, 1);
  assert.equal(game.perfects, 0);
  assert.equal(game.score, 10);
});

test('a shard behind the shield cracks the core and resets the combo', () => {
  const game = quietGame();
  game.combo = 12;
  game.shards.push(flyingShard(game.shields[0] + Math.PI));
  run(game, 1);
  assert.equal(game.cracks, 1);
  assert.equal(game.combo, 0);
  assert.equal(game.shards.length, 0);
});

test('the third crack loses the round', () => {
  const game = quietGame();
  for (let i = 0; i < MAX_CRACKS; i++) {
    game.shards.push({ ...flyingShard(game.shields[0] + Math.PI), dist: CORE_R + 0.1 + i * 0.05 });
  }
  run(game, 1);
  assert.equal(game.phase, 'lost');
  assert.equal(game.coreBreaker, null);
});

test('surviving the round wins with a bonus per crack left', () => {
  const game = quietGame();
  game.cracks = 1;
  run(game, ROUND_SECONDS + 0.1);
  assert.equal(game.phase, 'won');
  assert.equal(game.score, (MAX_CRACKS - 1) * SURVIVAL_BONUS_PER_CRACK);
});

test('the shield turns no faster than its cap', () => {
  const game = quietGame();
  const start = game.shields[0];
  update(game, [{ targetAngle: start + Math.PI - 0.01, turn: 0 }], 0.1);
  const turned = Math.abs(wrapAngle(game.shields[0] - start));
  assert.ok(turned < Math.PI / 2, `turned ${turned} rad in 0.1 s`);
});

test('the multiplier steps every 8 combo and caps at x5', () => {
  assert.equal(multiplier(0), 1);
  assert.equal(multiplier(8), 2);
  assert.equal(multiplier(100), 5);
});

test('waves follow the design table and end in overdrive', () => {
  assert.equal(waveAt(0), WAVES[0]);
  assert.equal(waveAt(59.9), WAVES[1]);
  assert.equal(waveAt(119).overdrive, true);
});

test('an untouched round spawns shards and the core eventually breaks', () => {
  const game = createGame(seeded(1));
  startRound(game);
  run(game, 30);
  assert.equal(game.phase, 'lost');
});

test('a full solo round is winnable: the autopilot survives every seed tried', () => {
  // Regression: pairs used to arrive at the same instant from 90-180 degrees apart, which a
  // 70-degree shield can never block, so every round was lost by about 0:35.
  for (let seed = 1; seed <= 20; seed++) {
    const game = createGame(seeded(seed));
    startRound(game);
    autoplay(game, ROUND_SECONDS + 1);
    assert.equal(game.phase, 'won', `seed ${seed} lost at ${game.elapsed.toFixed(1)} s`);
  }
});

// Raid: viewers launch shards.

test('a viewer launch takes the next spawn, from the chosen slot, with their name', () => {
  const game = quietGame();
  assert.equal(launch(game, { slot: 3, by: 'nova' }), 'queued');
  game.untilSpawn = 0;
  run(game, STEP);
  assert.equal(game.shards.length, 1);
  assert.equal(game.shards[0].by, 'nova');
  assert.ok(Math.abs(wrapAngle(game.shards[0].angle - slotAngle(3))) < 1e-9);
  assert.equal(game.raiders.nova.launched, 1);
  assert.equal(game.raidQueue.length, 0);
});

test('slots go clockwise from the top', () => {
  assert.ok(Math.abs(slotAngle(0) + Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(slotAngle(RAID_SLOTS / 4)) < 1e-9);
});

test('each viewer waits out a cooldown; other viewers are not affected', () => {
  const game = quietGame();
  assert.equal(launch(game, { slot: 0, by: 'nova' }), 'queued');
  assert.equal(launch(game, { slot: 1, by: 'nova' }), 'cooldown');
  assert.equal(launch(game, { slot: 1, by: 'kartqueen' }), 'queued');
  run(game, VIEWER_COOLDOWN_SECONDS + 0.05);
  assert.equal(launch(game, { slot: 2, by: 'nova' }), 'queued');
});

test('launches are refused when the queue is full, the slot is invalid or no round is on', () => {
  const game = quietGame();
  for (let i = 0; i < RAID_QUEUE_MAX; i++) {
    assert.equal(launch(game, { slot: i % RAID_SLOTS, by: `viewer${i}` }), 'queued');
  }
  assert.equal(launch(game, { slot: 0, by: 'late' }), 'full');
  assert.equal(launch(game, { slot: RAID_SLOTS, by: 'x' }), 'bad-slot');
  assert.equal(launch(game, { slot: 1.5, by: 'y' }), 'bad-slot');
  assert.equal(launch(createGame(), { slot: 0, by: 'z' }), 'not-playing');
});

test('cracks are credited to the viewer, and the last one names the core breaker', () => {
  const game = quietGame();
  const behind = game.shields[0] + Math.PI;
  game.cracks = MAX_CRACKS - 1;
  game.shards.push({ ...flyingShard(behind, 'blockhead'), dist: CORE_R + 0.1 });
  run(game, 0.5);
  assert.equal(game.phase, 'lost');
  assert.equal(game.coreBreaker, 'blockhead');
  assert.equal(game.raiders.blockhead.cracks, 1);
  assert.deepEqual(topRaiders(game)[0], { by: 'blockhead', launched: 0, cracks: 1 });
});

test('viewers launching constantly cannot make a round unwinnable', () => {
  // Launches replace the game's own spawns, so the wave table's timing (and fairness) holds no
  // matter how many viewers there are or which slots they pick.
  for (let seed = 1; seed <= 10; seed++) {
    const game = createGame(seeded(seed));
    const pick = seeded(seed + 100);
    startRound(game);
    let n = 0;
    autoplay(game, ROUND_SECONDS + 1, (g) => {
      launch(g, { slot: Math.floor(pick() * RAID_SLOTS), by: `viewer${n++ % 50}` });
    });
    assert.equal(game.phase, 'won', `seed ${seed} lost at ${game.elapsed.toFixed(1)} s`);
    assert.ok(Object.keys(game.raiders).length > 10);
  }
});

// Duo: two shields on one core.

test('duo has two shields, and either one blocks', () => {
  const game = quietGame({ duo: true });
  assert.equal(game.shields.length, 2);
  game.shards.push(flyingShard(game.shields[1]));
  run(game, 0.5);
  assert.equal(game.perfects, 1);
  assert.equal(game.cracks, 0);
});

test('each duo player turns only their own shield', () => {
  const game = quietGame({ duo: true });
  const [a, b] = game.shields;
  update(game, [{ targetAngle: null, turn: 1 }], 0.1);
  assert.notEqual(game.shields[0], a);
  assert.equal(game.shields[1], b);
});

test('a full duo round is winnable', () => {
  for (let seed = 1; seed <= 10; seed++) {
    const game = createGame(seeded(seed), { duo: true });
    startRound(game);
    autoplay(game, ROUND_SECONDS + 1);
    assert.equal(game.phase, 'won', `seed ${seed} lost at ${game.elapsed.toFixed(1)} s`);
    assert.equal(game.shields.length, 2);
  }
});

test('duo shields are solid: one stops where it would overlap the other', () => {
  const game = quietGame({ duo: true });
  // Drive P1 straight at P2 for a full second.
  run(game, 1, [{ targetAngle: game.shields[1], turn: 0 }]);
  const gap = Math.abs(wrapAngle(game.shields[0] - game.shields[1]));
  assert.ok(gap >= MIN_SHIELD_GAP - 1e-9, `shields ${gap} rad apart`);
});
