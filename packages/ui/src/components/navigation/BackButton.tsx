import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
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
    <BackArrowIcon color={themeColors.text} />
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

// Simple back arrow icon component
function BackArrowIcon({ color }: { color: string }) {
  return (
    <Animated.View style={styles.iconContainer}>
      {/* Using a simple arrow made with Views since we don't have SVG */}
      <Animated.View
        style={[
          styles.arrowLine,
          styles.arrowLineTop,
          { backgroundColor: color },
        ]}
      />
      <Animated.View
        style={[
          styles.arrowLine,
          styles.arrowLineBottom,
          { backgroundColor: color },
        ]}
      />
    </Animated.View>
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
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLine: {
    position: 'absolute',
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  arrowLineTop: {
    transform: [{ rotate: '-45deg' }, { translateX: -2 }, { translateY: -4 }],
  },
  arrowLineBottom: {
    transform: [{ rotate: '45deg' }, { translateX: -2 }, { translateY: 4 }],
  },
});
