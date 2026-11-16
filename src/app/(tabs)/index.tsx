import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { GameChip } from '@/components/ui/game-chip';
import { LivePill } from '@/components/ui/live-pill';
import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';

type FeedMode = 'following' | 'for-you';

/**
 * Live (home) tab. For now this shows one static stream card to exercise the design system.
 * Phase 2 replaces it with the snap-scroll feed and real video playback.
 */
export default function LiveScreen() {
  const [mode, setMode] = useState<FeedMode>('for-you');

  return (
    <View style={styles.root}>
      {/* Stand-in for the full-bleed video. */}
      <View style={styles.video}>
        <Ionicons name="game-controller-outline" size={64} color={colors.border} />
        <AppText color="textSecondary">Live video plays here (Phase 2)</AppText>
      </View>

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <View style={styles.topRow}>
          <LivePill viewerCount={1243} />
          <View style={styles.toggle} accessibilityRole="tablist">
            {(['following', 'for-you'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === m }}
                style={styles.toggleItem}>
                <AppText variant="bodyStrong" color={mode === m ? 'text' : 'textSecondary'}>
                  {m === 'following' ? 'Following' : 'For You'}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.bottom} pointerEvents="box-none">
          <View style={styles.meta}>
            <View style={styles.streamer}>
              <Avatar username="pixelpilot" size={36} />
              <AppText variant="bodyStrong">pixelpilot</AppText>
            </View>
            <AppText>Ranked grind to Diamond, come hang</AppText>
            <GameChip name="Sample Game" color="#2EF2C3" />
          </View>

          <View style={styles.rail}>
            <RailButton icon="person-add-outline" label="Follow" />
            <RailButton icon="heart-outline" label="React" />
            <RailButton icon="share-outline" label="Share" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function RailButton({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={styles.railButton}>
      <Ionicons name={icon} size={28} color={colors.text} />
      <AppText variant="caption">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  video: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  overlay: { flex: 1, justifyContent: 'space-between', padding: spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.scrim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
  },
  toggleItem: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.lg },
  meta: { flex: 1, gap: spacing.sm },
  streamer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rail: { gap: spacing.lg, alignItems: 'center' },
  railButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
});
