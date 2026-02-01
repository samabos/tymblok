import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Rect, Defs, LinearGradient as SvgGradient, Stop, G } from 'react-native-svg';

/**
 * Tymblok App Logo - matches docs/brand/app-icon.svg
 * Always use this logo for branding consistency
 */

interface TymblokLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  style?: ViewStyle;
}

const sizes = {
  sm: 40,
  md: 56,
  lg: 72,
  xl: 96,
};

export function TymblokLogo({ size = 'md', animated = true, style }: TymblokLogoProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const boxSize = sizes[size];

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
      <Svg width={boxSize} height={boxSize} viewBox="0 0 512 512">
        <Defs>
          <SvgGradient id="bg-gradient" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#6366f1" />
            <Stop offset="1" stopColor="#a855f7" />
          </SvgGradient>
        </Defs>

        {/* Background with gradient */}
        <Rect width="512" height="512" rx="108" fill="url(#bg-gradient)" />

        {/* Block Tower (centered and scaled) */}
        <G transform="translate(136, 116)">
          {/* Timeline vertical line */}
          <Rect x="0" y="0" width="8" height="280" rx="4" fill="white" fillOpacity={0.9} />

          {/* Block 1 (top, smallest) */}
          <Rect x="20" y="0" width="100" height="52" rx="12" fill="white" />

          {/* Block 2 (middle) */}
          <Rect x="20" y="68" width="150" height="52" rx="12" fill="white" fillOpacity={0.9} />

          {/* Block 3 (larger) */}
          <Rect x="20" y="136" width="200" height="52" rx="12" fill="white" fillOpacity={0.8} />

          {/* Block 4 (base, largest) */}
          <Rect x="20" y="204" width="220" height="52" rx="12" fill="white" fillOpacity={0.7} />
        </G>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for depth
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
});
