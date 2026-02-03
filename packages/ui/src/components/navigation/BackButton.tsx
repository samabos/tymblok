import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, springConfig } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface BackButtonProps {
  onPress: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
  hapticFeedback?: boolean;
}

export function BackButton({
  onPress,
  icon,
  style,
  hapticFeedback = true,
}: BackButtonProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, springConfig.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig.snappy);
  };

  const handlePress = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  // Default back arrow icon
  const defaultIcon = (
    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle, style]}
      hitSlop={8}
    >
      {icon || defaultIcon}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
