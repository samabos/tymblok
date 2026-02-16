import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, ViewStyle } from 'react-native';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type TaskType = 'github' | 'jira' | 'meeting' | 'focus' | 'manual';
export type TimerStatus = 'NotStarted' | 'Running' | 'Paused' | 'Completed';

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
  timerState?: TimerStatus;
  elapsedSeconds?: number;
  isRecurring?: boolean;
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
  onPause?: () => void;
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
  onPause,
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

  const timerState: TimerStatus = task.timerState || 'NotStarted';

  // Accent bar: blue when live, muted when completed, task color otherwise
  const typeColor = task.completed
    ? themeColors.textFaint
    : task.isNow
      ? colors.indigo[500]
      : `${getTypeColor(task.type)}80`; // 50% opacity for scheduled

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

  const cardBorderStyle = { borderWidth: 0 };

  const cardShadowStyle = isDark ? {} : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: task.isNow ? 0.12 : 0.08,
    shadowRadius: task.isNow ? 16 : 12,
    elevation: task.isNow ? 6 : 3,
  };

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
          backgroundColor: task.isNow && isDark
            ? 'rgba(99, 102, 241, 0.12)'
            : themeColors.card,
          opacity: task.isNow ? 1 : task.completed ? 0.6 : 1,
        },
        cardBorderStyle,
        cardShadowStyle,
        task.completed && styles.completed,
        animatedStyle,
        style,
      ]}
      entering={FadeIn.duration(300)}
      layout={Layout.springify()}
    >

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.time,
              {
                color: task.completed
                  ? themeColors.textFaint
                  : themeColors.textMuted,
              },
              task.completed && styles.completedText,
            ]}
            accessibilityLabel={`Time: ${task.time}`}
          >
            {task.time}
          </Text>

          <View style={styles.headerRight}>
            {!task.completed && task.urgent && (
              <Badge
                variant="urgent"
                size="sm"
                label="Urgent"
              />
            )}

            {/* Start/Pause button */}
            {!task.completed && timerState !== 'Running' && onStart && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onStart();
                }}
                activeOpacity={0.7}
                style={[styles.timerButton, { backgroundColor: colors.indigo[500] }]}
                accessibilityLabel="Start task"
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="play" size={14} color={colors.white} />
              </TouchableOpacity>
            )}
            {!task.completed && timerState === 'Running' && (
              <View style={styles.runningTimerRow}>
                <Text
                  style={[
                    styles.inlineTimer,
                    { color: colors.indigo[500], fontFamily: typography.fonts.mono },
                  ]}
                >
                  {formatElapsed(task.elapsedSeconds || 0)}
                </Text>
                {onPause && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onPause();
                    }}
                    activeOpacity={0.7}
                    style={[styles.timerButton, { backgroundColor: colors.label.focus }]}
                    accessibilityLabel="Pause task"
                    accessibilityRole="button"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="pause" size={14} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {task.isRecurring && (
            <Ionicons
              name="repeat-outline"
              size={14}
              color={task.completed
                ? themeColors.textFaint
                : task.isNow
                  ? themeColors.textMuted
                  : themeColors.textMuted}
              accessibilityLabel="Recurring task"
            />
          )}
          <Text
            style={[
              styles.title,
              {
                color: task.completed
                  ? themeColors.textMuted
                  : task.isNow
                    ? themeColors.text
                    : themeColors.text,
                flex: 1,
              },
              task.completed && styles.completedText,
            ]}
            numberOfLines={2}
            accessibilityRole="header"
          >
            {task.title}
          </Text>
        </View>

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
                    : themeColors.textMuted,
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
            <View style={styles.actions}>
              {/* Left side - expand/more button */}
              <View style={styles.actionsLeft}>
                {!task.completed && onExpand && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onExpand();
                    }}
                    activeOpacity={0.7}
                    style={[styles.circleButton, { backgroundColor: isDark ? themeColors.input : themeColors.bgSubtle }]}
                    accessibilityLabel="Open task details"
                    accessibilityRole="button"
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Ionicons name="expand-outline" size={16} color={themeColors.text} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Right side - complete/undo buttons */}
              <View style={styles.actionsRight}>
                {!task.completed && onComplete && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onComplete();
                    }}
                    activeOpacity={0.7}
                    style={[styles.circleButton, { backgroundColor: colors.indigo[500] }]}
                    accessibilityLabel="Mark task as complete"
                    accessibilityRole="button"
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  </TouchableOpacity>
                )}
                {task.completed && onUndoComplete && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onUndoComplete();
                    }}
                    activeOpacity={0.7}
                    style={[styles.circleButton, { backgroundColor: isDark ? themeColors.input : themeColors.bgSubtle }]}
                    accessibilityLabel="Undo completion"
                    accessibilityRole="button"
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Ionicons name="arrow-undo" size={16} color={themeColors.text} />
                  </TouchableOpacity>
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

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
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
  time: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.mono,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  timerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runningTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  inlineTimer: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
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
    // opacity handled at container level
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  expandedContent: {
    marginTop: spacing[4],
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
