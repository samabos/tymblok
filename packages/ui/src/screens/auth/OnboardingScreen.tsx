import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  FlatList,
  ViewToken,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/primitives/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function OnboardingScreen({ onComplete, onSkip }: OnboardingScreenProps) {
  const { isDark, theme } = useTheme();
  const themeColors = theme.colors;
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      icon: <BlockTowerIcon />,
      title: 'Time Blocking Made Simple',
      description: 'Plan your day with visual time blocks. See exactly where your time goes.',
    },
    {
      id: '2',
      icon: <DeveloperIcon />,
      title: 'Built for Developers',
      description: 'Integrates with GitHub, Jira, and your calendar. Your tasks, one place.',
    },
    {
      id: '3',
      icon: <CheckmarkIcon />,
      title: 'Focus & Ship',
      description: 'Track your deep work, build streaks, and see your productivity grow.',
    },
  ];

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const goToSlide = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip?.() || onComplete();
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <AnimatedIconContainer>{item.icon}</AnimatedIconContainer>
      <Text style={[styles.title, { color: themeColors.text }]}>{item.title}</Text>
      <Text style={[styles.description, { color: themeColors.textMuted }]}>
        {item.description}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* Ambient gradient */}
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
        <Animated.View
          style={[
            styles.gradientSecondary,
            {
              backgroundColor: isDark
                ? 'rgba(168, 85, 247, 0.1)'
                : 'rgba(168, 85, 247, 0.05)',
            },
          ]}
        />
      </View>

      {/* Skip button */}
      <View style={styles.header}>
        <Pressable onPress={handleSkip}>
          <Text style={[styles.skipText, { color: themeColors.textMuted }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {/* Bottom section */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <Pressable key={index} onPress={() => goToSlide(index)}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentIndex
                        ? colors.indigo[500]
                        : isDark
                        ? colors.dark.border
                        : colors.light.border,
                    width: index === currentIndex ? 24 : 8,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={goToNext}
        >
          {currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
        </Button>
      </View>
    </View>
  );
}

// Animated icon container with float effect
function AnimatedIconContainer({ children }: { children: React.ReactNode }) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );

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

  return <Animated.View style={[styles.iconContainer, animatedStyle]}>{children}</Animated.View>;
}

// Icon components
function BlockTowerIcon() {
  return (
    <View style={styles.iconInner}>
      {/* Timeline */}
      <View style={styles.timeline} />
      <View style={styles.timelineDot} />
      {/* Blocks */}
      {[0.4, 0.6, 0.8, 1].map((opacity, index) => (
        <View
          key={index}
          style={[
            styles.block,
            { opacity, top: 8 + index * 14 },
          ]}
        />
      ))}
    </View>
  );
}

function DeveloperIcon() {
  return (
    <View style={styles.iconInner}>
      {/* Code brackets */}
      <View style={[styles.bracket, styles.bracketLeft]} />
      <View style={[styles.bracket, styles.bracketRight]} />
      {/* Clock */}
      <View style={styles.clock}>
        <View style={styles.clockHand} />
      </View>
    </View>
  );
}

function CheckmarkIcon() {
  return (
    <View style={styles.iconInner}>
      <View style={styles.checkBox}>
        <View style={styles.checkMark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  gradientSecondary: {
    position: 'absolute',
    bottom: -200,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 32,
    backgroundColor: colors.indigo[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[12],
    shadowColor: colors.indigo[600],
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  iconInner: {
    width: 64,
    height: 64,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  description: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: typography.sizes.base * 1.5,
    maxWidth: 280,
  },
  bottom: {
    paddingHorizontal: spacing[8],
    paddingBottom: spacing[10],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[8],
    gap: spacing[2],
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  // Block tower icon
  timeline: {
    position: 'absolute',
    left: 4,
    top: 8,
    width: 2,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  timelineDot: {
    position: 'absolute',
    left: 1,
    top: 44,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  block: {
    position: 'absolute',
    left: 12,
    right: 4,
    height: 10,
    borderRadius: 3,
    backgroundColor: colors.white,
  },

  // Developer icon
  bracket: {
    position: 'absolute',
    width: 12,
    height: 32,
    borderColor: colors.white,
    borderWidth: 3,
  },
  bracketLeft: {
    left: 4,
    borderRightWidth: 0,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  bracketRight: {
    right: 4,
    borderLeftWidth: 0,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  clock: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  clockHand: {
    width: 2,
    height: 8,
    backgroundColor: colors.white,
    borderRadius: 1,
  },

  // Checkmark icon
  checkBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    width: 16,
    height: 10,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: colors.white,
    transform: [{ rotate: '-45deg' }, { translateY: -2 }],
  },
});
