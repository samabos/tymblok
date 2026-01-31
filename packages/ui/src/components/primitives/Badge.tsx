import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, layout, typography, duration } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

export type BadgeVariant =
  | 'github'
  | 'jira'
  | 'meeting'
  | 'focus'
  | 'urgent'
  | 'live'
  | 'done'
  | 'default';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: React.ReactNode;
  label?: string;
  dot?: boolean;
  pulse?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  label,
  dot = false,
  pulse = false,
  style,
  textStyle,
}: BadgeProps) {
  const { isDark, theme } = useTheme();
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (pulse) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      opacity.value = 1;
    }
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const variantStyles = getVariantStyles(variant, isDark);
  const sizeStyles = getSizeStyles(size, dot);

  const content = label || children;

  if (dot) {
    return (
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: variantStyles.backgroundColor },
          sizeStyles.container,
          pulse && animatedStyle,
          style,
        ]}
      />
    );
  }

  return (
    <Animated.View
      style={[
        styles.base,
        {
          backgroundColor: variantStyles.backgroundColor,
        },
        sizeStyles.container,
        pulse && animatedStyle,
        style,
      ]}
    >
      {variantStyles.dotColor && (
        <View style={[styles.badgeDot, { backgroundColor: variantStyles.dotColor }]} />
      )}
      {content && (
        <Text
          style={[
            styles.text,
            { color: variantStyles.textColor },
            sizeStyles.text,
            variantStyles.dotColor && styles.textWithDot,
            textStyle,
          ]}
          numberOfLines={1}
        >
          {content}
        </Text>
      )}
    </Animated.View>
  );
}

function getVariantStyles(variant: BadgeVariant, isDark: boolean) {
  const variants = {
    github: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      textColor: colors.taskType.github,
      dotColor: colors.taskType.github,
    },
    jira: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
      textColor: colors.taskType.jira,
      dotColor: colors.taskType.jira,
    },
    meeting: {
      backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.1)',
      textColor: colors.taskType.meeting,
      dotColor: colors.taskType.meeting,
    },
    focus: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
      textColor: colors.taskType.focus,
      dotColor: colors.taskType.focus,
    },
    urgent: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      textColor: colors.status.urgent,
      dotColor: colors.status.urgent,
    },
    live: {
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
      textColor: colors.status.live,
      dotColor: colors.status.live,
    },
    done: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      textColor: colors.status.done,
      dotColor: colors.status.done,
    },
    default: {
      backgroundColor: isDark ? colors.dark.input : colors.light.input,
      textColor: isDark ? colors.dark.textMuted : colors.light.textMuted,
      dotColor: null,
    },
  };

  return variants[variant];
}

function getSizeStyles(size: BadgeSize, dot: boolean) {
  if (dot) {
    return {
      container: {
        width: size === 'sm' ? 6 : 8,
        height: size === 'sm' ? 6 : 8,
      } as ViewStyle,
      text: {} as TextStyle,
    };
  }

  const sizes = {
    sm: {
      container: {
        height: layout.badgeHeightSmall,
        paddingHorizontal: spacing[1.5],
        borderRadius: borderRadius.full,
      } as ViewStyle,
      text: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.medium,
      } as TextStyle,
    },
    md: {
      container: {
        height: layout.badgeHeight,
        paddingHorizontal: spacing[2],
        borderRadius: borderRadius.full,
      } as ViewStyle,
      text: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
      } as TextStyle,
    },
  };

  return sizes[size];
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: borderRadius.full,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing[1],
  },
  text: {
    textAlign: 'center',
  },
  textWithDot: {
    marginLeft: 0,
  },
});
