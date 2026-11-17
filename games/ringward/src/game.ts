/**
 * Ringward game rules, with no DOM, canvas or network code so they can be unit tested.
 * Distances are in arena units: the rim is at 1, the centre at 0.
 *
 * Three ways to play (decision 010):
 * - Solo: one shield, the game spawns every shard.
 * - Duo: two shields on the same core, for a streamer and a friend.
 * - Raid (with either): viewers launch shards from rim slots. Their launches replace the
 *   game's own spawns, so difficulty is the same with 0 or 1,000 viewers; with none, the game
 *   spawns everything itself.
 */
import { waveAt } from './waves.ts';

const DEG = Math.PI / 180;

export const ROUND_SECONDS = 120;
export const MAX_CRACKS = 3;
export const RIM_R = 1;
export const SHIELD_R = 0.45;
export const CORE_R = 0.2;
export const SHARD_R = 0.06;
export const SHIELD_HALF_ARC = 35 * DEG;
/** The centre third of the shield. */
export const PERFECT_HALF_ARC = SHIELD_HALF_ARC / 3;
/** Swing speed caps, raised Nov 17, 2026 at the project lead's request (were 540 and 300). */
export const SHIELD_TURN_SPEED = 720 * DEG;
export const KEY_TURN_SPEED = 420 * DEG;
export const WARNING_SECONDS = 0.6;
export const SURVIVAL_BONUS_PER_CRACK = 250;
/** Rim slots viewers launch from, numbered clockwise from the top like a clock. */
export const RAID_SLOTS = 12;
/** Seconds a viewer waits between launches. */
export const VIEWER_COOLDOWN_SECONDS = 4;
/** Launches waiting to spawn; more are refused, so viewers get instant "full" feedback. */
export const RAID_QUEUE_MAX = 8;
/** Two shields cover more of the ring, so duo rounds spawn this much more often. */
export const DUO_INTERVAL_FACTOR = 0.7;
/** Duo shields can't overlap: their centres stay at least one shield-width apart. */
export const MIN_SHIELD_GAP = 2 * SHIELD_HALF_ARC;
const COMBO_PER_MULTIPLIER = 8;
const MAX_MULTIPLIER = 5;
const RICOCHET_SPEED_FACTOR = 1.6;
const PAIR_REACTION_SECONDS = 0.15;

export type Phase = 'ready' | 'playing' | 'won' | 'lost';
export type ShardState = 'warning' | 'flying' | 'deflected' | 'gone';
export type HitKind = 'block' | 'perfect' | 'crack';
export type LaunchResult = 'queued' | 'cooldown' | 'full' | 'not-playing' | 'bad-slot';

export interface Shard {
  angle: number;
  dist: number;
  speed: number;
  state: ShardState;
  /** Seconds left in the warning state. */
  warning: number;
  /** The viewer who launched it, or null for the game's own shards. */
  by: string | null;
}

/** Something that just happened, for the renderer to animate. */
export interface GameEvent {
  kind: HitKind;
  angle: number;
  points: number;
  age: number;
  by: string | null;
}

export interface Input {
  /** Pointer angle around the core, or null to ignore the pointer. */
  targetAngle: number | null;
  /** -1 turns anticlockwise, 1 clockwise, 0 none. Overrides the pointer. */
  turn: number;
}

export const NO_INPUT: Input = { targetAngle: null, turn: 0 };

/** A viewer's request to launch a shard, as it arrives from the GameTime app. */
export interface Launch {
  slot: number;
  by: string;
}

export interface Game {
  phase: Phase;
  elapsed: number;
  /** One angle per shield: one in solo, two in duo. */
  shields: number[];
  shards: Shard[];
  events: GameEvent[];
  score: number;
  combo: number;
  cracks: number;
  /** Cracks taken by each fish (one per shield, nearest to where the shard landed), for drawing damage. */
  hurt: number[];
  blocks: number;
  perfects: number;
  untilSpawn: number;
  raidQueue: Launch[];
  /** Round time of each viewer's last accepted launch, for the cooldown. */
  lastLaunch: Record<string, number>;
  /** Shards launched and cracks landed, per viewer. */
  raiders: Record<string, { launched: number; cracks: number }>;
  /** The viewer whose shard landed the final crack, if a viewer's did. */
  coreBreaker: string | null;
  random: () => number;
}

export interface GameOptions {
  duo?: boolean;
}

export function createGame(random: () => number = Math.random, options: GameOptions = {}): Game {
  const shields = options.duo ? [-Math.PI / 2, Math.PI / 2] : [-Math.PI / 2];
  return {
    phase: 'ready',
    elapsed: 0,
    shields,
    hurt: shields.map(() => 0),
    shards: [],
    events: [],
    score: 0,
    combo: 0,
    cracks: 0,
    blocks: 0,
    perfects: 0,
    untilSpawn: 0.8,
    raidQueue: [],
    lastLaunch: {},
    raiders: {},
    coreBreaker: null,
    random,
  };
}

export function isDuo(game: Game): boolean {
  return game.shields.length > 1;
}

export function startRound(game: Game): void {
  const fresh = createGame(game.random, { duo: isDuo(game) });
  Object.assign(game, fresh, { phase: 'playing' as Phase, shields: [...game.shields] });
}

/** Wraps an angle to (-PI, PI]. */
export function wrapAngle(a: number): number {
  let r = a % (2 * Math.PI);
  if (r <= -Math.PI) r += 2 * Math.PI;
  if (r > Math.PI) r -= 2 * Math.PI;
  return r;
}

/** Slot 0 is at the top; slots go clockwise. */
export function slotAngle(slot: number): number {
  return wrapAngle(-Math.PI / 2 + (slot * 2 * Math.PI) / RAID_SLOTS);
}

export function multiplier(combo: number): number {
  return Math.min(MAX_MULTIPLIER, 1 + Math.floor(combo / COMBO_PER_MULTIPLIER));
}

export function timeLeft(game: Game): number {
  return Math.max(0, ROUND_SECONDS - game.elapsed);
}

export function isOverdrive(game: Game): boolean {
  return game.phase === 'playing' && waveAt(game.elapsed).overdrive;
}

/**
 * A viewer asks to launch a shard. The host calls this for every request it receives and sends
 * the result back to that viewer. Accepted launches spawn in order, one per spawn tick.
 */
export function launch(game: Game, request: Launch): LaunchResult {
  if (game.phase !== 'playing') return 'not-playing';
  if (!Number.isInteger(request.slot) || request.slot < 0 || request.slot >= RAID_SLOTS) {
    return 'bad-slot';
  }
  const last = game.lastLaunch[request.by];
  if (last !== undefined && game.elapsed - last < VIEWER_COOLDOWN_SECONDS) return 'cooldown';
  if (game.raidQueue.length >= RAID_QUEUE_MAX) return 'full';
  game.raidQueue.push({ slot: request.slot, by: request.by });
  game.lastLaunch[request.by] = game.elapsed;
  return 'queued';
}

function raider(game: Game, by: string): { launched: number; cracks: number } {
  game.raiders[by] ??= { launched: 0, cracks: 0 };
  return game.raiders[by];
}

/** Viewers ranked by cracks landed, then by shards launched. */
export function topRaiders(game: Game, count = 3): { by: string; launched: number; cracks: number }[] {
  return Object.entries(game.raiders)
    .map(([by, r]) => ({ by, ...r }))
    .sort((a, b) => b.cracks - a.cracks || b.launched - a.launched)
    .slice(0, count);
}

function turnShield(game: Game, index: number, input: Input, dt: number): void {
  const angle = game.shields[index];
  let step = 0;
  if (input.turn !== 0) {
    step = input.turn * KEY_TURN_SPEED * dt;
  } else if (input.targetAngle !== null) {
    const diff = wrapAngle(input.targetAngle - angle);
    const maxStep = SHIELD_TURN_SPEED * dt;
    step = Math.max(-maxStep, Math.min(maxStep, diff));
  }
  if (step === 0) return;
  let next = wrapAngle(angle + step);
  // Duo shields are solid to each other: one stops where it would overlap the other, so the
  // two players have to split the ring between them (and both shields stay visible).
  game.shields.forEach((other, j) => {
    if (j === index) return;
    const gap = wrapAngle(next - other);
    if (Math.abs(gap) < MIN_SHIELD_GAP) {
      const side = Math.sign(wrapAngle(angle - other)) || 1;
      next = wrapAngle(other + side * MIN_SHIELD_GAP);
    }
  });
  game.shields[index] = next;
}

function spawn(game: Game): void {
  const wave = waveAt(game.elapsed);
  const speed = (RIM_R - CORE_R) / wave.travel;
  const interval = wave.interval * (isDuo(game) ? DUO_INTERVAL_FACTOR : 1);
  const make = (angle: number, by: string | null, delay = 0): Shard => ({
    angle,
    dist: RIM_R,
    speed,
    state: 'warning',
    warning: WARNING_SECONDS + delay,
    by,
  });

  // A viewer's launch takes this spawn's place. Viewers only launch singles, so the timing
  // (and the fairness rules below) stays the wave table's.
  const next = game.raidQueue.shift();
  if (next) {
    game.shards.push(make(slotAngle(next.slot), next.by));
    raider(game, next.by).launched += 1;
    game.untilSpawn += interval;
    return;
  }

  const angle = wrapAngle(game.random() * 2 * Math.PI);
  game.shards.push(make(angle, null));
  if (game.random() < wave.pairChance) {
    // The second shard comes from 90–180° away, so covering both means a real turn. It arrives
    // just late enough for the shield to make that turn at full speed; without the delay a
    // pair could never be blocked.
    const side = game.random() < 0.5 ? -1 : 1;
    const offset = (Math.PI / 2) * (1 + game.random());
    const delay = pairDelay(offset);
    game.shards.push(make(wrapAngle(angle + side * offset), null, delay));
    // Hold the next spawn back by the same delay, so it can't arrive on top of the pair.
    game.untilSpawn += delay;
  }
  game.untilSpawn += interval;
}

/** Seconds the second shard of a pair waits: the full-speed turn time plus a reaction margin. */
export function pairDelay(offset: number): number {
  const turnable = Math.max(0, Math.abs(offset) - 2 * PERFECT_HALF_ARC);
  return turnable / SHIELD_TURN_SPEED + PAIR_REACTION_SECONDS;
}

function hit(game: Game, kind: HitKind, shard: Shard): void {
  let points = 0;
  if (kind === 'crack') {
    game.cracks += 1;
    game.hurt[nearestShieldIndex(game, shard.angle)] += 1;
    game.combo = 0;
    if (shard.by) raider(game, shard.by).cracks += 1;
    if (game.cracks >= MAX_CRACKS) game.coreBreaker = shard.by;
  } else {
    const perfect = kind === 'perfect';
    points = (perfect ? 25 : 10) * multiplier(game.combo);
    game.score += points;
    game.combo += perfect ? 2 : 1;
    game.blocks += 1;
    if (perfect) game.perfects += 1;
  }
  game.events.push({ kind, angle: shard.angle, points, age: 0, by: shard.by });
}

/** Which shield (and so which fish) a shard landed nearest to. */
export function nearestShieldIndex(game: Game, angle: number): number {
  let best = 0;
  game.shields.forEach((a, i) => {
    if (Math.abs(wrapAngle(angle - a)) < Math.abs(wrapAngle(angle - game.shields[best]))) best = i;
  });
  return best;
}

/** The smallest angular distance from a shard to any shield. */
function nearestShieldOffset(game: Game, angle: number): number {
  let best = Infinity;
  for (const shield of game.shields) best = Math.min(best, Math.abs(wrapAngle(angle - shield)));
  return best;
}

/** Advances the game by dt seconds. `inputs` has one entry per shield; missing ones are idle. */
export function update(game: Game, inputs: readonly Input[], dt: number): void {
  for (const e of game.events) e.age += dt;
  game.events = game.events.filter((e) => e.age < 1.2);

  game.shields.forEach((_, i) => turnShield(game, i, inputs[i] ?? NO_INPUT, dt));
  // Deflected shards keep flying out after the round ends, for the result screen.
  for (const s of game.shards) {
    if (s.state === 'deflected') {
      s.dist += s.speed * RICOCHET_SPEED_FACTOR * dt;
      if (s.dist > RIM_R + 0.4) s.state = 'gone';
    }
  }
  if (game.phase !== 'playing') {
    game.shards = game.shards.filter((s) => s.state === 'deflected');
    return;
  }

  game.elapsed += dt;
  game.untilSpawn -= dt;
  while (game.untilSpawn <= 0) spawn(game);

  for (const s of game.shards) {
    if (s.state === 'warning') {
      s.warning -= dt;
      if (s.warning <= 0) s.state = 'flying';
      continue;
    }
    if (s.state !== 'flying') continue;
    const before = s.dist;
    s.dist -= s.speed * dt;
    const contact = SHIELD_R + SHARD_R;
    if (before > contact && s.dist <= contact) {
      const off = nearestShieldOffset(game, s.angle);
      if (off <= SHIELD_HALF_ARC) {
        s.state = 'deflected';
        s.dist = contact;
        hit(game, off <= PERFECT_HALF_ARC ? 'perfect' : 'block', s);
        continue;
      }
    }
    if (s.dist <= CORE_R + SHARD_R) {
      s.state = 'gone';
      hit(game, 'crack', s);
    }
  }
  game.shards = game.shards.filter((s) => s.state !== 'gone');

  if (game.cracks >= MAX_CRACKS) {
    game.phase = 'lost';
    game.raidQueue = [];
  } else if (game.elapsed >= ROUND_SECONDS) {
    game.elapsed = ROUND_SECONDS;
    game.score += (MAX_CRACKS - game.cracks) * SURVIVAL_BONUS_PER_CRACK;
    game.phase = 'won';
    game.raidQueue = [];
  }
}

/**
 * A simple autopilot for attract mode, demos and tests. Each incoming shard is assigned to the
 * nearest shield, and each shield aims at its soonest one. It is deliberately imperfect.
 */
export function autopilotInputs(game: Game): Input[] {
  const soonest: ({ angle: number; eta: number } | null)[] = game.shields.map(() => null);
  for (const s of game.shards) {
    if (s.state !== 'flying' && s.state !== 'warning') continue;
    const eta = (s.state === 'warning' ? s.warning : 0) + (s.dist - SHIELD_R) / s.speed;
    let nearest = 0;
    game.shields.forEach((a, i) => {
      if (Math.abs(wrapAngle(s.angle - a)) < Math.abs(wrapAngle(s.angle - game.shields[nearest]))) {
        nearest = i;
      }
    });
    const current = soonest[nearest];
    if (!current || eta < current.eta) soonest[nearest] = { angle: s.angle, eta };
  }
  return soonest.map((t) => (t ? { targetAngle: t.angle + 0.12, turn: 0 } : NO_INPUT));
}
