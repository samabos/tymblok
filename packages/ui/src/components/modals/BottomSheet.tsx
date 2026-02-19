import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  ViewStyle,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius, springConfig, duration } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 70;

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

  // Available height above tab bar
  const availableHeight = SCREEN_HEIGHT - TAB_BAR_HEIGHT;

  // Calculate snap point heights (as percentage of available height)
  const snapPointHeights = useMemo(
    () => snapPoints.map(point => (point / 100) * availableHeight),
    [snapPoints, availableHeight]
  );

  const maxHeight = Math.max(...snapPointHeights);
  const minHeight = Math.min(...snapPointHeights);

  // Open/close animations (within available height above tab bar)
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(availableHeight - maxHeight, springConfig.gentle);
      backdropOpacity.value = withTiming(1, { duration: duration.slow });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, springConfig.gentle);
      backdropOpacity.value = withTiming(0, { duration: duration.normal });
    }
  }, [visible, maxHeight, availableHeight]);

  const closeSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  // Gesture handling
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate(event => {
      const newY = context.value.y + event.translationY;
      translateY.value = Math.max(availableHeight - maxHeight, Math.min(SCREEN_HEIGHT, newY));
    })
    .onEnd(event => {
      const shouldClose = event.velocityY > 500 || translateY.value > availableHeight - minHeight / 2;

      if (shouldClose) {
        translateY.value = withSpring(SCREEN_HEIGHT, springConfig.gentle);
        backdropOpacity.value = withTiming(0, { duration: duration.normal });
        runOnJS(closeSheet)();
      } else {
        const currentY = translateY.value;
        let nearestSnap = availableHeight - maxHeight;
        let nearestDistance = Math.abs(currentY - nearestSnap);

        snapPointHeights.forEach(height => {
          const snapY = availableHeight - height;
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
  }));

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={styles.overlay}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet}>
          <Animated.View
            style={[styles.backdrop, { backgroundColor: themeColors.overlay }, animatedBackdropStyle]}
          />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.card,
              paddingBottom: spacing[4],
              height: maxHeight,
            },
            animatedSheetStyle,
            style,
          ]}
        >
          {/* Draggable handle + header area */}
          <GestureDetector gesture={gesture}>
            <Animated.View>
              {/* Handle */}
              {showHandle && (
                <View style={styles.handleContainer}>
                  <View style={[styles.handle, { backgroundColor: themeColors.border }]} />
                </View>
              )}

              {/* Header */}
              {(title || showCloseButton) && (
                <View style={styles.header}>
                  <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
                  {showCloseButton && (
                    <Pressable onPress={closeSheet} hitSlop={8}>
                      <Text style={[styles.closeButton, { color: themeColors.textMuted }]}>✕</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </Animated.View>
          </GestureDetector>

          {/* Content — free from drag gesture so ScrollViews work */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
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
    overflow: 'hidden',
  },
});
