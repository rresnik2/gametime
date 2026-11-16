import { Pressable, StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme/tokens';

import { AppText } from './app-text';

export type GameChipProps = {
  name: string;
  /** The game's color from the `games` table. */
  color: string;
  onPress?: () => void;
};

/** Rounded chip tinted with the game's color. */
export function GameChip({ name, color, onPress }: GameChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`Game: ${name}`}
      style={[styles.chip, { borderColor: color, backgroundColor: `${color}33` }]}>
      <AppText variant="caption" color="text">
        {name}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
