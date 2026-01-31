/**
 * Tymblok Design System - Animations
 * Duration, easing, and keyframe definitions for React Native Reanimated
 */

// Animation durations (in milliseconds)
export const duration = {
  instant: 0,
  fast: 100,
  normal: 200,
  slow: 300,
  slower: 400,
  slowest: 500,
} as const;

// Easing functions (compatible with Reanimated)
// These are cubic-bezier control points
export const easing = {
  linear: [0, 0, 1, 1] as const,
  ease: [0.25, 0.1, 0.25, 1] as const,
  easeIn: [0.42, 0, 1, 1] as const,
  easeOut: [0, 0, 0.58, 1] as const,
  easeInOut: [0.42, 0, 0.58, 1] as const,
  // Custom easings
  spring: [0.175, 0.885, 0.32, 1.275] as const, // Overshoot
  bounce: [0.68, -0.55, 0.265, 1.55] as const, // Bounce effect
} as const;

// Spring configuration for Reanimated
export const springConfig = {
  // Default spring
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  // Bouncy spring (for button press)
  bouncy: {
    damping: 10,
    stiffness: 180,
    mass: 1,
  },
  // Gentle spring (for modals)
  gentle: {
    damping: 20,
    stiffness: 120,
    mass: 1,
  },
  // Snappy spring (for toggles)
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  // Slow spring (for large movements)
  slow: {
    damping: 25,
    stiffness: 80,
    mass: 1.5,
  },
} as const;

// Pre-defined animation presets
export const animationPresets = {
  // Button press feedback
  buttonPress: {
    duration: duration.fast,
    scale: 0.95,
  },

  // Card press feedback
  cardPress: {
    duration: duration.fast,
    scale: 0.98,
  },

  // Fade in/out
  fade: {
    duration: duration.normal,
  },

  // Slide up (for bottom sheets)
  slideUp: {
    duration: duration.slow,
  },

  // Scale in (for modals)
  scaleIn: {
    duration: duration.normal,
    initialScale: 0.95,
  },

  // Float animation (for logo)
  float: {
    duration: 4000, // 4 seconds
    translateY: -10,
  },

  // Pulse animation (for live badge)
  pulse: {
    duration: 2000, // 2 seconds
    minOpacity: 0.5,
    maxOpacity: 1,
  },

  // Progress shimmer
  shimmer: {
    duration: 2000,
  },

  // Task card entry
  cardEntry: {
    duration: duration.slow,
    initialTranslateY: 8,
    initialOpacity: 0,
  },

  // Drag feedback
  drag: {
    scale: 1.02,
    opacity: 0.5,
  },
} as const;

// Keyframe definitions (for reference, actual implementation in components)
export const keyframes = {
  // Float animation (logo)
  float: {
    '0%': { transform: [{ translateY: 0 }] },
    '50%': { transform: [{ translateY: -10 }] },
    '100%': { transform: [{ translateY: 0 }] },
  },

  // Pulse animation (live badge)
  pulse: {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.5 },
    '100%': { opacity: 1 },
  },

  // Slide up (bottom sheet)
  slideUp: {
    from: { transform: [{ translateY: '100%' }] },
    to: { transform: [{ translateY: 0 }] },
  },

  // Scale in (modal)
  scaleIn: {
    from: { transform: [{ scale: 0.95 }], opacity: 0 },
    to: { transform: [{ scale: 1 }], opacity: 1 },
  },

  // Fade slide in (task card)
  fadeSlideIn: {
    from: { transform: [{ translateY: 8 }], opacity: 0 },
    to: { transform: [{ translateY: 0 }], opacity: 1 },
  },

  // Shake (error feedback)
  shake: {
    '0%': { transform: [{ translateX: 0 }] },
    '25%': { transform: [{ translateX: -5 }] },
    '50%': { transform: [{ translateX: 5 }] },
    '75%': { transform: [{ translateX: -5 }] },
    '100%': { transform: [{ translateX: 0 }] },
  },
} as const;

// Type exports
export type Duration = typeof duration;
export type Easing = typeof easing;
export type SpringConfig = typeof springConfig;
export type AnimationPresets = typeof animationPresets;
export type DurationKey = keyof typeof duration;
export type EasingKey = keyof typeof easing;
export type SpringConfigKey = keyof typeof springConfig;
