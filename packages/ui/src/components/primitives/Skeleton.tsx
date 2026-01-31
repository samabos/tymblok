import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, duration } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: DimensionValue;
  height?: DimensionValue;
  style?: ViewStyle;
  animate?: boolean;
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  style,
  animate = true,
}: SkeletonProps) {
  const { isDark, theme } = useTheme();
  const themeColors = theme.colors;
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true
      );
    }
  }, [animate]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!animate) return {};

    const backgroundColor = interpolateColor(
      shimmer.value,
      [0, 0.5, 1],
      isDark
        ? [colors.dark.input, colors.dark.cardHover, colors.dark.input]
        : [colors.light.input, colors.light.border, colors.light.input]
    );

    return { backgroundColor };
  });

  const variantStyles = getVariantStyles(variant, width, height);
  const baseColor = isDark ? colors.dark.input : colors.light.input;

  return (
    <Animated.View
      style={[
        styles.base,
        { backgroundColor: baseColor },
        variantStyles,
        animate && animatedStyle,
        style,
      ]}
    />
  );
}

function getVariantStyles(
  variant: SkeletonVariant,
  width?: DimensionValue,
  height?: DimensionValue
): ViewStyle {
  const variants = {
    text: {
      width: width || '100%',
      height: height || 14,
      borderRadius: borderRadius.sm,
    },
    circular: {
      width: width || 40,
      height: height || 40,
      borderRadius: typeof width === 'number' ? width / 2 : 20,
    },
    rectangular: {
      width: width || '100%',
      height: height || 48,
      borderRadius: borderRadius.md,
    },
    card: {
      width: width || '100%',
      height: height || 80,
      borderRadius: borderRadius.xl,
    },
  };

  return variants[variant];
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

// Convenience components for common skeleton patterns
export function SkeletonText({
  lines = 1,
  lineHeight = 14,
  spacing: lineSpacing = spacing[2],
  lastLineWidth = '60%',
  style,
}: {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: DimensionValue;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height={lineHeight}
          width={index === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
          style={index > 0 ? { marginTop: lineSpacing } : undefined}
        />
      ))}
    </View>
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: isDark ? colors.dark.card : colors.light.card,
          borderRadius: borderRadius.xl,
          padding: spacing[4],
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }}>
        <Skeleton variant="circular" width={40} height={40} />
        <View style={{ marginLeft: spacing[3], flex: 1 }}>
          <Skeleton variant="text" width="70%" height={16} />
          <Skeleton variant="text" width="40%" height={12} style={{ marginTop: spacing[1] }} />
        </View>
      </View>
      <SkeletonText lines={2} />
    </View>
  );
}
