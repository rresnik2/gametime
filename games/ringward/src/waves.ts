/** The fixed wave table from docs/game/design.md. Tune here, not with procedural generation. */
export interface Wave {
  /** Seconds into the round when this wave starts. */
  from: number;
  /** Seconds between spawns. */
  interval: number;
  /** Seconds a shard takes from the rim to the core. */
  travel: number;
  /** Chance that a spawn is a pair from two directions. */
  pairChance: number;
  overdrive: boolean;
}

export const WAVES: readonly Wave[] = [
  { from: 0, interval: 1.4, travel: 1.6, pairChance: 0, overdrive: false },
  { from: 20, interval: 1.0, travel: 1.35, pairChance: 0.15, overdrive: false },
  { from: 60, interval: 0.75, travel: 1.1, pairChance: 0.3, overdrive: false },
  { from: 100, interval: 0.5, travel: 0.85, pairChance: 0.4, overdrive: true },
];

export function waveAt(elapsed: number): Wave {
  let current = WAVES[0];
  for (const wave of WAVES) {
    if (elapsed >= wave.from) current = wave;
  }
  return current;
}
