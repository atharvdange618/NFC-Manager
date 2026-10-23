// Ported from Shikai's constants/theme.ts so both apps share one look.
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',

  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export const FontSize = {
  display: 30,
  heading: 22,
  title: 17,
  body: 15,
  label: 13,
  caption: 11,
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const TextStyles = {
  display: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.display,
    lineHeight: FontSize.display * LineHeight.tight,
  },
  heading: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.heading,
    lineHeight: FontSize.heading * LineHeight.tight,
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.title,
    lineHeight: FontSize.title * LineHeight.tight,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    lineHeight: FontSize.body * LineHeight.normal,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    lineHeight: FontSize.body * LineHeight.normal,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    lineHeight: FontSize.label * LineHeight.normal,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    lineHeight: FontSize.caption * LineHeight.normal,
  },
  mono: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.label,
    lineHeight: FontSize.label * LineHeight.normal,
  },
  monoCaption: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.caption,
    lineHeight: FontSize.caption * LineHeight.normal,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const BorderWidth = {
  thin: 0.5,
  normal: 1,
  thick: 1.5,
} as const;

export const Layout = {
  screenPadding: Spacing.lg,
} as const;
