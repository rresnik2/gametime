import { Text, type TextProps } from 'react-native';

import { colors, typography, type ColorToken, type TypographyVariant } from '@/theme/tokens';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: ColorToken;
};

export function AppText({ variant = 'body', color = 'text', style, ...props }: AppTextProps) {
  return <Text style={[typography[variant], { color: colors[color] }, style]} {...props} />;
}
