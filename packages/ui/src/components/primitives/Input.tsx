import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  TextInputProps,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, spacing, layout, typography, duration } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

const AnimatedView = Animated.createAnimatedComponent(View);

export type InputType = 'text' | 'email' | 'password' | 'time' | 'number';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  type?: InputType;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      type = 'text',
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      inputStyle,
      disabled = false,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const focusAnimation = useSharedValue(0);

    const themeColors = theme.colors;

    const handleFocus = (e: any) => {
      setIsFocused(true);
      focusAnimation.value = withTiming(1, { duration: duration.normal });
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      focusAnimation.value = withTiming(0, { duration: duration.normal });
      onBlur?.(e);
    };

    const animatedBorderStyle = useAnimatedStyle(() => {
      const borderColor = interpolateColor(
        focusAnimation.value,
        [0, 1],
        [
          error ? colors.status.urgent : themeColors.border,
          error ? colors.status.urgent : colors.indigo[500],
        ]
      );
      return { borderColor };
    });

    const isPassword = type === 'password';
    const showPassword = isPassword && isPasswordVisible;

    const getKeyboardType = (): TextInputProps['keyboardType'] => {
      switch (type) {
        case 'email':
          return 'email-address';
        case 'number':
          return 'numeric';
        default:
          return 'default';
      }
    };

    const renderPasswordToggle = () => {
      if (!isPassword) return rightIcon;

      return (
        <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} hitSlop={8}>
          <Text style={[styles.passwordToggle, { color: themeColors.textMuted }]}>
            {isPasswordVisible ? 'Hide' : 'Show'}
          </Text>
        </Pressable>
      );
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>
        )}

        <AnimatedView
          style={[
            styles.inputContainer,
            {
              backgroundColor: themeColors.input,
              borderWidth: theme.isDark ? 1 : 0,
              ...(theme.isDark ? {} : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }),
            },
            animatedBorderStyle,
            disabled && styles.disabled,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            {...props}
            editable={!disabled}
            secureTextEntry={isPassword && !showPassword}
            keyboardType={getKeyboardType()}
            autoCapitalize={type === 'email' ? 'none' : props.autoCapitalize}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.input,
              {
                color: themeColors.text,
              },
              leftIcon ? styles.inputWithLeftIcon : undefined,
              (rightIcon || isPassword) ? styles.inputWithRightIcon : undefined,
              inputStyle,
            ]}
            placeholderTextColor={themeColors.textFaint}
          />

          {(rightIcon || isPassword) && (
            <View style={styles.rightIcon}>
              {onRightIconPress ? (
                <Pressable onPress={onRightIconPress} hitSlop={8}>
                  {renderPasswordToggle()}
                </Pressable>
              ) : (
                renderPasswordToggle()
              )}
            </View>
          )}
        </AnimatedView>

        {(error || hint) && (
          <Text
            style={[
              styles.helperText,
              { color: error ? colors.status.urgent : themeColors.textFaint },
            ]}
          >
            {error || hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[1.5],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.inputHeight,
    borderRadius: layout.inputBorderRadius,
    paddingHorizontal: spacing[4],
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.base,
    height: '100%',
    padding: 0,
  },
  inputWithLeftIcon: {
    marginLeft: spacing[2],
  },
  inputWithRightIcon: {
    marginRight: spacing[2],
  },
  leftIcon: {
    marginRight: spacing[2],
  },
  rightIcon: {
    marginLeft: spacing[2],
  },
  passwordToggle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  helperText: {
    fontSize: typography.sizes.xs,
    marginTop: spacing[1],
  },
  disabled: {
    opacity: 0.5,
  },
});
