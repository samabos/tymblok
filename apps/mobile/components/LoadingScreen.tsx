import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingScreenProps {
  message?: string;
}

// Animated logo in gradient box (matching prototype)
function AnimatedLogo() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulseAnim }] }]}>
      <LinearGradient
        colors={['#6366f1', '#a855f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logoBox}
      >
        <Svg width={40} height={40} viewBox="0 0 48 48" fill="none">
          {/* Block Tower - white blocks with varying opacity */}
          <Rect x="14" y="6" width="20" height="8" rx="2" fill="white" fillOpacity={0.4} />
          <Rect x="14" y="16" width="20" height="8" rx="2" fill="white" fillOpacity={0.6} />
          <Rect x="14" y="26" width="20" height="8" rx="2" fill="white" fillOpacity={0.8} />
          <Rect x="14" y="36" width="20" height="8" rx="2" fill="white" />
          {/* Side time indicator */}
          <Path
            d="M10 10v28"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeOpacity={0.5}
          />
          <Circle cx={10} cy={30} r={2} fill="white" />
        </Svg>
      </LinearGradient>
    </Animated.View>
  );
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      {/* Ambient gradient */}
      <View style={styles.ambientContainer}>
        <View style={styles.ambientGlow} />
      </View>

      <AnimatedLogo />
      <Text style={styles.title}>Tymblok</Text>
      <ActivityIndicator
        testID="loading-indicator"
        size="large"
        color="#6366f1"
        style={styles.spinner}
      />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617', // slate-950
  },
  ambientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    top: '15%',
    left: '50%',
    marginLeft: -400,
    width: 800,
    height: 800,
    // Very subtle - compensating for lack of CSS blur
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
    borderRadius: 9999,
  },
  logoWrapper: {
    marginBottom: 24,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    color: '#94a3b8', // slate-400
    fontSize: 16,
  },
});
