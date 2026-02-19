import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  PressableProps,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, layout, typography, springConfig } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  hapticFeedback?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  style,
  textStyle,
  hapticFeedback = true,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: ButtonProps) {
  const { isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.96, springConfig.snappy);
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, springConfig.snappy);
    onPressOut?.(e);
  };

  const handlePress = (e: any) => {
    if (hapticFeedback && !disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  const isDisabled = disabled || loading;

  const variantStyles = getVariantStyles(variant, isDark, isDisabled);
  const sizeStyles = getSizeStyles(size);

  return (
    <AnimatedPressable
      {...props}
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyles.textColor}
          size={size === 'sm' ? 'small' : 'small'}
        />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text
            style={[
              styles.text,
              { color: variantStyles.textColor },
              sizeStyles.text,
              leftIcon ? styles.textWithLeftIcon : undefined,
              rightIcon ? styles.textWithRightIcon : undefined,
              textStyle,
            ]}
          >
            {children}
          </Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </AnimatedPressable>
  );
}

function getVariantStyles(variant: ButtonVariant, isDark: boolean, disabled: boolean) {
  const themeColors = isDark ? colors.dark : colors.light;

  const variants = {
    primary: {
      container: {
        backgroundColor: disabled ? colors.indigo[600] + '80' : colors.indigo[600],
        shadowColor: colors.indigo[600],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: disabled ? 0 : 0.25,
        shadowRadius: 8,
        elevation: disabled ? 0 : 4,
      } as ViewStyle,
      textColor: colors.white,
    },
    secondary: {
      container: {
        backgroundColor: themeColors.input,
        borderWidth: 1,
        borderColor: themeColors.border,
      } as ViewStyle,
      textColor: themeColors.text,
    },
    danger: {
      container: {
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
      } as ViewStyle,
      textColor: colors.status.urgent,
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
      } as ViewStyle,
      textColor: themeColors.textMuted,
    },
  };

  return variants[variant];
}

function getSizeStyles(size: ButtonSize) {
  const sizes = {
    sm: {
      container: {
        height: layout.buttonHeightSmall,
        paddingHorizontal: spacing[4],
        borderRadius: borderRadius.lg,
      } as ViewStyle,
      text: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
      } as TextStyle,
    },
    md: {
      container: {
        height: layout.buttonHeight,
        paddingHorizontal: spacing[6],
        borderRadius: layout.buttonBorderRadius,
      } as ViewStyle,
      text: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.semibold,
      } as TextStyle,
    },
    lg: {
      container: {
        height: layout.buttonHeightLarge,
        paddingHorizontal: spacing[8],
        borderRadius: layout.buttonBorderRadius,
      } as ViewStyle,
      text: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.semibold,
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
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    textAlign: 'center',
  },
  textWithLeftIcon: {
    marginLeft: spacing[2],
  },
  textWithRightIcon: {
    marginRight: spacing[2],
  },
});
