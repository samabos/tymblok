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
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/primitives/Button';
import { Input } from '../../components/primitives/Input';
import { BackButton } from '../../components/navigation/BackButton';

export interface SignUpScreenProps {
  onSignUp: (name: string, email: string, password: string) => Promise<void> | void;
  onBack: () => void;
  onLogin: () => void;
  onGoogleSignUp?: () => void;
  onGitHubSignUp?: () => void;
  loading?: boolean;
  error?: string;
}

export function SignUpScreen({
  onSignUp,
  onBack,
  onLogin,
  onGoogleSignUp,
  onGitHubSignUp,
  loading = false,
  error,
}: SignUpScreenProps) {
  const { isDark, theme } = useTheme();
  const themeColors = theme.colors;
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = loading || localLoading;
  const isValid = name.length >= 2 && email.includes('@') && password.length >= 8;

  const handleSignUp = async () => {
    if (!isValid) return;
    setLocalLoading(true);
    try {
      await onSignUp(name, email, password);
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

      {/* Header with back button */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <BackButton onPress={onBack} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing[8] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
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
        </View>

        {/* Branding */}
        <Text style={[styles.title, { color: themeColors.text }]}>
          Create your account
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
          Start time blocking like a developer
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <View style={styles.fieldSpacing}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.fieldSpacing}>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              hint="Must be at least 8 characters"
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!isValid}
            onPress={handleSignUp}
            style={styles.signUpButton}
          >
            Create Account
          </Button>
        </View>

        {/* Terms */}
        <Text style={[styles.terms, { color: themeColors.textFaint }]}>
          By signing up, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>

        {/* Divider */}
        {(onGoogleSignUp || onGitHubSignUp) && (
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            <Text style={[styles.dividerText, { color: themeColors.textFaint }]}>
              or sign up with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
          </View>
        )}

        {/* Social login */}
        {(onGoogleSignUp || onGitHubSignUp) && (
          <View style={styles.socialButtons}>
            {onGoogleSignUp && (
              <Button
                variant="secondary"
                onPress={onGoogleSignUp}
                style={styles.socialButton}
              >
                Google
              </Button>
            )}
            {onGitHubSignUp && (
              <Button
                variant="secondary"
                onPress={onGitHubSignUp}
                style={styles.socialButton}
              >
                GitHub
              </Button>
            )}
          </View>
        )}

        {/* Login link */}
        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: themeColors.textMuted }]}>
            Already have an account?{' '}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onLogin();
            }}
          >
            <Text style={[styles.loginLink, { color: colors.indigo[500] }]}>
              Sign in
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: spacing[4],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
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
    width: 36,
    height: 44,
    position: 'relative',
  },
  timeline: {
    position: 'absolute',
    left: 2,
    top: 6,
    width: 2,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 30,
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
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  form: {
    marginBottom: spacing[4],
  },
  fieldSpacing: {
    marginTop: spacing[4],
  },
  errorText: {
    color: colors.status.urgent,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
  signUpButton: {
    marginTop: spacing[6],
  },
  terms: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * 1.5,
    marginBottom: spacing[4],
  },
  termsLink: {
    color: colors.indigo[500],
    fontWeight: typography.weights.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[4],
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[6],
  },
  loginText: {
    fontSize: typography.sizes.base,
  },
  loginLink: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});
