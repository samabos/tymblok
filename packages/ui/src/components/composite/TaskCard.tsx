import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, layout, springConfig, duration } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type TaskType = 'github' | 'jira' | 'meeting' | 'focus' | 'manual';

export interface TaskCardData {
  id: string;
  title: string;
  subtitle?: string;
  type: TaskType;
  time: string;
  endTime?: string;
  durationMinutes?: number;
  completed?: boolean;
  urgent?: boolean;
  isNow?: boolean;
  progress?: number;
  elapsed?: string;
}

export interface TaskCardProps {
  task: TaskCardData;
  onPress?: () => void;
  onExpand?: () => void;
  onComplete?: () => void;
  onPause?: () => void;
  dragging?: boolean;
  style?: ViewStyle;
}

export function TaskCard({
  task,
  onPress,
  onExpand,
  onComplete,
  onPause,
  dragging = false,
  style,
}: TaskCardProps) {
  const { isDark, theme } = useTheme();
  const themeColors = theme.colors;
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const typeColor = getTypeColor(task.type);
  const durationText = formatDuration(task.durationMinutes);

  const handlePress = () => {
    setExpanded(!expanded);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig.snappy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dragging ? 1.02 : scale.value }],
    opacity: dragging ? 0.7 : opacity.value,
  }));

  const cardBorderStyle = task.isNow
    ? { borderColor: colors.indigo[500], borderWidth: 2 }
    : { borderColor: themeColors.border, borderWidth: 1 };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: task.completed
            ? isDark
              ? 'rgba(15, 23, 42, 0.5)'
              : 'rgba(248, 250, 252, 0.5)'
            : themeColors.card,
        },
        cardBorderStyle,
        task.completed && styles.completed,
        animatedStyle,
        style,
      ]}
      entering={FadeIn.duration(300)}
      layout={Layout.springify()}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: typeColor }]} />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.timeContainer}>
            <Text
              style={[
                styles.time,
                { color: themeColors.text },
                task.completed && styles.completedText,
              ]}
            >
              {task.time}
            </Text>
            {durationText && (
              <Text
                style={[
                  styles.duration,
                  { color: themeColors.textFaint },
                  task.completed && styles.completedText,
                ]}
              >
                {durationText}
              </Text>
            )}
          </View>

          <View style={styles.badges}>
            <Badge
              variant={task.type as any}
              size="sm"
              label={getTypeLabel(task.type)}
            />
            {task.urgent && (
              <Badge
                variant="urgent"
                size="sm"
                label="Urgent"
                style={{ marginLeft: spacing[1] }}
              />
            )}
            {task.isNow && (
              <Badge
                variant="live"
                size="sm"
                label="Live"
                pulse
                style={{ marginLeft: spacing[1] }}
              />
            )}
          </View>
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            { color: themeColors.text },
            task.completed && styles.completedText,
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {/* Subtitle */}
        {task.subtitle && (
          <Text
            style={[
              styles.subtitle,
              { color: themeColors.textMuted },
              task.completed && styles.completedText,
            ]}
            numberOfLines={1}
          >
            {task.subtitle}
          </Text>
        )}

        {/* Expanded content */}
        {expanded && !task.completed && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.expandedContent}
          >
            {task.elapsed && (
              <View style={styles.elapsedContainer}>
                <Text style={[styles.elapsedLabel, { color: themeColors.textMuted }]}>
                  Elapsed
                </Text>
                <Text style={[styles.elapsedTime, { color: themeColors.text }]}>
                  {task.elapsed}
                </Text>
              </View>
            )}

            {task.progress !== undefined && (
              <View style={styles.progressContainer}>
                <View
                  style={[styles.progressBar, { backgroundColor: themeColors.input }]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${task.progress}%`,
                        backgroundColor: colors.indigo[500],
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: themeColors.textMuted }]}>
                  {task.progress}%
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              {onPause && (
                <Button variant="secondary" size="sm" onPress={onPause}>
                  {task.isNow ? 'Pause' : 'Start'}
                </Button>
              )}
              {onComplete && (
                <Button
                  variant="primary"
                  size="sm"
                  onPress={onComplete}
                  style={{ marginLeft: spacing[2] }}
                >
                  Complete
                </Button>
              )}
            </View>
          </Animated.View>
        )}

        {/* Completed checkmark */}
        {task.completed && (
          <View style={styles.checkmark}>
            <View
              style={[styles.checkCircle, { backgroundColor: colors.status.done }]}
            >
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          </View>
        )}
      </View>

      {/* Expand button */}
      {onExpand && !task.completed && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onExpand();
          }}
          style={styles.expandButton}
          hitSlop={8}
        >
          <Text style={[styles.expandIcon, { color: themeColors.textFaint }]}>
            ⤢
          </Text>
        </Pressable>
      )}
    </AnimatedPressable>
  );
}

function getTypeColor(type: TaskType): string {
  const typeColors: Record<TaskType, string> = {
    github: colors.taskType.github,
    jira: colors.taskType.jira,
    meeting: colors.taskType.meeting,
    focus: colors.taskType.focus,
    manual: colors.indigo[500],
  };
  return typeColors[type] || colors.indigo[500];
}

function getTypeLabel(type: TaskType): string {
  const labels: Record<TaskType, string> = {
    github: 'GitHub',
    jira: 'Jira',
    meeting: 'Meeting',
    focus: 'Focus',
    manual: 'Task',
  };
  return labels[type] || 'Task';
}

function formatDuration(minutes?: number): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: layout.taskCardBorderRadius,
    overflow: 'hidden',
    minHeight: layout.taskCardMinHeight,
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  time: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.mono,
  },
  duration: {
    fontSize: typography.sizes.xs,
    marginLeft: spacing[2],
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    lineHeight: typography.sizes.base * 1.4,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  completed: {
    opacity: 0.6,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  expandedContent: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  elapsedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  elapsedLabel: {
    fontSize: typography.sizes.sm,
    marginRight: spacing[2],
  },
  elapsedTime: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.mono,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: spacing[2],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.sizes.sm,
    width: 40,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  checkmark: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: colors.white,
    fontSize: 14,
    fontWeight: typography.weights.bold,
  },
  expandButton: {
    position: 'absolute',
    right: spacing[3],
    top: spacing[3],
    padding: spacing[1],
  },
  expandIcon: {
    fontSize: 16,
  },
});
