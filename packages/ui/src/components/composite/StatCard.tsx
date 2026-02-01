import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, typography } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../primitives/Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    positive?: boolean;
  };
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function StatCard({ title, value, change, icon, style }: StatCardProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  return (
    <Card variant="default" padding="md" style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.textMuted }]}>
          {title}
        </Text>
        {icon && <View style={styles.icon}>{icon}</View>}
      </View>

      <Text style={[styles.value, { color: themeColors.text }]}>{value}</Text>

      {change && (
        <View style={styles.changeContainer}>
          <Text
            style={[
              styles.changeValue,
              { color: change.positive ? colors.status.done : colors.status.urgent },
            ]}
          >
            {change.positive ? '↑' : '↓'} {change.value}
          </Text>
        </View>
      )}
    </Card>
  );
}

// Streak card variant
export interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
  style?: StyleProp<ViewStyle>;
}

export function StreakCard({ currentStreak, bestStreak, style }: StreakCardProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  return (
    <Card variant="default" padding="md" style={[styles.streakContainer, style]}>
      <View style={styles.streakContent}>
        <Text style={styles.fireEmoji}>🔥</Text>
        <View style={styles.streakInfo}>
          <Text style={[styles.streakValue, { color: themeColors.text }]}>
            {currentStreak} day streak
          </Text>
          <Text style={[styles.streakBest, { color: themeColors.textMuted }]}>
            Best: {bestStreak} days
          </Text>
        </View>
      </View>
    </Card>
  );
}

// Focus score card variant
export interface FocusScoreCardProps {
  score: number; // 0-100
  style?: StyleProp<ViewStyle>;
}

export function FocusScoreCard({ score, style }: FocusScoreCardProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const getScoreColor = () => {
    if (score >= 80) return colors.status.done;
    if (score >= 60) return colors.taskType.focus;
    if (score >= 40) return colors.priority.medium;
    return colors.status.urgent;
  };

  return (
    <Card variant="default" padding="md" style={[styles.focusContainer, style]}>
      <View style={styles.focusHeader}>
        <Text style={[styles.focusTitle, { color: themeColors.text }]}>
          Focus Score
        </Text>
        <Text style={[styles.focusScore, { color: getScoreColor() }]}>
          {score}
        </Text>
      </View>

      <View style={[styles.focusBar, { backgroundColor: themeColors.input }]}>
        <View
          style={[
            styles.focusFill,
            { width: `${score}%`, backgroundColor: getScoreColor() },
          ]}
        />
      </View>
    </Card>
  );
}

// Category breakdown card
export interface CategoryBreakdownProps {
  categories: Array<{
    name: string;
    hours: number;
    percent: number;
    color?: string;
  }>;
  style?: StyleProp<ViewStyle>;
}

export function CategoryBreakdown({ categories, style }: CategoryBreakdownProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const categoryColors = [
    colors.indigo[500],
    colors.purple[500],
    colors.taskType.github,
    colors.taskType.focus,
  ];

  return (
    <Card variant="default" padding="md" style={style}>
      <Text style={[styles.categoryTitle, { color: themeColors.text }]}>
        Time by Category
      </Text>

      {categories.map((category, index) => (
        <View key={category.name} style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: category.color || categoryColors[index % categoryColors.length] },
              ]}
            />
            <Text style={[styles.categoryName, { color: themeColors.text }]}>
              {category.name}
            </Text>
          </View>

          <View style={styles.categoryBarContainer}>
            <View
              style={[styles.categoryBar, { backgroundColor: themeColors.input }]}
            >
              <View
                style={[
                  styles.categoryFill,
                  {
                    width: `${category.percent}%`,
                    backgroundColor:
                      category.color || categoryColors[index % categoryColors.length],
                  },
                ]}
              />
            </View>
            <Text style={[styles.categoryPercent, { color: themeColors.textMuted }]}>
              {category.percent}%
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  icon: {
    opacity: 0.6,
  },
  value: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  changeContainer: {
    marginTop: spacing[1],
  },
  changeValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },

  // Streak styles
  streakContainer: {},
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireEmoji: {
    fontSize: 32,
    marginRight: spacing[3],
  },
  streakInfo: {},
  streakValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  streakBest: {
    fontSize: typography.sizes.sm,
    marginTop: spacing[0.5],
  },

  // Focus score styles
  focusContainer: {},
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  focusTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  focusScore: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  focusBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  focusFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Category breakdown styles
  categoryTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[4],
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  categoryName: {
    fontSize: typography.sizes.sm,
  },
  categoryBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  categoryBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: spacing[2],
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercent: {
    fontSize: typography.sizes.sm,
    width: 36,
    textAlign: 'right',
  },
});
