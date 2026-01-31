/**
 * Tymblok Design System - Spacing
 * Spacing scale, border radius, and layout constants
 */

// Base spacing unit (4px)
const BASE_UNIT = 4;

export const spacing = {
  0: 0,
  0.5: BASE_UNIT * 0.5, // 2
  1: BASE_UNIT * 1, // 4
  1.5: BASE_UNIT * 1.5, // 6
  2: BASE_UNIT * 2, // 8
  2.5: BASE_UNIT * 2.5, // 10
  3: BASE_UNIT * 3, // 12
  3.5: BASE_UNIT * 3.5, // 14
  4: BASE_UNIT * 4, // 16
  5: BASE_UNIT * 5, // 20
  6: BASE_UNIT * 6, // 24
  7: BASE_UNIT * 7, // 28
  8: BASE_UNIT * 8, // 32
  9: BASE_UNIT * 9, // 36
  10: BASE_UNIT * 10, // 40
  11: BASE_UNIT * 11, // 44
  12: BASE_UNIT * 12, // 48
  14: BASE_UNIT * 14, // 56
  16: BASE_UNIT * 16, // 64
  20: BASE_UNIT * 20, // 80
  24: BASE_UNIT * 24, // 96
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
} as const;

// Layout constants for the app
export const layout = {
  // Screen padding
  screenPaddingHorizontal: spacing[6], // 24
  screenPaddingVertical: spacing[4], // 16

  // Card dimensions
  cardPadding: spacing[4], // 16
  cardPaddingSmall: spacing[3], // 12
  cardGap: spacing[3], // 12

  // Header dimensions
  headerHeight: 56,
  headerPaddingHorizontal: spacing[4], // 16

  // Bottom navigation
  bottomNavHeight: 72,
  bottomNavPaddingBottom: spacing[6], // 24 (for safe area)
  bottomNavIconSize: 24,

  // Task card
  taskCardMinHeight: 80,
  taskCardBorderRadius: borderRadius.xl, // 12
  taskCardIconSize: 16,

  // Time grid
  timeGridHourHeight: 60,
  timeGridLabelWidth: 48,

  // Modal
  modalMaxWidth: 400,
  modalBorderRadius: borderRadius['2xl'], // 16

  // Input
  inputHeight: 48,
  inputHeightSmall: 40,
  inputBorderRadius: borderRadius.xl, // 12

  // Button
  buttonHeight: 48,
  buttonHeightSmall: 36,
  buttonHeightLarge: 56,
  buttonBorderRadius: borderRadius['2xl'], // 16
  buttonPaddingHorizontal: spacing[6], // 24

  // Avatar
  avatarSizeSm: 32,
  avatarSizeMd: 40,
  avatarSizeLg: 56,
  avatarSizeXl: 80,

  // Badge
  badgeHeight: 24,
  badgeHeightSmall: 20,
  badgeBorderRadius: borderRadius.full, // 9999
  badgePaddingHorizontal: spacing[2], // 8

  // Toggle
  toggleWidth: 48,
  toggleHeight: 28,
  toggleKnobSize: 24,
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  card: 10,
  dropdown: 20,
  sticky: 30,
  fixed: 40,
  modalBackdrop: 50,
  modal: 60,
  popover: 70,
  tooltip: 80,
  toast: 90,
  max: 100,
} as const;

// Shadow definitions
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  // Colored shadows for buttons
  primary: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  danger: {
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// Type exports
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Layout = typeof layout;
export type ZIndex = typeof zIndex;
export type Shadows = typeof shadows;
export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
