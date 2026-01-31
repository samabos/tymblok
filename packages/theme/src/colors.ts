/**
 * Tymblok Design System - Colors
 * All color values for brand, semantic, and theme colors
 */

export const colors = {
  // Brand Colors
  indigo: {
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
  },
  purple: {
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
  },

  // Semantic - Task Types
  taskType: {
    github: '#10b981', // emerald-500
    jira: '#3b82f6', // blue-500
    meeting: '#a855f7', // purple-500
    focus: '#f59e0b', // amber-500
    manual: '#6b7280', // gray-500
  },

  // Status Colors
  status: {
    urgent: '#ef4444', // red-500
    live: '#6366f1', // indigo-500
    done: '#10b981', // emerald-500
    pending: '#f59e0b', // amber-500
  },

  // Priority Colors
  priority: {
    critical: '#ef4444', // red-500
    high: '#f97316', // orange-500
    medium: '#f59e0b', // amber-500
    low: '#22c55e', // green-500
  },

  // Source Colors (for integrations)
  source: {
    googleDrive: '#f59e0b', // Yellow/Amber
    jira: '#3b82f6', // Blue
    github: '#6b7280', // Gray (adapts to dark/light)
    calendar: '#a855f7', // Purple
    slack: '#ec4899', // Pink
    manual: '#6366f1', // Indigo
  },

  // Dark Theme Palette
  dark: {
    bg: '#020617', // slate-950
    bgSubtle: '#0f172a', // slate-900
    card: '#0f172a', // slate-900
    cardHover: '#1e293b', // slate-800
    border: '#1e293b', // slate-800
    borderSubtle: '#334155', // slate-700
    text: '#ffffff',
    textMuted: '#94a3b8', // slate-400
    textFaint: '#64748b', // slate-500
    input: '#1e293b', // slate-800
    inputFocus: '#334155', // slate-700
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  // Light Theme Palette
  light: {
    bg: '#f8fafc', // slate-50
    bgSubtle: '#f1f5f9', // slate-100
    card: '#ffffff',
    cardHover: '#f8fafc', // slate-50
    border: '#e2e8f0', // slate-200
    borderSubtle: '#cbd5e1', // slate-300
    text: '#0f172a', // slate-900
    textMuted: '#475569', // slate-600
    textFaint: '#94a3b8', // slate-400
    input: '#f1f5f9', // slate-100
    inputFocus: '#e2e8f0', // slate-200
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Common Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Gradient Presets (as string arrays for easier use)
  gradients: {
    primary: ['#6366f1', '#a855f7'], // indigo to purple
    success: ['#10b981', '#34d399'], // emerald shades
    danger: ['#ef4444', '#f87171'], // red shades
    warning: ['#f59e0b', '#fbbf24'], // amber shades
  },
} as const;

// Type exports
export type Colors = typeof colors;
export type ThemeColors = typeof colors.dark | typeof colors.light;
export type TaskTypeColor = keyof typeof colors.taskType;
export type StatusColor = keyof typeof colors.status;
export type PriorityColor = keyof typeof colors.priority;
export type SourceColor = keyof typeof colors.source;
