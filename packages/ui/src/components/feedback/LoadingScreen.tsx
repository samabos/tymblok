import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, typography } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

export interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  progress?: number; // 0-100
  style?: ViewStyle;
}

export function LoadingScreen({
  message = 'Loading your day...',
  showProgress = true,
  progress,
  style,
}: LoadingScreenProps) {
  const { isDark, theme } = useTheme();
  const themeColors = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }, style]}>
      {/* Ambient gradient effect */}
      <View style={styles.gradientContainer}>
        <Animated.View
          style={[
            styles.gradient,
            {
              backgroundColor: isDark
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(99, 102, 241, 0.1)',
            },
          ]}
        />
      </View>

      {/* Logo */}
      <AnimatedLogo />

      {/* Loading bar */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <LoadingBar progress={progress} />
        </View>
      )}

      {/* Message */}
      <Text style={[styles.message, { color: themeColors.textMuted }]}>
        {message}
      </Text>
    </View>
  );
}

// Animated logo component (block tower)
function AnimatedLogo() {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Float animation
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Subtle pulse
    scale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const blocks = [
    { opacity: 0.4, delay: 0 },
    { opacity: 0.6, delay: 100 },
    { opacity: 0.8, delay: 200 },
    { opacity: 1, delay: 300 },
  ];

  return (
    <Animated.View style={[styles.logoContainer, animatedStyle]}>
      <View style={styles.logoInner}>
        {/* Timeline line */}
        <View style={styles.timelineLine} />

        {/* Blocks */}
        {blocks.map((block, index) => (
          <AnimatedBlock
            key={index}
            opacity={block.opacity}
            delay={block.delay}
            index={index}
          />
        ))}

        {/* Timeline dot */}
        <View style={[styles.timelineDot, { top: 24 + 3 * 14 }]} />
      </View>
    </Animated.View>
  );
}

function AnimatedBlock({
  opacity,
  delay,
  index,
}: {
  opacity: number;
  delay: number;
  index: number;
}) {
  const blockOpacity = useSharedValue(0);

  useEffect(() => {
    blockOpacity.value = withDelay(
      delay,
      withTiming(opacity, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: blockOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.block,
        { top: 8 + index * 14 },
        animatedStyle,
      ]}
    />
  );
}

// Loading progress bar
function LoadingBar({ progress }: { progress?: number }) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    if (progress !== undefined) {
      animatedProgress.value = withTiming(progress / 100, { duration: 300 });
    } else {
      // Indeterminate animation
      animatedProgress.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        false
      );
    }
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View style={[styles.progressBar, { backgroundColor: themeColors.input }]}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: colors.indigo[500],
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

// Simple loading spinner
export function LoadingSpinner({
  size = 24,
  color,
}: {
  size?: number;
  color?: string;
}) {
  const { theme } = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color || theme.colors.textFaint,
          borderTopColor: color || colors.indigo[500],
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: -200,
    left: '50%',
    marginLeft: -300,
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.indigo[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.indigo[600],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoInner: {
    width: 48,
    height: 56,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 0,
    top: 8,
    width: 2,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  timelineDot: {
    position: 'absolute',
    left: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  block: {
    position: 'absolute',
    left: 8,
    right: 0,
    height: 10,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  progressContainer: {
    marginTop: spacing[8],
    width: 120,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  message: {
    marginTop: spacing[4],
    fontSize: typography.sizes.sm,
  },
});
