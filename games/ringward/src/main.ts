/**
 * Ringward greybox: wires the rules (game.ts) to a full-window canvas, the mouse and keyboard.
 *
 * URL options:
 * - ?duo          two shields: P1 on mouse or A/D, P2 on the arrow keys
 * - ?viewers=20   simulated viewers launch shards, standing in for the GameTime app until the
 *                 Realtime connection exists (docs/game/hosting-and-interaction.md)
 * - ?autopilot    the shields play themselves, for demos and the OBS test
 * - ?guides       9:16 crop guides (also the G key)
 */
import {
  RAID_SLOTS,
  autopilotInputs,
  createGame,
  isDuo,
  launch,
  startRound,
  update,
  type Game,
  type Input,
  type Launch,
} from './game.ts';
import { computeLayout, render, type Layout } from './render.ts';

const BEST_KEY = 'ringward.best';
const MAX_STEP = 1 / 30;
/** Average seconds between a simulated viewer's launch attempts. */
const SIM_VIEWER_MEAN_SECONDS = 7;
const SIM_NAMES = [
  'pixelpilot', 'nova', 'kartqueen', 'blockhead', 'combo_king', 'scroller', 'squadseeker',
  'lagwizard', 'tiltproof', 'orbitcat', 'mintmuncher', 'shardslinger', 'frame_perfect',
  'nightowl', 'respawnrae', 'ggnoreply', 'quickscope', 'latte_lord', 'byte_me', 'clutchcarl',
];

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;
const params = new URLSearchParams(location.search);

const game: Game = createGame(Math.random, { duo: params.has('duo') });
const simViewers = Math.max(0, Math.min(500, Number(params.get('viewers')) || 0));
let layout: Layout = computeLayout(window.innerWidth, window.innerHeight);
let pointerAngle: number | null = null;
let showGuides = params.has('guides');
let autopilot = params.has('autopilot');
let best = readBest();
let lastTime = performance.now();
let endedAt = 0;
const keys = new Set<string>();

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score: number): void {
  if (score <= best) return;
  best = score;
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // Storage can be blocked (private windows, OBS browser sources); the best score is optional.
  }
}

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  layout = computeLayout(window.innerWidth, window.innerHeight);
}

function startOrRestart(): void {
  // A short lockout so a frantic click at the end doesn't skip the result card.
  if (game.phase === 'playing' || performance.now() - endedAt < 600) return;
  startRound(game);
}

window.addEventListener('resize', resize);
canvas.addEventListener('pointermove', (e) => {
  pointerAngle = Math.atan2(e.clientY - layout.cy, e.clientX - layout.cx);
});
canvas.addEventListener('pointerdown', (e) => {
  pointerAngle = Math.atan2(e.clientY - layout.cy, e.clientX - layout.cx);
  startOrRestart();
});
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if (k === ' ' || k === 'enter') {
    e.preventDefault();
    startOrRestart();
  } else if (k === 'g') {
    showGuides = !showGuides;
  } else if (k === 'p') {
    autopilot = !autopilot;
  } else if (k === 'a' || k === 'd' || (!isDuo(game) && (k === 'arrowleft' || k === 'arrowright'))) {
    pointerAngle = null; // Keys take over P1 until the pointer moves again.
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

function axis(left: string[], right: string[]): number {
  return (right.some((k) => keys.has(k)) ? 1 : 0) - (left.some((k) => keys.has(k)) ? 1 : 0);
}

function playerInputs(): Input[] {
  if (!isDuo(game)) {
    return [{ targetAngle: pointerAngle, turn: axis(['a', 'arrowleft'], ['d', 'arrowright']) }];
  }
  return [
    { targetAngle: pointerAngle, turn: axis(['a'], ['d']) },
    { targetAngle: null, turn: axis(['arrowleft'], ['arrowright']) },
  ];
}

/** Stand-in for viewers in the GameTime app: each tries to launch now and then. */
function simulateViewers(dt: number): void {
  for (let i = 0; i < simViewers; i++) {
    if (Math.random() < dt / SIM_VIEWER_MEAN_SECONDS) {
      const by = SIM_NAMES[i % SIM_NAMES.length] + (i >= SIM_NAMES.length ? `_${i}` : '');
      launch(game, { slot: Math.floor(Math.random() * RAID_SLOTS), by });
    }
  }
}

function frame(now: number): void {
  const dt = Math.min(MAX_STEP, (now - lastTime) / 1000);
  lastTime = now;

  if (autopilot && game.phase !== 'playing' && now - endedAt > 2500) startRound(game);
  if (game.phase === 'playing') simulateViewers(dt);

  const wasPlaying = game.phase === 'playing';
  update(game, autopilot ? autopilotInputs(game) : playerInputs(), dt);
  if (wasPlaying && game.phase !== 'playing') {
    endedAt = now;
    if (!autopilot) saveBest(game.score);
  }

  render(ctx, layout, game, { showGuides, best, autopilot, now: now / 1000 });
  requestAnimationFrame(frame);
}

resize();
if (import.meta.env.DEV) {
  // Debug hooks: inspect state, or launch as a viewer from the console.
  Object.assign(window, {
    ringward: game,
    ringwardLaunch: (request: Launch) => launch(game, request),
  });
}
requestAnimationFrame(frame);
