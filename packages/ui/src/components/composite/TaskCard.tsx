import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, layout, springConfig, getLabelColor } from '@tymblok/theme';
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
}

export interface TaskCardProps {
  task: TaskCardData;
  expanded?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onExpand?: () => void;
  onComplete?: () => void;
  onUndoComplete?: () => void;
  onStart?: () => void;
  dragging?: boolean;
  style?: ViewStyle;
}

export function TaskCard({
  task,
  expanded: externalExpanded,
  onPress,
  onLongPress,
  onExpand,
  onComplete,
  onUndoComplete,
  onStart,
  dragging = false,
  style,
}: TaskCardProps) {
  const { isDark, theme } = useTheme();
  const themeColors = theme.colors;
  const [internalExpanded, setInternalExpanded] = useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Use external expanded state if provided, otherwise use internal state
  const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;

  // Mute the accent color for non-active tasks
  const typeColor = task.completed
    ? themeColors.textFaint
    : task.isNow
      ? getTypeColor(task.type)
      : `${getTypeColor(task.type)}80`; // 50% opacity for scheduled
  const durationText = formatDuration(task.durationMinutes);

  const handlePress = () => {
    if (externalExpanded === undefined) {
      setInternalExpanded(!internalExpanded);
    }
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

  const taskStatusLabel = task.completed
    ? 'Completed'
    : task.isNow
      ? 'In progress'
      : 'Scheduled';

  const handleLongPress = () => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress();
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={200}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={`${task.title}. ${taskStatusLabel}. ${task.time}${task.endTime ? ` to ${task.endTime}` : ''}`}
      accessibilityRole="button"
      accessibilityHint={expanded ? 'Tap to collapse' : 'Tap to expand. Long press to drag.'}
      accessibilityState={{ expanded }}
      style={[
        styles.container,
        {
          backgroundColor: task.completed
            ? isDark
              ? 'rgba(15, 23, 42, 0.4)'
              : 'rgba(248, 250, 252, 0.4)'
            : task.isNow
              ? isDark
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(99, 102, 241, 0.08)'
              : isDark
                ? 'rgba(15, 23, 42, 0.5)'
                : 'rgba(248, 250, 252, 0.6)',
          opacity: task.isNow ? 1 : task.completed ? 0.5 : 0.6,
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
      <View
        style={[styles.accentBar, { backgroundColor: typeColor }]}
        accessibilityElementsHidden
      />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.timeContainer} accessibilityLabel={`${durationText ? `Duration: ${durationText}` : ''}${task.time ? `, Time: ${task.time}` : ''}`}>
            {durationText && (
              <Text
                style={[
                  styles.time,
                  {
                    color: task.completed
                      ? themeColors.textFaint
                      : task.isNow
                        ? themeColors.text
                        : themeColors.textMuted,
                  },
                  task.completed && styles.completedText,
                ]}
                accessibilityElementsHidden
              >
                {durationText}
              </Text>
            )}
            {task.time && (
              <Text
                style={[
                  styles.duration,
                  { color: themeColors.textFaint },
                  task.completed && styles.completedText,
                ]}
                accessibilityElementsHidden
              >
                {task.time}
              </Text>
            )}
          </View>

          <View style={styles.badges} accessibilityRole="text">
            <View accessibilityLabel={`Type: ${getTypeLabel(task.type)}`}>
              <Badge
                variant={task.completed || !task.isNow ? 'default' : (task.type as 'github' | 'jira' | 'meeting' | 'focus')}
                size="sm"
                label={getTypeLabel(task.type)}
              />
            </View>
            {task.completed && (
              <View accessibilityLabel="Status: Done">
                <Badge
                  variant="default"
                  size="sm"
                  label="Done"
                  style={{ marginLeft: spacing[1] }}
                />
              </View>
            )}
            {!task.completed && task.urgent && (
              <View accessibilityLabel="Priority: Urgent">
                <Badge
                  variant="urgent"
                  size="sm"
                  label="Urgent"
                  style={{ marginLeft: spacing[1] }}
                />
              </View>
            )}
            {!task.completed && task.isNow && (
              <View accessibilityLabel="Status: In progress">
                <Badge
                  variant="live"
                  size="sm"
                  label="Live"
                  pulse
                  style={{ marginLeft: spacing[1] }}
                />
              </View>
            )}
          </View>
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            {
              color: task.completed
                ? themeColors.textFaint
                : task.isNow
                  ? themeColors.text
                  : themeColors.textMuted,
            },
            task.completed && styles.completedText,
          ]}
          numberOfLines={2}
          accessibilityRole="header"
        >
          {task.title}
        </Text>

        {/* Subtitle */}
        {task.subtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                color: task.completed
                  ? themeColors.textFaint
                  : task.isNow
                    ? themeColors.textMuted
                    : themeColors.textFaint,
              },
              task.completed && styles.completedText,
            ]}
            numberOfLines={1}
            accessibilityRole="text"
          >
            {task.subtitle}
          </Text>
        )}

        {/* Expanded content */}
        {expanded && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.expandedContent}
          >
            {/* Progress bar as divider */}
            <View
              style={styles.progressDivider}
              accessibilityLabel={
                !task.completed && task.isNow && task.progress !== undefined
                  ? `Progress: ${task.progress} percent${task.progress > 100 ? ', over time' : ''}`
                  : undefined
              }
              accessibilityRole={!task.completed && task.isNow ? 'progressbar' : undefined}
              accessibilityValue={
                !task.completed && task.isNow && task.progress !== undefined
                  ? { min: 0, max: 100, now: Math.min(task.progress, 100) }
                  : undefined
              }
            >
              <View
                style={[styles.progressBar, { backgroundColor: themeColors.input }]}
              >
                {!task.completed && task.isNow && task.progress !== undefined && (
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(task.progress, 100)}%`,
                        backgroundColor: task.progress > 100
                          ? colors.status.urgent
                          : task.progress > 80
                            ? colors.label.focus
                            : colors.indigo[500],
                      },
                    ]}
                  />
                )}
              </View>
              {!task.completed && task.isNow && task.progress !== undefined && (
                <Text
                  style={[
                    styles.progressText,
                    {
                      color: task.progress > 100
                        ? colors.status.urgent
                        : themeColors.textMuted,
                    },
                  ]}
                >
                  {task.progress}%
                </Text>
              )}
            </View>

            <View style={styles.actions}>
              {/* Left side - expand/more button */}
              <View style={styles.actionsLeft}>
                {!task.completed && onExpand && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onExpand();
                    }}
                    accessibilityLabel="Open task details"
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="expand-outline"
                      size={16}
                      color={themeColors.text}
                    />
                  </Button>
                )}
              </View>

              {/* Right side - start/complete/undo buttons */}
              <View style={styles.actionsRight}>
                {!task.completed && !task.isNow && onStart && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={onStart}
                    accessibilityLabel="Start task"
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="play"
                      size={16}
                      color={themeColors.text}
                    />
                  </Button>
                )}
                {!task.completed && onComplete && (
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={onComplete}
                    style={{ marginLeft: spacing[2] }}
                    accessibilityLabel="Mark task as complete"
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.white}
                    />
                  </Button>
                )}
                {task.completed && onUndoComplete && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={onUndoComplete}
                    accessibilityLabel="Undo completion"
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="arrow-undo"
                      size={16}
                      color={themeColors.text}
                    />
                  </Button>
                )}
              </View>
            </View>
          </Animated.View>
        )}

      </View>

    </AnimatedPressable>
  );
}

function getTypeColor(type: TaskType): string {
  // Use centralized getLabelColor for consistency across all components
  return getLabelColor(type);
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
    opacity: 0.5,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  expandedContent: {
    marginTop: spacing[4],
  },
  progressDivider: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
