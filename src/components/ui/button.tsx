import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';

import { AppText } from './app-text';

type ButtonVariant = 'primary' | 'live' | 'secondary';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
};

const backgrounds: Record<ButtonVariant, string> = {
  primary: colors.primary,
  live: colors.live,
  secondary: colors.surfaceRaised,
};

export function Button({ label, variant = 'primary', disabled, style, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={(state) => [
        styles.base,
        { backgroundColor: backgrounds[variant] },
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <AppText variant="bodyStrong">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
});
