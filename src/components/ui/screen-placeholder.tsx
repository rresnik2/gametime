import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/tokens';

import { AppText } from './app-text';

export type ScreenPlaceholderProps = {
  title: string;
  description: string;
  /** Which roadmap phase builds this screen. */
  phase: string;
  children?: ReactNode;
};

/** Temporary screen body until the real screen lands in its phase. */
export function ScreenPlaceholder({ title, description, phase, children }: ScreenPlaceholderProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <AppText variant="display" accessibilityRole="header">
          {title}
        </AppText>
        <AppText color="textSecondary">{description}</AppText>
        <AppText variant="caption" color="mint">
          Built in {phase}
        </AppText>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.xl, gap: spacing.md, justifyContent: 'center' },
});
