import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, springConfig } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { Toggle } from '../primitives/Toggle';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type SettingsRowVariant = 'navigation' | 'toggle' | 'value' | 'action';

export interface SettingsRowProps {
  variant?: SettingsRowVariant;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  toggled?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
  style?: ViewStyle;
}

export function SettingsRow({
  variant = 'navigation',
  icon,
  title,
  subtitle,
  value,
  toggled,
  onToggle,
  onPress,
  danger = false,
  disabled = false,
  showArrow = true,
  style,
}: SettingsRowProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (variant !== 'toggle' && !disabled) {
      scale.value = withSpring(0.98, springConfig.snappy);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig.snappy);
  };

  const handlePress = () => {
    if (disabled) return;
    if (variant === 'toggle' && onToggle !== undefined && toggled !== undefined) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle(!toggled);
    } else if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textColor = danger
    ? colors.status.urgent
    : disabled
      ? themeColors.textFaint
      : themeColors.text;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled && variant !== 'toggle'}
      style={[styles.container, animatedStyle, style]}
    >
      {icon && (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: danger ? 'rgba(239, 68, 68, 0.1)' : themeColors.input },
          ]}
        >
          {icon}
        </View>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{subtitle}</Text>
        )}
      </View>

      {/* Right side content */}
      {variant === 'toggle' && toggled !== undefined && onToggle && (
        <Toggle enabled={toggled} onChange={onToggle} disabled={disabled} />
      )}

      {variant === 'value' && value && (
        <Text style={[styles.value, { color: themeColors.textMuted }]}>{value}</Text>
      )}

      {variant === 'navigation' && showArrow && (
        <Text style={[styles.arrow, { color: themeColors.textFaint }]}>›</Text>
      )}
    </AnimatedPressable>
  );
}

// Settings section header
export function SettingsSection({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  return (
    <View style={[styles.section, style]}>
      <Text style={[styles.sectionTitle, { color: themeColors.textFaint }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: themeColors.card }]}>{children}</View>
    </View>
  );
}

// Settings group (for multiple rows)
export function SettingsGroup({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  return (
    <View
      style={[
        styles.group,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        },
        style,
      ]}
    >
      {React.Children.map(children, (child, index) => (
        <>
          {child}
          {index < React.Children.count(children) - 1 && (
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
          )}
        </>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    minHeight: 48,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    marginTop: spacing[0.5],
  },
  value: {
    fontSize: typography.sizes.base,
    marginLeft: spacing[2],
  },
  arrow: {
    fontSize: 20,
    marginLeft: spacing[2],
  },

  // Section styles
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
    marginLeft: spacing[4],
  },
  sectionContent: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },

  // Group styles
  group: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginLeft: spacing[4] + 36 + spacing[3], // icon container + margin
  },
});
