/**
 * Tymblok Design System
 * Export all theme tokens and utilities
 */

// Colors
export { colors, getLabelColor } from './colors';
export type {
  Colors,
  ThemeColors,
  LabelColor,
  StatusColor,
  PriorityColor,
  // Deprecated - use LabelColor instead
  TaskTypeColor,
  SourceColor,
} from './colors';

// Typography
export { typography, textStyles } from './typography';
export type { Typography, TextStyles, FontSize, FontWeight } from './typography';

// Spacing
export { spacing, borderRadius, layout, zIndex, shadows } from './spacing';
export type {
  Spacing,
  BorderRadius,
  Layout,
  ZIndex,
  Shadows,
  SpacingKey,
  BorderRadiusKey,
} from './spacing';

// Animations
export { duration, easing, springConfig, animationPresets, keyframes } from './animations';
export type {
  Duration,
  Easing,
  SpringConfig,
  AnimationPresets,
  DurationKey,
  EasingKey,
  SpringConfigKey,
} from './animations';

// Theme type definition
export interface Theme {
  isDark: boolean;
  colors: {
    bg: string;
    bgSubtle: string;
    card: string;
    cardHover: string;
    border: string;
    borderSubtle: string;
    text: string;
    textMuted: string;
    textFaint: string;
    input: string;
    inputFocus: string;
    overlay: string;
  };
}

// Helper to get theme colors
import { colors as themeColors } from './colors';

export function getTheme(isDark: boolean): Theme {
  const palette = isDark ? themeColors.dark : themeColors.light;
  return {
    isDark,
    colors: palette,
  };
}
