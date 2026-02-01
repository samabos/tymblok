import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Animated,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, type Href } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';
import { Input, Button, useTheme } from '@tymblok/ui';
import { colors, spacing, borderRadius, typography } from '@tymblok/theme';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { EnvelopeIcon } from 'react-native-heroicons/outline';
import { LinearGradient } from 'expo-linear-gradient';

// Custom Google Icon
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </Svg>
  );
}

// Custom GitHub Icon
function GitHubIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </Svg>
  );
}

// Floating logo with gradient
function FloatingLogo() {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [floatAnim]);

  return (
    <Animated.View style={[styles.logoWrapper, { transform: [{ translateY: floatAnim }] }]}>
      <LinearGradient
        colors={colors.gradients.primary as unknown as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logoBox}
      >
        <Svg width={32} height={32} viewBox="0 0 48 48" fill="none">
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

export default function LoginScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    console.log('[Login] Starting login for:', email);
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      console.log('[Login] Response received:', response);

      setAuth(
        {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          avatar_url: response.user.avatarUrl,
          timezone: 'UTC',
          working_hours_start: '09:00',
          working_hours_end: '17:00',
          lunch_start: '12:00',
          lunch_duration_minutes: 60,
          created_at: response.user.createdAt,
          updated_at: response.user.createdAt,
        },
        {
          access_token: response.accessToken,
          refresh_token: response.refreshToken,
          expires_in: response.expiresIn,
          token_type: 'Bearer',
        }
      );

      router.replace('/(tabs)/today');
    } catch (error: unknown) {
      console.log('[Login] Error:', error);
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* Ambient glow effects */}
      <View style={styles.ambientContainer}>
        <View style={[styles.ambientGlow, styles.topGlow]} />
        <View style={[styles.ambientGlow, styles.bottomGlow]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo & Branding */}
            <View style={styles.brandingContainer}>
              <FloatingLogo />
              <Text style={[styles.title, { color: themeColors.text }]}>Tymblok</Text>
              <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                Time blocking for developers
              </Text>
            </View>

            {/* Login Card */}
            <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.formContainer}>
                {/* Email Input */}
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChangeText={setEmail}
                  disabled={isLoading}
                  rightIcon={<EnvelopeIcon size={20} color={themeColors.textFaint} strokeWidth={1.5} />}
                />

                {/* Password Input */}
                <View style={styles.passwordContainer}>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    disabled={isLoading}
                  />
                </View>

                {/* Forgot Password */}
                <Pressable style={styles.forgotContainer} onPress={() => {}}>
                  <Text style={[styles.forgotText, { color: colors.indigo[500] }]}>
                    Forgot password?
                  </Text>
                </Pressable>

                {/* Login Button */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={!email || !password}
                  onPress={handleLogin}
                >
                  Sign in
                </Button>
              </View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
                <View style={styles.dividerTextContainer}>
                  <Text style={[styles.dividerText, { backgroundColor: themeColors.card, color: themeColors.textFaint }]}>
                    or continue with
                  </Text>
                </View>
              </View>

              {/* Social Login */}
              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={[styles.socialButton, { borderColor: themeColors.borderSubtle, backgroundColor: themeColors.input + '80' }]}
                  activeOpacity={0.7}
                >
                  <GoogleIcon size={20} />
                  <Text style={[styles.socialText, { color: themeColors.text }]}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialButton, { borderColor: themeColors.borderSubtle, backgroundColor: themeColors.input + '80' }]}
                  activeOpacity={0.7}
                >
                  <GitHubIcon size={20} color={themeColors.text} />
                  <Text style={[styles.socialText, { color: themeColors.text }]}>GitHub</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: themeColors.textMuted }]}>
                {"Don't have an account? "}
              </Text>
              <Link href={'/(auth)/register' as Href} asChild>
                <Pressable>
                  <Text style={[styles.signupLink, { color: colors.indigo[500] }]}>Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  // Ambient glow
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
    borderRadius: 9999,
  },
  topGlow: {
    top: -300,
    left: '50%',
    marginLeft: -400,
    width: 800,
    height: 800,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  bottomGlow: {
    bottom: -300,
    right: -300,
    width: 600,
    height: 600,
    backgroundColor: 'rgba(168, 85, 247, 0.03)',
  },
  // Logo
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.purple[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  // Branding
  brandingContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    marginTop: spacing[1],
    fontSize: typography.sizes.sm,
  },
  // Card
  card: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing[5],
  },
  formContainer: {
    gap: spacing[4],
  },
  passwordContainer: {
    // Additional spacing handled by Input component
  },
  forgotContainer: {
    alignItems: 'flex-end',
  },
  forgotText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  // Divider
  dividerContainer: {
    position: 'relative',
    marginVertical: spacing[4],
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
  },
  dividerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dividerText: {
    paddingHorizontal: spacing[3],
    fontSize: typography.sizes.sm,
  },
  // Social
  socialRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  socialText: {
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.sm,
  },
  // Sign Up
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[5],
  },
  signupText: {
    fontSize: typography.sizes.sm,
  },
  signupLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
