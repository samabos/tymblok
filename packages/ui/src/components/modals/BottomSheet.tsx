import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, layout, springConfig, duration } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoints?: number[]; // percentages (0-100)
  title?: string;
  showHandle?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function BottomSheet({
  visible,
  onClose,
  snapPoints = [50],
  title,
  showHandle = true,
  showCloseButton = true,
  children,
  style,
}: BottomSheetProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  // Calculate snap point heights
  const snapPointHeights = useMemo(
    () => snapPoints.map((point) => (point / 100) * SCREEN_HEIGHT),
    [snapPoints]
  );

  const maxHeight = Math.max(...snapPointHeights);
  const minHeight = Math.min(...snapPointHeights);

  // Open/close animations
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(
        SCREEN_HEIGHT - maxHeight,
        springConfig.gentle
      );
      backdropOpacity.value = withTiming(1, { duration: duration.slow });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, springConfig.gentle);
      backdropOpacity.value = withTiming(0, { duration: duration.normal });
    }
  }, [visible, maxHeight]);

  const closeSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  // Gesture handling
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      const newY = context.value.y + event.translationY;
      // Clamp between max open and closed positions
      translateY.value = Math.max(
        SCREEN_HEIGHT - maxHeight,
        Math.min(SCREEN_HEIGHT, newY)
      );
    })
    .onEnd((event) => {
      const shouldClose =
        event.velocityY > 500 ||
        translateY.value > SCREEN_HEIGHT - minHeight / 2;

      if (shouldClose) {
        translateY.value = withSpring(SCREEN_HEIGHT, springConfig.gentle);
        backdropOpacity.value = withTiming(0, { duration: duration.normal });
        runOnJS(closeSheet)();
      } else {
        // Snap to nearest point
        const currentY = translateY.value;
        let nearestSnap = SCREEN_HEIGHT - maxHeight;
        let nearestDistance = Math.abs(currentY - nearestSnap);

        snapPointHeights.forEach((height) => {
          const snapY = SCREEN_HEIGHT - height;
          const distance = Math.abs(currentY - snapY);
          if (distance < nearestDistance) {
            nearestSnap = snapY;
            nearestDistance = distance;
          }
        });

        translateY.value = withSpring(nearestSnap, springConfig.gentle);
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0 ? 'auto' : 'none',
  }));

  if (!visible && backdropOpacity.value === 0) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { backgroundColor: themeColors.overlay },
          animatedBackdropStyle,
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.card,
              paddingBottom: insets.bottom + spacing[4],
              maxHeight: maxHeight,
            },
            animatedSheetStyle,
            style,
          ]}
        >
          {/* Handle */}
          {showHandle && (
            <View style={styles.handleContainer}>
              <View
                style={[styles.handle, { backgroundColor: themeColors.border }]}
              />
            </View>
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <View style={styles.header}>
              <Text style={[styles.title, { color: themeColors.text }]}>
                {title}
              </Text>
              {showCloseButton && (
                <Pressable onPress={closeSheet} hitSlop={8}>
                  <Text style={[styles.closeButton, { color: themeColors.textMuted }]}>
                    ✕
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    minHeight: 200,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 20,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
});
