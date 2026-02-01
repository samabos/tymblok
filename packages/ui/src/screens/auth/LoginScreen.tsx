import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/primitives/Button';
import { Input } from '../../components/primitives/Input';

export interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void> | void;
  onSignUp: () => void;
  onForgotPassword: () => void;
  onGoogleLogin?: () => void;
  onGitHubLogin?: () => void;
  loading?: boolean;
  error?: string;
}

export function LoginScreen({
  onLogin,
  onSignUp,
  onForgotPassword,
  onGoogleLogin,
  onGitHubLogin,
  loading = false,
  error,
}: LoginScreenProps) {
  const { isDark, theme } = useTheme();
  const themeColors = theme.colors;
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = loading || localLoading;

  const handleLogin = async () => {
    if (!email || !password) return;
    setLocalLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing[8], paddingBottom: insets.bottom + spacing[8] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <AnimatedLogo />

        {/* Branding */}
        <Text style={[styles.appName, { color: themeColors.text }]}>Tymblok</Text>
        <Text style={[styles.tagline, { color: themeColors.textMuted }]}>
          Time blocking for devs
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.passwordField}>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onForgotPassword();
            }}
            style={styles.forgotPassword}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.indigo[500] }]}>
              Forgot password?
            </Text>
          </Pressable>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!email || !password}
            onPress={handleLogin}
            style={styles.loginButton}
          >
            Sign in
          </Button>
        </View>

        {/* Divider */}
        {(onGoogleLogin || onGitHubLogin) && (
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            <Text style={[styles.dividerText, { color: themeColors.textFaint }]}>
              or continue with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
          </View>
        )}

        {/* Social login */}
        {(onGoogleLogin || onGitHubLogin) && (
          <View style={styles.socialButtons}>
            {onGoogleLogin && (
              <Button
                variant="secondary"
                onPress={onGoogleLogin}
                style={styles.socialButton}
              >
                Google
              </Button>
            )}
            {onGitHubLogin && (
              <Button
                variant="secondary"
                onPress={onGitHubLogin}
                style={styles.socialButton}
              >
                GitHub
              </Button>
            )}
          </View>
        )}

        {/* Sign up link */}
        <View style={styles.signUpContainer}>
          <Text style={[styles.signUpText, { color: themeColors.textMuted }]}>
            Don't have an account?{' '}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSignUp();
            }}
          >
            <Text style={[styles.signUpLink, { color: colors.indigo[500] }]}>
              Sign up
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AnimatedLogo() {
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.logoContainer, animatedStyle]}>
      <View style={styles.logoInner}>
        <View style={styles.timeline} />
        <View style={styles.timelineDot} />
        {[0.4, 0.6, 0.8, 1].map((opacity, index) => (
          <View
            key={index}
            style={[styles.block, { opacity, top: 6 + index * 11 }]}
          />
        ))}
      </View>
    </Animated.View>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.indigo[600],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing[6],
    shadowColor: colors.indigo[600],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoInner: {
    width: 40,
    height: 48,
    position: 'relative',
  },
  timeline: {
    position: 'absolute',
    left: 2,
    top: 6,
    width: 2,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 34,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  block: {
    position: 'absolute',
    left: 8,
    right: 2,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  appName: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  tagline: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  form: {
    marginBottom: spacing[6],
  },
  passwordField: {
    marginTop: spacing[4],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  forgotPasswordText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  errorText: {
    color: colors.status.urgent,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  loginButton: {
    marginTop: spacing[2],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: typography.sizes.sm,
    marginHorizontal: spacing[3],
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
  },
  socialButton: {
    flex: 1,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[8],
  },
  signUpText: {
    fontSize: typography.sizes.base,
  },
  signUpLink: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});
