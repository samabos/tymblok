import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, layout, springConfig, getLabelColor } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../primitives/Badge';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);


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

  // Light: shadow elevation, no border. Dark: subtle border.
  const cardShadowStyle = isDark ? {} : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
          borderWidth: isDark ? 1 : 0,
        },
        cardShadowStyle,
        animatedStyle,
        style,
      ]}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: themeColors.text }]}
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

        {/* Actions */}
        {(onAdd || onDismiss) && (
          <View style={styles.actions}>
            {onDismiss && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onDismiss();
                }}
                activeOpacity={0.7}
                style={[
                  styles.actionButton,
                  { backgroundColor: isDark ? themeColors.input : themeColors.bgSubtle },
                ]}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={[styles.actionIcon, { color: themeColors.textMuted }]}>
                  ×
                </Text>
              </TouchableOpacity>
            )}
            {onAdd && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onAdd();
                }}
                activeOpacity={0.7}
                style={[styles.actionButton, { backgroundColor: colors.indigo[500] }]}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={styles.actionIcon}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </AnimatedTouchable>
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
    borderRadius: layout.taskCardBorderRadius,
    overflow: 'hidden',
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
