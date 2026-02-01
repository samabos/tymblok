import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable, PressableProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows, springConfig } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type CardVariant = 'default' | 'elevated' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends Omit<PressableProps, 'style'> {
  variant?: CardVariant;
  padding?: CardPadding;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressable?: boolean;
  hapticFeedback?: boolean;
}

export function Card({
  variant = 'default',
  padding = 'md',
  children,
  style,
  pressable = false,
  hapticFeedback = true,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: CardProps) {
  const { isDark, theme } = useTheme();
  const scale = useSharedValue(1);

  const themeColors = theme.colors;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    if (pressable) {
      scale.value = withSpring(0.98, springConfig.snappy);
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (pressable) {
      scale.value = withSpring(1, springConfig.snappy);
    }
    onPressOut?.(e);
  };

  const handlePress = (e: any) => {
    if (pressable && hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  const variantStyles = getVariantStyles(variant, isDark, themeColors);
  const paddingStyle = getPaddingStyle(padding);

  if (pressable) {
    return (
      <AnimatedPressable
        {...props}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.base, variantStyles, paddingStyle, animatedStyle, style]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={[styles.base, variantStyles, paddingStyle, style]}>{children}</View>
  );
}

function getVariantStyles(
  variant: CardVariant,
  isDark: boolean,
  themeColors: any
): ViewStyle {
  const variants = {
    default: {
      backgroundColor: themeColors.card,
    },
    elevated: {
      backgroundColor: themeColors.card,
      ...shadows.lg,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
  };

  return variants[variant];
}

function getPaddingStyle(padding: CardPadding): ViewStyle {
  const paddings = {
    none: { padding: 0 },
    sm: { padding: spacing[3] },
    md: { padding: spacing[4] },
    lg: { padding: spacing[6] },
  };

  return paddings[padding];
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
});
