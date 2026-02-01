import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius } from '@tymblok/theme';

interface TymblokLogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  style?: ViewStyle;
}

const sizes = {
  sm: { box: 40, icon: 24 },
  md: { box: 56, icon: 32 },
  lg: { box: 72, icon: 40 },
};

export function TymblokLogo({ size = 'md', animated = true, style }: TymblokLogoProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const { box, icon } = sizes[size];

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, animated]);

  const animatedStyle = animated ? { transform: [{ translateY: floatAnim }] } : undefined;

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}>
      <LinearGradient
        colors={colors.gradients.primary as unknown as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.box, { width: box, height: box, borderRadius: borderRadius.xl }]}
      >
        <Svg width={icon} height={icon} viewBox="0 0 48 48" fill="none">
          <Rect x="14" y="6" width="20" height="8" rx="2" fill="white" fillOpacity={0.4} />
          <Rect x="14" y="16" width="20" height="8" rx="2" fill="white" fillOpacity={0.6} />
          <Rect x="14" y="26" width="20" height="8" rx="2" fill="white" fillOpacity={0.8} />
          <Rect x="14" y="36" width="20" height="8" rx="2" fill="white" />
          <Path d="M10 10v28" stroke="white" strokeWidth={2} strokeLinecap="round" strokeOpacity={0.5} />
          <Circle cx={10} cy={30} r={2} fill="white" />
        </Svg>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.purple[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
});
