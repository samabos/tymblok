/**
 * Tymblok Design System - Typography
 * Font families, sizes, weights, and line heights
 */

export const typography = {
  // Font Families
  fonts: {
    sans: 'Inter', // UI text
    mono: 'JetBrains Mono', // Times, code
    // Fallbacks for React Native
    sansFallback: 'System',
    monoFallback: 'Courier',
  },

  // Font Sizes (in pixels/points)
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 30,
    '5xl': 36,
  },

  // Font Weights
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line Heights (multipliers)
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },
} as const;

// Pre-defined text styles for common use cases
export const textStyles = {
  // Headings
  h1: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.tight,
  },
  h2: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.tight,
  },
  h3: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.snug,
  },
  h4: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.snug,
  },

  // Body text
  bodyLarge: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.normal,
    lineHeight: typography.lineHeights.relaxed,
  },
  body: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.normal,
    lineHeight: typography.lineHeights.normal,
  },
  bodySmall: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.normal,
    lineHeight: typography.lineHeights.normal,
  },

  // Labels and captions
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.normal,
  },
  caption: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.normal,
    lineHeight: typography.lineHeights.normal,
  },

  // Buttons
  buttonLarge: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.none,
  },
  button: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.none,
  },
  buttonSmall: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.none,
  },

  // Monospace
  code: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.normal,
    lineHeight: typography.lineHeights.normal,
    fontFamily: typography.fonts.mono,
  },
  time: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.none,
    fontFamily: typography.fonts.mono,
  },
} as const;

// Type exports
export type Typography = typeof typography;
export type TextStyles = typeof textStyles;
export type FontSize = keyof typeof typography.sizes;
export type FontWeight = keyof typeof typography.weights;
