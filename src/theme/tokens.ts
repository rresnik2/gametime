/**
 * GameTime design tokens, from the product plan's "Theming & UI design" section.
 * The app is dark-only for the MVP; a light theme (#F7F7FB background) is a v2 item.
 */

export const colors = {
  background: '#0B0B12',
  surface: '#16161F',
  surfaceRaised: '#20202C',
  border: '#2A2A38',
  primary: '#7C5CFF',
  live: '#FF3B5C',
  mint: '#2EF2C3',
  text: '#FFFFFF',
  textSecondary: '#A1A1B5',
  scrim: 'rgba(11, 11, 18, 0.72)',
} as const;

export type ColorToken = keyof typeof colors;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

/** Font family names registered in src/app/_layout.tsx. */
export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: fonts.displayMedium, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 },
  /** Large, heavy numerals for viewer counts. */
  stat: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 16 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Minimum touch target, per the plan's accessibility section. */
export const minTouchTarget = 44;

/** Width at which tabs become a left sidebar (web and tablet). */
export const sidebarBreakpoint = 768;
