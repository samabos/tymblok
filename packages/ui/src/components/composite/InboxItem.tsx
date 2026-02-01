import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, springConfig, getLabelColor } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../primitives/Badge';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type InboxSource =
  | 'google-drive'
  | 'jira'
  | 'calendar'
  | 'github'
  | 'slack'
  | 'manual';
export type InboxItemType = 'task' | 'update' | 'reminder';
export type InboxPriority = 'high' | 'normal';

export interface InboxItemData {
  id: string;
  title: string;
  source: InboxSource;
  time: string;
  type: InboxItemType;
  priority?: InboxPriority;
  description?: string;
}

export interface InboxItemProps {
  item: InboxItemData;
  onAdd?: () => void;
  onDismiss?: () => void;
  onPress?: () => void;
  style?: ViewStyle;
}

export function InboxItem({
  item,
  onAdd,
  onDismiss,
  onPress,
  style,
}: InboxItemProps) {
  const { isDark, theme } = useTheme();
  const themeColors = theme.colors;
  const scale = useSharedValue(1);

  // Mute the accent color for a softer appearance
  const sourceColor = `${getSourceColor(item.source)}80`; // 50% opacity
  const sourceLabel = getSourceLabel(item.source);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig.snappy);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? 'rgba(15, 23, 42, 0.5)'
            : 'rgba(248, 250, 252, 0.6)',
          borderColor: themeColors.border,
          opacity: 0.75,
        },
        animatedStyle,
        style,
      ]}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
    >
      {/* Source indicator */}
      <View style={[styles.sourceIndicator, { backgroundColor: sourceColor }]} />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: themeColors.textMuted }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.priority === 'high' && (
            <Badge variant="urgent" size="sm" label="High" />
          )}
        </View>

        <View style={styles.meta}>
          <Text style={[styles.source, { color: themeColors.textFaint }]}>
            {sourceLabel}
          </Text>
          <Text style={[styles.separator, { color: themeColors.textFaint }]}>
            ·
          </Text>
          <Text style={[styles.time, { color: themeColors.textFaint }]}>
            {item.time}
          </Text>
        </View>

        {item.description && (
          <Text
            style={[styles.description, { color: themeColors.textFaint }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {onAdd && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAdd();
            }}
            style={[styles.actionButton, { backgroundColor: colors.indigo[600] }]}
            hitSlop={4}
          >
            <Text style={styles.actionIcon}>+</Text>
          </Pressable>
        )}
        {onDismiss && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDismiss();
            }}
            style={[
              styles.actionButton,
              { backgroundColor: themeColors.input, marginTop: spacing[1] },
            ]}
            hitSlop={4}
          >
            <Text style={[styles.actionIcon, { color: themeColors.textMuted }]}>
              ×
            </Text>
          </Pressable>
        )}
      </View>
    </AnimatedPressable>
  );
}

function getSourceColor(source: InboxSource): string {
  // Use centralized getLabelColor for consistency across all components
  return getLabelColor(source);
}

function getSourceLabel(source: InboxSource): string {
  const labels: Record<InboxSource, string> = {
    'google-drive': 'Google Drive',
    jira: 'Jira',
    calendar: 'Calendar',
    github: 'GitHub',
    slack: 'Slack',
    manual: 'Manual',
  };
  return labels[source] || 'Unknown';
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sourceIndicator: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginRight: spacing[2],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  source: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  separator: {
    marginHorizontal: spacing[1],
  },
  time: {
    fontSize: typography.sizes.sm,
  },
  description: {
    fontSize: typography.sizes.sm,
    marginTop: spacing[2],
    lineHeight: typography.sizes.sm * 1.4,
  },
  actions: {
    padding: spacing[3],
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    color: colors.white,
    fontSize: 18,
    fontWeight: typography.weights.bold,
    lineHeight: 20,
  },
});
