import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface OnboardingScreenProps {
  onComplete: () => void;
}

// Slide icons
function BlockTowerIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 48 48" fill="none">
      <Rect x="14" y="6" width="20" height="8" rx="2" fill="white" fillOpacity={0.4} />
      <Rect x="14" y="16" width="20" height="8" rx="2" fill="white" fillOpacity={0.6} />
      <Rect x="14" y="26" width="20" height="8" rx="2" fill="white" fillOpacity={0.8} />
      <Rect x="14" y="36" width="20" height="8" rx="2" fill="white" />
      <Path
        d="M10 10v28"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeOpacity={0.5}
      />
      <Circle cx={10} cy={30} r={2} fill="white" />
    </Svg>
  );
}

function DeveloperIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 48 48" fill="none">
      <Path
        d="M14 12L8 24L14 36"
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M34 12L40 24L34 36"
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={24} cy={24} r={8} stroke="white" strokeWidth={2.5} fill="none" />
      <Path
        d="M24 20v4l3 2"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 48 48" fill="none">
      <Rect
        x="8"
        y="8"
        width="32"
        height="32"
        rx="8"
        stroke="white"
        strokeWidth={2.5}
        fill="none"
      />
      <Path
        d="M16 24l6 6 10-12"
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const slides = [
  {
    icon: <BlockTowerIcon />,
    title: 'Time Blocking Made Simple',
    description: 'Plan your day with visual time blocks. See exactly where your time goes.',
  },
  {
    icon: <DeveloperIcon />,
    title: 'Built for Developers',
    description: 'Integrates with GitHub, Jira, and your calendar. Your tasks, one place.',
  },
  {
    icon: <CheckmarkIcon />,
    title: 'Focus & Ship',
    description: 'Track your deep work, build streaks, and see your productivity grow.',
  },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onComplete}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <LinearGradient
            colors={['#6366f1', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBox}
          >
            {slides[currentSlide].icon}
          </LinearGradient>
        </Animated.View>

        {/* Text */}
        <Text style={styles.title}>{slides[currentSlide].title}</Text>
        <Text style={styles.description}>{slides[currentSlide].description}</Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setCurrentSlide(i)}
              style={[styles.dot, i === currentSlide ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.button} onPress={nextSlide} activeOpacity={0.8}>
          <Text style={styles.buttonText}>
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // slate-950
  },
  header: {
    padding: 20,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8', // slate-400
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#94a3b8', // slate-400
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
  bottom: {
    padding: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#6366f1', // indigo-500
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#334155', // slate-700
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#6366f1', // indigo-600
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
