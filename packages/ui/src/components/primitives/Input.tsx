import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
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
import { colors, spacing, layout, typography } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

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
      value,
      placeholder,
      autoFocus,
      onChangeText,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // --- Fabric / new-arch workaround ---
    // On Fabric, TextInput's controlled `value` prop uses `dispatchCommand`
    // which crashes. We use an uncontrolled TextInput (defaultValue only)
    // and force-remount via key when the parent pushes a new value externally.
    const internalText = useRef(value ?? '');
    const [remountKey, setRemountKey] = useState(0);

    useEffect(() => {
      // If the external value changed and it wasn't from the user typing,
      // force-remount the TextInput so defaultValue picks up the new value.
      if (value !== undefined && value !== internalText.current) {
        internalText.current = value;
        setRemountKey(k => k + 1);
      }
    }, [value]);

    const handleChangeText = useCallback(
      (text: string) => {
        internalText.current = text;
        onChangeText?.(text);
      },
      [onChangeText]
    );

    const themeColors = theme.colors;

    const handleFocus = useCallback(
      (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = useCallback(
      (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur]
    );

    const borderColor = error
      ? colors.status.urgent
      : isFocused
        ? colors.indigo[500]
        : themeColors.border;

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
        {label && <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: themeColors.input,
              borderWidth: theme.isDark ? 1 : 0,
              borderColor,
              ...(theme.isDark
                ? {}
                : {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 2,
                  }),
            },
            disabled && styles.disabled,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <TextInput
            key={remountKey}
            ref={ref}
            {...props}
            defaultValue={internalText.current}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            autoFocus={autoFocus}
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
              rightIcon || isPassword ? styles.inputWithRightIcon : undefined,
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
        </View>

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
