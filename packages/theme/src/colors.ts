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

  /**
   * Unified Label Colors
   * Single source of truth for all label/category/type colors.
   * Used by TaskCard, InboxItem, Badge, and all other components.
   * Backend returns the label key, frontend maps to color here.
   */
  label: {
    github: '#10b981', // emerald-500 - code/PRs
    jira: '#3b82f6', // blue-500 - tickets
    meeting: '#a855f7', // purple-500 - calendar events
    calendar: '#a855f7', // purple-500 - alias for meeting
    focus: '#f59e0b', // amber-500 - deep work
    break: '#10b981', // emerald-500 - breaks/lunch
    slack: '#ec4899', // pink-500 - messages
    googleDrive: '#f59e0b', // amber-500 - documents
    linear: '#6366f1', // indigo-500 - issues
    notion: '#6b7280', // gray-500 - docs
    manual: '#6366f1', // indigo-500 - user-created
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

  /**
   * @deprecated Use colors.label instead for consistency
   */
  taskType: {
    github: '#10b981',
    jira: '#3b82f6',
    meeting: '#a855f7',
    focus: '#f59e0b',
    manual: '#6b7280',
  },

  /**
   * @deprecated Use colors.label instead for consistency
   */
  source: {
    googleDrive: '#f59e0b',
    jira: '#3b82f6',
    github: '#10b981', // Updated to match label.github
    calendar: '#a855f7',
    slack: '#ec4899',
    manual: '#6366f1',
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

  // Light Theme Palette (Samsung Health-inspired)
  light: {
    bg: '#f8fafc', // slate-50 (subtle gray so white cards pop)
    bgSubtle: '#f1f5f9', // slate-100 (sections/headers)
    card: '#ffffff', // pure white cards float on gray bg
    cardHover: '#f8fafc', // slate-50
    border: '#f1f5f9', // slate-100 (very subtle, prefer shadows)
    borderSubtle: '#e2e8f0', // slate-200
    text: '#0f172a', // slate-900 (strong readable text)
    textMuted: '#64748b', // slate-500 (clear secondary)
    textFaint: '#94a3b8', // slate-400 (hints/placeholders)
    input: '#ffffff', // white (shadow-based separation)
    inputFocus: '#ffffff', // white
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
export type LabelColor = keyof typeof colors.label;
export type StatusColor = keyof typeof colors.status;
export type PriorityColor = keyof typeof colors.priority;

/** @deprecated Use LabelColor instead */
export type TaskTypeColor = keyof typeof colors.taskType;
/** @deprecated Use LabelColor instead */
export type SourceColor = keyof typeof colors.source;

/**
 * Get the color for a label/category/type.
 * This is the single source of truth for label-to-color mapping.
 * @param label - The label key (e.g., 'github', 'jira', 'meeting')
 * @param fallback - Fallback color if label not found (defaults to indigo-500)
 */
export function getLabelColor(label: string, fallback = colors.indigo[500]): string {
  const normalizedLabel = label.toLowerCase().replace(/[-_\s]/g, '') as LabelColor;

  // Handle common aliases
  const aliasMap: Record<string, LabelColor> = {
    googledrive: 'googleDrive',
    'google-drive': 'googleDrive',
    pr: 'github',
    pullrequest: 'github',
    issue: 'jira',
    ticket: 'jira',
    event: 'meeting',
    call: 'meeting',
    deepwork: 'focus',
    work: 'focus',
    lunch: 'break',
    rest: 'break',
  };

  const mappedLabel = aliasMap[normalizedLabel] || normalizedLabel;
  return colors.label[mappedLabel as LabelColor] || fallback;
}
