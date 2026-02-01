import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { springConfig, duration } from '@tymblok/theme';

/**
 * Hook for button press animation
 */
export function usePressAnimation(scale: number = 0.96) {
  const animatedScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animatedScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    animatedScale.value = withSpring(scale, springConfig.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    animatedScale.value = withSpring(1, springConfig.snappy);
  }, []);

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
  };
}

/**
 * Hook for float animation (like logo)
 */
export function useFloatAnimation(amplitude: number = 10, period: number = 4000) {
  const translateY = useSharedValue(0);

  const startAnimation = useCallback(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration: period / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: period / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [amplitude, period]);

  const stopAnimation = useCallback(() => {
    translateY.value = withTiming(0, { duration: duration.normal });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return {
    animatedStyle,
    startAnimation,
    stopAnimation,
  };
}

/**
 * Hook for pulse animation (like live badge)
 */
export function usePulseAnimation(
  minOpacity: number = 0.5,
  maxOpacity: number = 1,
  period: number = 2000
) {
  const opacity = useSharedValue(maxOpacity);

  const startAnimation = useCallback(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(minOpacity, { duration: period / 2 }),
        withTiming(maxOpacity, { duration: period / 2 })
      ),
      -1,
      false
    );
  }, [minOpacity, maxOpacity, period]);

  const stopAnimation = useCallback(() => {
    opacity.value = withTiming(maxOpacity, { duration: duration.normal });
  }, [maxOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    startAnimation,
    stopAnimation,
  };
}

/**
 * Hook for shake animation (error feedback)
 */
export function useShakeAnimation() {
  const translateX = useSharedValue(0);

  const shake = useCallback(() => {
    translateX.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return {
    animatedStyle,
    shake,
  };
}

/**
 * Hook for fade animation
 */
export function useFadeAnimation(initialVisible: boolean = false) {
  const opacity = useSharedValue(initialVisible ? 1 : 0);

  const fadeIn = useCallback((durationMs: number = duration.normal) => {
    opacity.value = withTiming(1, { duration: durationMs });
  }, []);

  const fadeOut = useCallback((durationMs: number = duration.normal) => {
    opacity.value = withTiming(0, { duration: durationMs });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    fadeIn,
    fadeOut,
    opacity,
  };
}

/**
 * Hook for slide animation
 */
export function useSlideAnimation(
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 100
) {
  const translateX = useSharedValue(direction === 'left' ? -distance : direction === 'right' ? distance : 0);
  const translateY = useSharedValue(direction === 'up' ? distance : direction === 'down' ? -distance : 0);

  const slideIn = useCallback(() => {
    translateX.value = withSpring(0, springConfig.gentle);
    translateY.value = withSpring(0, springConfig.gentle);
  }, []);

  const slideOut = useCallback(() => {
    translateX.value = withSpring(
      direction === 'left' ? -distance : direction === 'right' ? distance : 0,
      springConfig.gentle
    );
    translateY.value = withSpring(
      direction === 'up' ? distance : direction === 'down' ? -distance : 0,
      springConfig.gentle
    );
  }, [direction, distance]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return {
    animatedStyle,
    slideIn,
    slideOut,
  };
}
