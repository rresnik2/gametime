/**
 * Draws a Game onto a canvas. Greybox: flat placeholder shapes in GameTime's palette, no assets.
 *
 * Theme (decision 009): fish in a barrel, seen from above, tropical. The arena is a wooden barrel
 * of lagoon water; the "core" is the goldfish (two in duo) in the middle, each holding a shield;
 * "shards" are cartoon cannonballs fired in over the rim; a "crack" is a BONK. The rules in game.ts keep their neutral names; the
 * glossary is in docs/game/design.md.
 */
import {
  CORE_R,
  MAX_CRACKS,
  PERFECT_HALF_ARC,
  RAID_SLOTS,
  SHARD_R,
  SHIELD_HALF_ARC,
  SHIELD_R,
  WARNING_SECONDS,
  isDuo,
  isOverdrive,
  multiplier,
  slotAngle,
  timeLeft,
  topRaiders,
  type Game,
} from './game.ts';

/** Mirrors src/theme/tokens.ts in the app. */
export const palette = {
  background: '#0B0B12',
  surface: '#16161F',
  border: '#2A2A38',
  primary: '#7C5CFF',
  live: '#FF3B5C',
  mint: '#2EF2C3',
  text: '#FFFFFF',
  textSecondary: '#A1A1B5',
};

/**
 * The look on screen: old-timey and nostalgic (project lead, Nov 17, 2026). Same keys as the app
 * palette, pushed towards a faded postcard: ink instead of black, cream instead of white, a
 * faded GameTime purple for P1's shield.
 */
const VINTAGE = {
  background: '#17110D',
  surface: '#2A2018',
  border: '#4A3A2C',
  primary: '#8E6CC4',
  live: '#D2483C',
  mint: '#8CC7A8',
  text: '#F4E7C8',
  textSecondary: '#C9B591',
  ink: '#1A1410',
  stripe: '#211812',
};

/** Player 1's shield is GameTime purple; player 2's (duo) is white, so they never blur together. */
const SHIELD_COLORS = [
  { body: VINTAGE.primary, perfect: '#BBA2E6' },
  { body: '#E9DCBE', perfect: '#FFF8E6' },
];

/**
 * Theme colours outside GameTime's palette, by the project lead's direction (Nov 17, 2026):
 * an orange goldfish with bright red lips in a wooden barrel. The HUD and UI stay in the VINTAGE.
 */
const THEME = {
  water: '#3F7F78',
  waterEdge: '#1F3E3E',
  lilyPad: '#6E9452',
  leaf: '#789F55',
  leafVein: '#4C6B34',
  rope: '#D8B37A',
  ropeDark: '#A9834E',
  blush: 'rgba(255,92,138,0.5)',
  lashes: '#0B0B12',
  bandAid: '#F2C79B',
  sweat: '#9FE3FF',
  /** P1 wears a pink hibiscus, P2 a white plumeria (matching the white P2 shield). */
  flowers: [
    { petal: '#E0708E', centre: '#E3B04B' },
    { petal: '#F4E7C8', centre: '#E3B04B' },
  ],
  /** Cartoon cannonballs: dark iron with a light rim so they stand out on the water. */
  cannonball: '#1A1410',
  cannonballRim: '#C9C9D6',
  smoke: 'rgba(244,231,200,0.35)',
  fish: '#E98A3C',
  fishShade: '#C96A28',
  fishBump: '#F2B27A',
  lips: '#D8323A',
  wood: '#8A5A2E',
  woodJoint: '#5A3818',
  woodSlot: '#C89A64',
};

/** Slab-serif poster lettering for the old-timey look; falls back to Georgia. */
const DISPLAY_FONT = 'Rockwell, "Roboto Slab", Georgia, "Times New Roman", serif';

export interface Layout {
  width: number;
  height: number;
  cx: number;
  cy: number;
  /** Barrel radius in CSS pixels (the rules' arena radius). */
  r: number;
  /** Width of the centred 9:16 column that survives a vertical crop. */
  column: number;
}

export function computeLayout(width: number, height: number): Layout {
  const column = Math.min(width, (height * 9) / 16);
  // The rim and hoop add 7% outside r; together they stay within 92% of the column's width.
  const r = Math.min(column * 0.43, height * 0.315);
  return { width, height, cx: width / 2, cy: height / 2, r, column };
}

function font(px: number, weight = 700): string {
  return `${weight} ${Math.round(px)}px ${DISPLAY_FONT}`;
}

function polar(l: Layout, angle: number, dist: number): [number, number] {
  return [l.cx + Math.cos(angle) * dist * l.r, l.cy + Math.sin(angle) * dist * l.r];
}

function formatTime(seconds: number): string {
  const s = Math.ceil(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Truncates viewer names so labels stay short on a phone screen. */
function shortName(name: string): string {
  return name.length > 12 ? `${name.slice(0, 11)}…` : name;
}

export interface RenderOptions {
  showGuides: boolean;
  best: number;
  autopilot: boolean;
  now: number;
}

export function render(ctx: CanvasRenderingContext2D, l: Layout, game: Game, o: RenderOptions): void {
  const { cx, cy, r } = l;
  const overdrive = isOverdrive(game);
  const recentBonk = game.events.find((e) => e.kind === 'crack' && e.age < 0.25);
  const labelPx = Math.max(11, l.column * 0.032);
  placedLabels.length = 0;

  ctx.save();
  ctx.fillStyle = VINTAGE.background;
  ctx.fillRect(0, 0, l.width, l.height);
  // Faded carnival-tent stripes behind the barrel.
  const stripeW = Math.max(18, l.column / 9);
  ctx.fillStyle = VINTAGE.stripe;
  for (let sx = (l.cx % (stripeW * 2)) - stripeW * 2; sx < l.width; sx += stripeW * 2) {
    ctx.fillRect(sx, 0, stripeW, l.height);
  }

  if (overdrive) {
    const pulse = 0.08 + 0.06 * Math.sin(o.now * 8);
    const g = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, Math.max(l.width, l.height) * 0.7);
    g.addColorStop(0, 'rgba(210,72,60,0)');
    g.addColorStop(1, `rgba(210,72,60,${pulse})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l.width, l.height);
  }

  if (recentBonk) {
    const shake = r * 0.03 * (1 - recentBonk.age / 0.25);
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  drawBarrel(ctx, l, overdrive, o.now);

  // Incoming cannonballs: a red ring on the rim first (the warning), then the ball.
  for (const s of game.shards) {
    if (s.state === 'warning') {
      const t = Math.max(0, 1 - s.warning / WARNING_SECONDS);
      const [x, y] = polar(l, s.angle, 0.97);
      ctx.beginPath();
      ctx.arc(x, y, r * (0.03 + 0.06 * t), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(210,72,60,${0.35 + 0.6 * t})`;
      ctx.lineWidth = Math.max(2, r * 0.018);
      ctx.stroke();
      if (s.by) drawName(ctx, l, s.angle, 0.82, s.by, labelPx);
      continue;
    }
    const bounced = s.state === 'deflected';
    // Bounced balls fade out at the rim instead of flying over the score.
    if (bounced && s.dist > 0.95) continue;
    const [x, y] = polar(l, s.angle, s.dist);
    const k = SHARD_R * r;
    const fade = bounced ? Math.max(0, Math.min(1, (0.95 - s.dist) / 0.25)) : 1;
    // Smoke puffs trailing behind the cannonball.
    for (let p = 1; p <= 3; p++) {
      const [px, py] = polar(l, s.angle, bounced ? s.dist - 0.06 * p : s.dist + 0.06 * p);
      ctx.beginPath();
      ctx.arc(px, py, k * (0.45 + 0.18 * p), 0, Math.PI * 2);
      ctx.fillStyle = THEME.smoke;
      ctx.globalAlpha = fade * (1 - p * 0.25);
      ctx.fill();
    }
    ctx.globalAlpha = fade;
    // The cannonball: dark iron, a light rim for contrast, a red warning ring while incoming.
    ctx.beginPath();
    ctx.arc(x, y, k, 0, Math.PI * 2);
    ctx.fillStyle = bounced ? VINTAGE.textSecondary : THEME.cannonball;
    ctx.fill();
    ctx.strokeStyle = bounced ? THEME.cannonballRim : VINTAGE.live;
    ctx.lineWidth = Math.max(1.5, k * 0.22);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - k * 0.35, y - k * 0.35, k * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
    ctx.globalAlpha = 1;
    if (s.by && !bounced) drawName(ctx, l, s.angle, s.dist, s.by, labelPx, k * 2.6);
  }

  // Shields, each on a stick held by its fish.
  const fish = fishPositions(l, game);
  game.shields.forEach((a, i) => {
    const color = SHIELD_COLORS[i] ?? SHIELD_COLORS[0];
    const f = fish[i] ?? fish[0];
    const [hx, hy] = polar(l, a, SHIELD_R - 0.03);
    ctx.beginPath();
    // The stick starts at the fish's front fin (below the lips) and ends at the shield.
    const fin = f.size * 0.45;
    ctx.moveTo(f.x + Math.cos(a) * f.size * 0.55 - Math.sin(a) * fin, f.y + Math.sin(a) * f.size * 0.55 + Math.cos(a) * fin);
    ctx.lineTo(hx, hy);
    ctx.strokeStyle = color.body;
    ctx.lineWidth = Math.max(2, r * 0.016);
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, SHIELD_R * r, a - SHIELD_HALF_ARC, a + SHIELD_HALF_ARC);
    ctx.strokeStyle = color.body;
    ctx.lineWidth = r * 0.07;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, SHIELD_R * r, a - PERFECT_HALF_ARC, a + PERFECT_HALF_ARC);
    ctx.strokeStyle = color.perfect;
    ctx.lineCap = 'butt';
    ctx.stroke();
    if (isDuo(game)) {
      const [px, py] = polar(l, a, SHIELD_R + 0.13);
      ctx.fillStyle = color.body;
      ctx.font = font(r * 0.075);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P${i + 1}`, px, py);
    }
  });

  // The fish themselves, drawn last in the water so they sit on top of their sticks.
  const flash = recentBonk ? 1 - recentBonk.age / 0.25 : 0;
  fish.forEach((f, i) => drawFish(ctx, f, i, game.cracks, game.phase === 'lost', flash, o.now));

  // Popups: points for blocks, BONK! when a ball gets through.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const e of game.events) {
    const t = e.age / 1.2;
    ctx.globalAlpha = 1 - t;
    if (e.kind === 'crack') {
      const [x, y] = polar(l, e.angle, CORE_R + 0.12 + t * 0.1);
      ctx.fillStyle = VINTAGE.live;
      ctx.font = font(r * 0.12);
      ctx.fillText('BONK!', x, y);
    } else {
      const [x, y] = polar(l, e.angle, SHIELD_R + 0.12 + t * 0.15);
      ctx.fillStyle = e.kind === 'perfect' ? VINTAGE.mint : VINTAGE.text;
      ctx.font = font(r * (e.kind === 'perfect' ? 0.12 : 0.09));
      ctx.fillText(`+${e.points}`, x, y);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  drawHud(ctx, l, game, o);
  drawOldFilm(ctx, l, o.now);
  if (o.showGuides) drawGuides(ctx, l);
}

/**
 * Old-film finish over everything: a warm sepia wash, a vignette, grain, the odd scratch and a
 * gentle flicker. Kept light so the score, names and balls stay readable on a phone.
 */
function drawOldFilm(ctx: CanvasRenderingContext2D, l: Layout, now: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(232,206,160,0.35)';
  ctx.fillRect(0, 0, l.width, l.height);
  ctx.globalCompositeOperation = 'source-over';

  const vignette = ctx.createRadialGradient(l.cx, l.cy, Math.min(l.width, l.height) * 0.35, l.cx, l.cy, Math.max(l.width, l.height) * 0.75);
  vignette.addColorStop(0, 'rgba(23,17,13,0)');
  vignette.addColorStop(1, 'rgba(23,17,13,0.7)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, l.width, l.height);

  // Grain: a few hundred specks, different every frame.
  const specks = Math.round((l.width * l.height) / 2500);
  for (let i = 0; i < specks; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(244,231,200,0.07)' : 'rgba(23,17,13,0.12)';
    ctx.fillRect(Math.random() * l.width, Math.random() * l.height, 1.5, 1.5);
  }
  // A scratch now and then.
  if (Math.sin(now * 13.7) > 0.6) {
    const sx = ((Math.sin(now * 3.1) + 1) / 2) * l.width;
    ctx.fillStyle = 'rgba(244,231,200,0.12)';
    ctx.fillRect(sx, 0, 1, l.height);
  }
  // Flicker.
  ctx.fillStyle = `rgba(23,17,13,${0.03 + 0.03 * Math.sin(now * 23)})`;
  ctx.fillRect(0, 0, l.width, l.height);
  ctx.restore();
}

/** Top-down barrel: water inside, a thick rim of staves, a hoop around it. */
function drawBarrel(ctx: CanvasRenderingContext2D, l: Layout, overdrive: boolean, now: number): void {
  const { cx, cy, r } = l;
  const rimWidth = r * 0.07;

  // Lagoon-coloured water, lighter in the middle, with two slow ripples and a few lily pads.
  const water = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  water.addColorStop(0, THEME.water);
  water.addColorStop(1, THEME.waterEdge);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = water;
  ctx.fill();
  for (let i = 0; i < 2; i++) {
    const phase = (now * 0.25 + i * 0.5) % 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * (0.25 + 0.65 * phase), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(244,231,200,${0.12 * (1 - phase)})`;
    ctx.lineWidth = Math.max(1, r * 0.008);
    ctx.stroke();
  }
  for (const [a, d, k] of [[0.5, 0.78, 0.07], [2.6, 0.72, 0.055], [4.1, 0.8, 0.06]]) {
    const [px, py] = polar(l, a + now * 0.02, d);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, r * k, a + 0.12, a + Math.PI * 2 - 0.12);
    ctx.closePath();
    ctx.fillStyle = THEME.lilyPad;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    // Veins radiating from the notch, so it reads as a leaf.
    ctx.strokeStyle = THEME.leafVein;
    ctx.lineWidth = Math.max(1, r * 0.005);
    for (const v of [1.6, 3.14, 4.7]) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a + v) * r * k * 0.85, py + Math.sin(a + v) * r * k * 0.85);
      ctx.stroke();
    }
  }

  // Rim: a thick band, split into staves. The 12 throw slots sit on stave joints and match the
  // slot ring in the app's Raid sheet.
  ctx.beginPath();
  ctx.arc(cx, cy, r + rimWidth / 2, 0, Math.PI * 2);
  ctx.strokeStyle = THEME.wood;
  ctx.lineWidth = rimWidth;
  ctx.stroke();
  for (let i = 0; i < RAID_SLOTS * 2; i++) {
    const a = slotAngle(0) + (i * Math.PI) / RAID_SLOTS;
    const slot = i % 2 === 0;
    const [x1, y1] = polar(l, a, 1);
    const [x2, y2] = polar(l, a, 1 + rimWidth / r);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = slot ? THEME.woodSlot : THEME.woodJoint;
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(1, r * (slot ? 0.012 : 0.008));
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Rope hoop: two twisted strands.
  const ropeWidth = Math.max(2, r * 0.018);
  ctx.beginPath();
  ctx.arc(cx, cy, r + rimWidth, 0, Math.PI * 2);
  ctx.strokeStyle = overdrive ? VINTAGE.live : THEME.rope;
  ctx.lineWidth = ropeWidth;
  ctx.stroke();
  if (!overdrive) {
    ctx.setLineDash([ropeWidth * 0.8, ropeWidth * 1.2]);
    ctx.strokeStyle = THEME.ropeDark;
    ctx.lineWidth = ropeWidth * 0.6;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Tropical leaves hanging over the rim.
  for (const a of [-2.35, -0.75, 1.95]) drawLeaf(ctx, l, a, r * 0.16);

  // The track the shields move along.
  ctx.beginPath();
  ctx.arc(cx, cy, SHIELD_R * r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(201,181,145,0.15)';
  ctx.lineWidth = Math.max(1, r * 0.006);
  ctx.stroke();
}

/** A broad tropical leaf hooked over the rim at angle a, pointing into the barrel. */
function drawLeaf(ctx: CanvasRenderingContext2D, l: Layout, a: number, size: number): void {
  const [x, y] = polar(l, a, 1.04);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a + Math.PI);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.55, -size * 0.55, size * 1.25, 0);
  ctx.quadraticCurveTo(size * 0.55, size * 0.55, 0, 0);
  ctx.fillStyle = THEME.leaf;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 1.15, 0);
  for (let i = 1; i <= 3; i++) {
    const vx = size * 0.28 * i;
    ctx.moveTo(vx, 0);
    ctx.lineTo(vx + size * 0.18, -size * 0.22);
    ctx.moveTo(vx, 0);
    ctx.lineTo(vx + size * 0.18, size * 0.22);
  }
  ctx.strokeStyle = THEME.leafVein;
  ctx.lineWidth = Math.max(1, size * 0.05);
  ctx.stroke();
  ctx.restore();
}

interface FishSpot {
  x: number;
  y: number;
  size: number;
  facing: number;
}

/** One big fish in the middle (solo), or two smaller ones nudged towards their shields (duo). */
function fishPositions(l: Layout, game: Game): FishSpot[] {
  if (!isDuo(game)) {
    return [{ x: l.cx, y: l.cy, size: CORE_R * l.r * 0.95, facing: game.shields[0] }];
  }
  return game.shields.map((a) => {
    const [x, y] = polar(l, a, CORE_R * 0.8);
    return { x, y, size: CORE_R * l.r * 0.5, facing: a };
  });
}

/**
 * A round cartoon goldfish facing its shield: orange, bright red lips, lashes, blush and a
 * tropical flower (P1 hibiscus, P2 plumeria). Bonks add bumps; when the round is lost it's dizzy.
 */
function drawFish(
  ctx: CanvasRenderingContext2D,
  f: FishSpot,
  player: number,
  bonks: number,
  dizzy: boolean,
  /** 1 right after a bonk, fading to 0: the fish flashes and squashes. */
  flash: number,
  now: number,
): void {
  const { x, y, size } = f;
  const hurt = dizzy ? MAX_CRACKS : Math.min(bonks, MAX_CRACKS);
  const flower = THEME.flowers[player] ?? THEME.flowers[0];
  const wiggle = Math.sin(now * 6 + player) * 0.12;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(f.facing);
  // Facing left, mirror so the fin and flower stay on top instead of turning upside down.
  if (Math.cos(f.facing) < 0) ctx.scale(1, -1);
  // Squash on impact.
  if (flash > 0) ctx.scale(1 + 0.12 * flash, 1 - 0.18 * flash);

  // Tail (behind the body), flicking gently, with fin lines.
  ctx.save();
  ctx.translate(-size * 0.7, 0);
  ctx.rotate(wiggle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-size * 0.5, -size * 0.85, -size * 0.75, -size * 0.6);
  ctx.quadraticCurveTo(-size * 0.45, 0, -size * 0.75, size * 0.6);
  ctx.quadraticCurveTo(-size * 0.5, size * 0.85, 0, 0);
  ctx.fillStyle = THEME.fishShade;
  ctx.fill();
  ctx.strokeStyle = VINTAGE.ink;
  ctx.lineWidth = Math.max(1.5, size * 0.06);
  ctx.stroke();
  ctx.strokeStyle = THEME.fish;
  ctx.lineWidth = Math.max(1, size * 0.04);
  for (const t of [-0.35, 0, 0.35]) {
    ctx.beginPath();
    ctx.moveTo(-size * 0.08, 0);
    ctx.lineTo(-size * 0.55, size * t);
    ctx.stroke();
  }
  ctx.restore();

  // Dorsal fin on top.
  ctx.beginPath();
  ctx.moveTo(-size * 0.45, -size * 0.55);
  ctx.quadraticCurveTo(-size * 0.1, -size * 1.05, size * 0.25, -size * 0.62);
  ctx.closePath();
  ctx.fillStyle = THEME.fishShade;
  ctx.fill();

  // Body, with an ink outline like an old cartoon.
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.72, 0, 0, Math.PI * 2);
  ctx.fillStyle = THEME.fish;
  ctx.fill();
  ctx.strokeStyle = VINTAGE.ink;
  ctx.lineWidth = Math.max(1.5, size * 0.06);
  ctx.stroke();

  // A few scale arcs.
  ctx.strokeStyle = THEME.fishShade;
  ctx.lineWidth = Math.max(1, size * 0.035);
  for (const [sx, sy] of [[-0.35, -0.1], [-0.15, 0.15], [-0.5, 0.2], [-0.25, -0.35]]) {
    ctx.beginPath();
    ctx.arc(size * sx, size * sy, size * 0.12, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  // Side fin.
  ctx.beginPath();
  ctx.ellipse(-size * 0.05, size * 0.38, size * 0.3, size * 0.14, 0.5 + wiggle, 0, Math.PI * 2);
  ctx.fillStyle = THEME.fishShade;
  ctx.fill();

  // Damage that builds up with each bonk (cartoon only).
  if (hurt >= 1) {
    // A band-aid on the side.
    ctx.save();
    ctx.translate(-size * 0.3, size * 0.05);
    for (const rot of [0.6, -0.6]) {
      ctx.save();
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.roundRect(-size * 0.22, -size * 0.07, size * 0.44, size * 0.14, size * 0.07);
      ctx.fillStyle = THEME.bandAid;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // Cheek blush.
  ctx.beginPath();
  ctx.ellipse(size * 0.55, size * 0.12, size * 0.13, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = THEME.blush;
  ctx.fill();

  // Bright red lips, puckered at the front.
  ctx.fillStyle = THEME.lips;
  ctx.beginPath();
  ctx.ellipse(size * 0.98, -size * 0.1, size * 0.17, size * 0.11, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.98, size * 0.1, size * 0.17, size * 0.11, -0.35, 0, Math.PI * 2);
  ctx.fill();

  // Eye with lashes, or a dizzy spiral.
  const ex = size * 0.45;
  const ey = -size * 0.22;
  if (dizzy) {
    ctx.beginPath();
    for (let t = 0; t < 4 * Math.PI; t += 0.3) {
      const rr = (size * 0.16 * t) / (4 * Math.PI);
      const px = ex + Math.cos(t + now * 6) * rr;
      const py = ey + Math.sin(t + now * 6) * rr;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = VINTAGE.background;
    ctx.lineWidth = Math.max(1.5, size * 0.06);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(ex, ey, size * 0.17, 0, Math.PI * 2);
    ctx.fillStyle = VINTAGE.text;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + size * 0.04, ey, size * 0.11, 0, Math.PI * 2);
    ctx.fillStyle = VINTAGE.background;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + size * 0.07, ey - size * 0.04, size * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = VINTAGE.text;
    ctx.fill();
    if (hurt >= 2) {
      // A droopy lid over the top half of the eye.
      ctx.beginPath();
      ctx.arc(ex, ey, size * 0.18, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = THEME.fishShade;
      ctx.fill();
    }
    ctx.strokeStyle = THEME.lashes;
    ctx.lineWidth = Math.max(1, size * 0.04);
    const lashRise = hurt >= 2 ? 0.02 : 0;
    for (const t of [-0.6, -0.15, 0.3]) {
      ctx.beginPath();
      ctx.moveTo(ex + Math.sin(t) * size * 0.17, ey - Math.cos(t) * size * (0.17 + lashRise));
      ctx.lineTo(ex + Math.sin(t) * size * 0.28, ey - Math.cos(t) * size * (0.28 + lashRise));
      ctx.stroke();
    }
  }

  // A sweat drop once it's been hit.
  if (hurt >= 1) {
    const dx = size * 0.85;
    const dy = -size * 0.7;
    ctx.beginPath();
    ctx.moveTo(dx, dy - size * 0.16);
    ctx.quadraticCurveTo(dx + size * 0.11, dy, dx, dy + size * 0.06);
    ctx.quadraticCurveTo(dx - size * 0.11, dy, dx, dy - size * 0.16);
    ctx.fillStyle = THEME.sweat;
    ctx.fill();
  }

  // White flash right after a bonk.
  if (flash > 0) {
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.72, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,248,230,${0.6 * flash})`;
    ctx.fill();
  }

  // Bumps on the head, one per bonk.
  for (let i = 0; i < Math.min(bonks, MAX_CRACKS); i++) {
    ctx.beginPath();
    ctx.arc(size * (0.05 - i * 0.28), -size * 0.66, size * 0.13, Math.PI, 0);
    ctx.fillStyle = THEME.fishBump;
    ctx.fill();
  }

  // The flower, tucked behind the eye; it loses petals as the fish gets bonked.
  drawFlower(ctx, size * 0.05, -size * 0.6, size * 0.3, flower.petal, flower.centre, 5 - hurt);
  ctx.restore();

  // Stars circling the head: one at two bonks, three when dizzy.
  const stars = dizzy ? 3 : hurt >= 2 ? 1 : 0;
  if (stars > 0) {
    for (let i = 0; i < stars; i++) {
      const a = now * 3 + (i * Math.PI * 2) / 3;
      drawStar(ctx, x + Math.cos(a) * size * 1.2, y - size * 0.9 + Math.sin(a) * size * 0.35, size * 0.16);
    }
  }
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  petal: string,
  centre: string,
  petals = 5,
): void {
  ctx.fillStyle = petal;
  for (let i = 0; i < Math.max(2, petals); i++) {
    const a = (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, s * 0.42, s * 0.28, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y, s * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = centre;
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? s : s * 0.45;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = VINTAGE.text;
  ctx.fill();
}

/** Name pills drawn this frame, so later ones can step aside instead of overlapping. */
const placedLabels: { x: number; y: number; w: number; h: number }[] = [];

/** A viewer's name in a dark pill, so it stays legible over anything. */
function drawName(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  angle: number,
  dist: number,
  name: string,
  px: number,
  /** Pixels to the side of the ball's path, so the label doesn't hide the ball. */
  side = 0,
): void {
  // Labels stay inside the rim, so they never cover the score or the bubbles.
  const [sx, sy] = polar(l, angle, Math.min(dist, 0.86));
  const x = sx - Math.sin(angle) * side;
  let y = sy + Math.cos(angle) * side;
  const text = shortName(name);
  ctx.font = font(px, 600);
  const w = ctx.measureText(text).width + 10;
  const h = px + 6;
  // Step towards the centre of the barrel until this pill clears the ones already drawn.
  const step = (y > l.cy ? -1 : 1) * (h + 2);
  const hits = (yy: number) =>
    placedLabels.some((p) => Math.abs(p.x - x) < (p.w + w) / 2 && Math.abs(p.y - yy) < (p.h + h) / 2);
  for (let i = 0; i < 4 && hits(y); i++) y += step;
  placedLabels.push({ x, y, w, h });
  ctx.fillStyle = 'rgba(23,17,13,0.85)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = VINTAGE.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
}

function drawHud(ctx: CanvasRenderingContext2D, l: Layout, game: Game, o: RenderOptions): void {
  const { cx, cy, r, column } = l;
  const top = cy - r - r * 0.07;
  const bottom = cy + r + r * 0.07;
  const unit = column / 100;
  const raiders = topRaiders(game, 1);
  const raiderCount = Object.keys(game.raiders).length;
  const rowY = top - Math.max(12, unit * 4);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Top row: time left, score, multiplier.
  ctx.fillStyle = VINTAGE.text;
  ctx.font = font(Math.min(unit * 14, (top - 8) * 0.6));
  ctx.fillText(String(game.score), cx, rowY);
  if (game.phase === 'playing') {
    ctx.fillStyle = VINTAGE.textSecondary;
    ctx.font = font(unit * 6);
    ctx.fillText(formatTime(timeLeft(game)), cx - column * 0.36, rowY);
  }
  const mult = multiplier(game.combo);
  if (game.phase === 'playing' && mult > 1) {
    ctx.fillStyle = VINTAGE.mint;
    ctx.font = font(unit * 6);
    ctx.fillText(`x${mult}`, cx + column * 0.36, rowY);
  }

  // Bubbles below the barrel: one pops per bonk.
  const bubble = unit * 3.2;
  const gap = bubble * 3.2;
  const bubbleY = bottom + Math.max(20, unit * 8);
  for (let i = 0; i < MAX_CRACKS; i++) {
    const x = cx + (i - (MAX_CRACKS - 1) / 2) * gap;
    const popped = i >= MAX_CRACKS - game.cracks;
    ctx.beginPath();
    ctx.arc(x, bubbleY, bubble, 0, Math.PI * 2);
    if (popped) {
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = VINTAGE.border;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = 'rgba(140,199,168,0.25)';
      ctx.fill();
      ctx.strokeStyle = VINTAGE.mint;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - bubble * 0.35, bubbleY - bubble * 0.35, bubble * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = VINTAGE.text;
      ctx.fill();
    }
  }

  if (game.phase === 'playing') {
    const lineY = bottom + Math.max(48, unit * 17);
    if (isOverdrive(game)) {
      ctx.fillStyle = VINTAGE.live;
      ctx.font = font(unit * 5.5);
      ctx.fillText('FRENZY!', cx, lineY);
    }
    if (raiderCount > 0) {
      ctx.fillStyle = VINTAGE.textSecondary;
      ctx.font = font(unit * 4, 500);
      const lead = raiders[0];
      const leader = lead && lead.cracks > 0 ? ` · top: ${shortName(lead.by)} (${lead.cracks})` : '';
      ctx.fillText(`${raiderCount} throwing${leader}`, cx, lineY + unit * 7, column * 0.92);
    }
    return;
  }

  // Title and result cards, across the middle of the barrel.
  ctx.fillStyle = 'rgba(23,17,13,0.85)';
  ctx.fillRect(0, cy - r * 0.62, l.width, r * 1.24);
  ctx.textBaseline = 'middle';
  if (game.phase === 'ready') {
    ctx.fillStyle = VINTAGE.text;
    ctx.font = font(unit * 12);
    ctx.fillText('RINGWARD', cx, cy - r * 0.3, column * 0.92);
    ctx.fillStyle = VINTAGE.mint;
    ctx.font = font(unit * 4.6, 600);
    ctx.fillText('~ fish in a barrel ~', cx, cy - r * 0.1, column * 0.92);
    ctx.strokeStyle = VINTAGE.textSecondary;
    ctx.lineWidth = 1;
    for (const dy of [-0.56, -0.53, 0.53, 0.56]) {
      ctx.beginPath();
      ctx.moveTo(cx - column * 0.42, cy + r * dy);
      ctx.lineTo(cx + column * 0.42, cy + r * dy);
      ctx.stroke();
    }
    ctx.fillStyle = VINTAGE.textSecondary;
    ctx.font = font(unit * 4.6, 500);
    ctx.fillText(isDuo(game) ? 'Keep both fish safe for 2:00' : 'Keep your fish safe for 2:00', cx, cy + r * 0.08, column * 0.92);
    ctx.fillText(isDuo(game) ? 'P1: mouse or A/D · P2: ← / →' : 'Mouse or A/D to swing the shield', cx, cy + r * 0.24, column * 0.92);
    ctx.fillText('Click or Space to start', cx, cy + r * 0.4, column * 0.92);
  } else {
    const won = game.phase === 'won';
    const viewersWon = !won && game.coreBreaker !== null;
    ctx.fillStyle = won ? VINTAGE.mint : VINTAGE.live;
    ctx.font = font(unit * 11);
    ctx.fillText(won ? 'STILL SWIMMING' : viewersWon ? 'VIEWERS WIN' : 'DIZZY!', cx, cy - r * 0.32, column * 0.92);
    ctx.fillStyle = VINTAGE.text;
    ctx.font = font(unit * 5.2, 500);
    const detail = viewersWon
      ? `Final bonk by ${shortName(game.coreBreaker ?? '')}`
      : `Score ${game.score} · lasted ${formatTime(game.elapsed)}`;
    ctx.fillText(detail, cx, cy - r * 0.02, column * 0.92);
    ctx.fillStyle = VINTAGE.textSecondary;
    ctx.font = font(unit * 4.4, 500);
    const stats = raiderCount > 0
      ? `${game.blocks} blocked · ${raiderCount} throwers · score ${game.score}`
      : `${game.perfects} perfect · ${game.blocks} blocks · best ${o.best}`;
    ctx.fillText(stats, cx, cy + r * 0.18, column * 0.92);
    ctx.fillText('Click or Space to play again', cx, cy + r * 0.38, column * 0.92);
  }
  if (o.autopilot) {
    ctx.fillStyle = VINTAGE.textSecondary;
    ctx.font = font(unit * 3.4, 500);
    ctx.fillText('AUTOPILOT', cx, bottom + Math.max(48, unit * 17));
  }
}

/** Press G: shows the 9:16 column that survives a vertical crop of a 16:9 capture. */
function drawGuides(ctx: CanvasRenderingContext2D, l: Layout): void {
  const left = l.cx - l.column / 2;
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = VINTAGE.mint;
  ctx.lineWidth = 2;
  ctx.strokeRect(left + 1, 1, l.column - 2, l.height - 2);
  ctx.setLineDash([]);
  ctx.fillStyle = VINTAGE.mint;
  ctx.font = font(14, 500);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('9:16 crop', left + 8, 8);
  ctx.restore();
}
