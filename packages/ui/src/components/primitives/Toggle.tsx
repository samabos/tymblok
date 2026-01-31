import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, layout, springConfig } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

export interface ToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  hapticFeedback?: boolean;
  style?: ViewStyle;
}

export function Toggle({
  enabled,
  onChange,
  disabled = false,
  hapticFeedback = true,
  style,
}: ToggleProps) {
  const { isDark, theme } = useTheme();
  const themeColors = theme.colors;
  const progress = useSharedValue(enabled ? 1 : 0);

  React.useEffect(() => {
    progress.value = withSpring(enabled ? 1 : 0, springConfig.snappy);
  }, [enabled]);

  const handlePress = () => {
    if (disabled) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onChange(!enabled);
  };

  const animatedTrackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [themeColors.input, colors.indigo[600]]
    );
    return { backgroundColor };
  });

  const animatedKnobStyle = useAnimatedStyle(() => {
    const translateX =
      progress.value * (layout.toggleWidth - layout.toggleKnobSize - spacing[0.5] * 2);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[disabled && styles.disabled, style]}
      hitSlop={8}
    >
      <Animated.View style={[styles.track, animatedTrackStyle]}>
        <Animated.View style={[styles.knob, animatedKnobStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: layout.toggleWidth,
    height: layout.toggleHeight,
    borderRadius: layout.toggleHeight / 2,
    padding: spacing[0.5],
    justifyContent: 'center',
  },
  knob: {
    width: layout.toggleKnobSize,
    height: layout.toggleKnobSize,
    borderRadius: layout.toggleKnobSize / 2,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
