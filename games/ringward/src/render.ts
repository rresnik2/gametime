/** Draws a Game onto a canvas. Greybox: flat shapes in GameTime's palette, no assets. */
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

/** Player 1 is GameTime purple; player 2 (duo) is white, so the two never blur together. */
const SHIELD_COLORS = [
  { body: palette.primary, perfect: '#B9A8FF' },
  { body: '#E8E8F0', perfect: palette.text },
];

const DISPLAY_FONT = '"Space Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif';

export interface Layout {
  width: number;
  height: number;
  cx: number;
  cy: number;
  /** Arena radius in CSS pixels. */
  r: number;
  /** Width of the centred 9:16 column that survives a vertical crop. */
  column: number;
}

export function computeLayout(width: number, height: number): Layout {
  const column = Math.min(width, (height * 9) / 16);
  const r = Math.min(column * 0.46, height * 0.34);
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
  const recentCrack = game.events.find((e) => e.kind === 'crack' && e.age < 0.25);
  const labelPx = Math.max(11, l.column * 0.032);

  ctx.save();
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, l.width, l.height);

  if (overdrive) {
    const pulse = 0.08 + 0.06 * Math.sin(o.now * 8);
    const g = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, Math.max(l.width, l.height) * 0.7);
    g.addColorStop(0, 'rgba(255,59,92,0)');
    g.addColorStop(1, `rgba(255,59,92,${pulse})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l.width, l.height);
  }

  if (recentCrack) {
    const shake = r * 0.03 * (1 - recentCrack.age / 0.25);
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  // Arena disc and rim.
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = palette.surface;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.015);
  ctx.strokeStyle = overdrive ? palette.live : palette.border;
  ctx.stroke();

  // Raid slots: ticks on the rim that match the slot ring in the app's raid panel.
  for (let i = 0; i < RAID_SLOTS; i++) {
    const [x1, y1] = polar(l, slotAngle(i), 0.93);
    const [x2, y2] = polar(l, slotAngle(i), 1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = Math.max(2, r * 0.012);
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Shield track.
  ctx.beginPath();
  ctx.arc(cx, cy, SHIELD_R * r, 0, Math.PI * 2);
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = Math.max(1, r * 0.006);
  ctx.stroke();

  // Warnings and shards.
  for (const s of game.shards) {
    if (s.state === 'warning') {
      const t = Math.max(0, 1 - s.warning / WARNING_SECONDS);
      const [x, y] = polar(l, s.angle, 1);
      ctx.beginPath();
      ctx.arc(x, y, r * (0.04 + 0.05 * t), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,59,92,${0.25 + 0.6 * t})`;
      ctx.fill();
      if (s.by) drawName(ctx, l, s.angle, 0.84, s.by, labelPx);
      continue;
    }
    const [x, y] = polar(l, s.angle, s.dist);
    const deflected = s.state === 'deflected';
    // Trail.
    const [tx, ty] = polar(l, s.angle, deflected ? s.dist - 0.18 : s.dist + 0.18);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(x, y);
    ctx.strokeStyle = deflected ? 'rgba(161,161,181,0.35)' : 'rgba(255,59,92,0.45)';
    ctx.lineWidth = SHARD_R * r * 1.2;
    ctx.lineCap = 'round';
    ctx.stroke();
    // Body: a diamond pointing at the core.
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.angle);
    const k = SHARD_R * r;
    ctx.beginPath();
    ctx.moveTo(-k * 1.6, 0);
    ctx.lineTo(0, -k);
    ctx.lineTo(k * 1.2, 0);
    ctx.lineTo(0, k);
    ctx.closePath();
    ctx.fillStyle = deflected ? palette.textSecondary : palette.live;
    ctx.fill();
    ctx.restore();
    if (s.by && !deflected) drawName(ctx, l, s.angle, s.dist, s.by, labelPx, SHARD_R * r * 2.6);
  }

  // Shields: thick arcs, with the perfect zone brighter.
  game.shields.forEach((a, i) => {
    const color = SHIELD_COLORS[i] ?? SHIELD_COLORS[0];
    ctx.lineCap = 'round';
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

  // Core: dims with each crack, with a crack line per hit.
  const health = 1 - game.cracks / MAX_CRACKS;
  ctx.beginPath();
  ctx.arc(cx, cy, CORE_R * r, 0, Math.PI * 2);
  ctx.fillStyle = game.phase === 'lost' ? palette.border : palette.mint;
  ctx.globalAlpha = 0.35 + 0.65 * health;
  ctx.fill();
  ctx.globalAlpha = 1;
  for (let i = 0; i < game.cracks; i++) {
    const ang = -Math.PI / 2 + i * ((Math.PI * 2) / MAX_CRACKS) + 0.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const [mx, my] = polar(l, ang + 0.25, CORE_R * 0.5);
    const [ex, ey] = polar(l, ang, CORE_R);
    ctx.lineTo(mx, my);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = palette.background;
    ctx.lineWidth = Math.max(2, r * 0.018);
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Timer inside the core.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = palette.background;
  ctx.font = font(CORE_R * r * 0.62);
  if (game.phase === 'playing') ctx.fillText(formatTime(timeLeft(game)), cx, cy);

  // Hit popups.
  for (const e of game.events) {
    const t = e.age / 1.2;
    const [x, y] = polar(l, e.angle, SHIELD_R + 0.12 + t * 0.15);
    ctx.globalAlpha = 1 - t;
    if (e.kind === 'crack') {
      ctx.fillStyle = palette.live;
      ctx.font = font(r * 0.11);
      ctx.fillText('CRACK', x, y);
    } else {
      ctx.fillStyle = e.kind === 'perfect' ? palette.mint : palette.text;
      ctx.font = font(r * (e.kind === 'perfect' ? 0.12 : 0.09));
      ctx.fillText(`+${e.points}`, x, y);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  drawHud(ctx, l, game, o);
  if (o.showGuides) drawGuides(ctx, l);
}

/** A viewer's name in a dark pill, so it stays legible over anything. */
function drawName(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  angle: number,
  dist: number,
  name: string,
  px: number,
  /** Pixels to the side of the shard's path, so the label doesn't hide the shard. */
  side = 0,
): void {
  // Labels stay inside the rim, so they never cover the score or crack pips.
  const [sx, sy] = polar(l, angle, Math.min(dist, 0.88));
  const x = sx - Math.sin(angle) * side;
  const y = sy + Math.cos(angle) * side;
  const text = shortName(name);
  ctx.font = font(px, 600);
  const w = ctx.measureText(text).width + 10;
  const h = px + 6;
  ctx.fillStyle = 'rgba(11,11,18,0.8)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = palette.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
}

function drawHud(ctx: CanvasRenderingContext2D, l: Layout, game: Game, o: RenderOptions): void {
  const { cx, cy, r, column } = l;
  const top = cy - r;
  const bottom = cy + r;
  const unit = column / 100;
  const raiders = topRaiders(game, 1);
  const raiderCount = Object.keys(game.raiders).length;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Score above the arena.
  ctx.fillStyle = palette.text;
  ctx.font = font(Math.min(unit * 14, (top - 8) * 0.6));
  ctx.fillText(String(game.score), cx, top - Math.max(12, unit * 4));

  const mult = multiplier(game.combo);
  if (game.phase === 'playing' && mult > 1) {
    ctx.fillStyle = palette.mint;
    ctx.font = font(unit * 6);
    ctx.fillText(`x${mult}`, cx + column * 0.36, top - Math.max(12, unit * 4));
  }

  // Cracks left, below the arena.
  const pip = unit * 3.2;
  const gap = pip * 3.2;
  const pipY = bottom + Math.max(20, unit * 8);
  for (let i = 0; i < MAX_CRACKS; i++) {
    const x = cx + (i - (MAX_CRACKS - 1) / 2) * gap;
    ctx.beginPath();
    ctx.arc(x, pipY, pip, 0, Math.PI * 2);
    const broken = i >= MAX_CRACKS - game.cracks;
    ctx.fillStyle = broken ? palette.border : palette.mint;
    ctx.fill();
  }

  if (game.phase === 'playing') {
    const lineY = bottom + Math.max(48, unit * 17);
    if (isOverdrive(game)) {
      ctx.fillStyle = palette.live;
      ctx.font = font(unit * 5.5);
      ctx.fillText('OVERDRIVE', cx, lineY);
    }
    if (raiderCount > 0) {
      ctx.fillStyle = palette.textSecondary;
      ctx.font = font(unit * 4, 500);
      const lead = raiders[0];
      const leader = lead && lead.cracks > 0 ? ` · top: ${shortName(lead.by)} (${lead.cracks})` : '';
      ctx.fillText(`${raiderCount} raiding${leader}`, cx, lineY + unit * 7);
    }
    return;
  }

  // Title and result cards, centred on the core.
  ctx.fillStyle = 'rgba(11,11,18,0.78)';
  ctx.fillRect(0, cy - r * 0.62, l.width, r * 1.24);
  ctx.textBaseline = 'middle';
  if (game.phase === 'ready') {
    ctx.fillStyle = palette.text;
    ctx.font = font(unit * 12);
    ctx.fillText('RINGWARD', cx, cy - r * 0.25);
    ctx.fillStyle = palette.textSecondary;
    ctx.font = font(unit * 4.6, 500);
    ctx.fillText('Keep the core alive for 2:00', cx, cy + r * 0.02);
    ctx.fillText(isDuo(game) ? 'P1: mouse or A/D · P2: ← / →' : 'Mouse or A/D to turn the shield', cx, cy + r * 0.2);
    ctx.fillText('Click or Space to start', cx, cy + r * 0.38);
  } else {
    const won = game.phase === 'won';
    const viewersWon = !won && game.coreBreaker !== null;
    ctx.fillStyle = won ? palette.mint : palette.live;
    ctx.font = font(unit * 11);
    ctx.fillText(won ? 'CORE HELD' : viewersWon ? 'VIEWERS WIN' : 'CORE LOST', cx, cy - r * 0.32);
    ctx.fillStyle = palette.text;
    ctx.font = font(unit * 5.2, 500);
    const detail = viewersWon
      ? `Core broken by ${shortName(game.coreBreaker ?? '')}`
      : `Score ${game.score} · survived ${formatTime(game.elapsed)}`;
    ctx.fillText(detail, cx, cy - r * 0.02);
    ctx.fillStyle = palette.textSecondary;
    ctx.font = font(unit * 4.4, 500);
    const stats = raiderCount > 0
      ? `${game.blocks} blocked from ${raiderCount} raiders · score ${game.score}`
      : `${game.perfects} perfect · ${game.blocks} blocks · best ${o.best}`;
    ctx.fillText(stats, cx, cy + r * 0.18);
    ctx.fillText('Click or Space to play again', cx, cy + r * 0.38);
  }
  if (o.autopilot) {
    ctx.fillStyle = palette.textSecondary;
    ctx.font = font(unit * 3.4, 500);
    ctx.fillText('AUTOPILOT', cx, bottom + Math.max(48, unit * 17));
  }
}

/** Press G: shows the 9:16 column that survives a vertical crop of a 16:9 capture. */
function drawGuides(ctx: CanvasRenderingContext2D, l: Layout): void {
  const left = l.cx - l.column / 2;
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = palette.mint;
  ctx.lineWidth = 2;
  ctx.strokeRect(left + 1, 1, l.column - 2, l.height - 2);
  ctx.setLineDash([]);
  ctx.fillStyle = palette.mint;
  ctx.font = font(14, 500);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('9:16 crop', left + 8, 8);
  ctx.restore();
}
