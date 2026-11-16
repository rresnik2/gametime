import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { colors, radius, spacing } from '@/theme/tokens';

import { AppText } from './app-text';

export function formatViewerCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(count);
}

export type LivePillProps = {
  viewerCount?: number;
};

/** Pulsing LIVE badge with an optional viewer count, shown top-left on stream cards. */
export function LivePill({ viewerCount }: LivePillProps) {
  const reducedMotion = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reducedMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reducedMotion]);

  const label =
    viewerCount === undefined ? 'Live' : `Live, ${formatViewerCount(viewerCount)} watching`;

  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <View style={styles.live}>
        <Animated.View style={[styles.dot, { opacity: pulse }]} />
        <AppText variant="stat">LIVE</AppText>
      </View>
      {viewerCount !== undefined && (
        <View style={styles.count}>
          <AppText variant="stat">{formatViewerCount(viewerCount)}</AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.live,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.text },
  count: {
    backgroundColor: colors.scrim,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
});
