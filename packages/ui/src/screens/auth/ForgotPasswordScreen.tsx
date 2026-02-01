import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/primitives/Button';
import { Input } from '../../components/primitives/Input';
import { BackButton } from '../../components/navigation/BackButton';

export interface ForgotPasswordScreenProps {
  onSubmit: (email: string) => Promise<void> | void;
  onBack: () => void;
  loading?: boolean;
  error?: string;
}

type ScreenState = 'form' | 'success';

export function ForgotPasswordScreen({
  onSubmit,
  onBack,
  loading = false,
  error,
}: ForgotPasswordScreenProps) {
  const { isDark, theme } = useTheme();
  const themeColors = theme.colors;
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('form');
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = loading || localLoading;
  const isValid = email.includes('@');

  const handleSubmit = async () => {
    if (!isValid) return;
    setLocalLoading(true);
    try {
      await onSubmit(email);
      setScreenState('success');
    } catch {
      // Error is handled via props.error
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResend = async () => {
    setLocalLoading(true);
    try {
      await onSubmit(email);
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
      </View>

      {/* Header with back button */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <BackButton onPress={onBack} />
      </View>

      <View style={styles.content}>
        {screenState === 'form' ? (
          <>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconInner}>
                <View style={styles.lockBody} />
                <View style={styles.lockShackle} />
              </View>
            </View>

            <Text style={[styles.title, { color: themeColors.text }]}>
              Forgot password?
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
              No worries, we'll send you reset instructions.
            </Text>

            <View style={styles.form}>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={!isValid}
                onPress={handleSubmit}
                style={styles.submitButton}
              >
                Reset Password
              </Button>
            </View>

            <Button
              variant="ghost"
              onPress={onBack}
              style={styles.backButton}
            >
              Back to login
            </Button>
          </>
        ) : (
          <>
            {/* Success state */}
            <View style={[styles.iconContainer, { backgroundColor: colors.status.done }]}>
              <View style={styles.checkIcon}>
                <View style={styles.checkMark} />
              </View>
            </View>

            <Text style={[styles.title, { color: themeColors.text }]}>
              Check your email
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
              We've sent a password reset link to{'\n'}
              <Text style={{ color: themeColors.text, fontWeight: typography.weights.medium }}>
                {email}
              </Text>
            </Text>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={onBack}
              style={styles.submitButton}
            >
              Back to login
            </Button>

            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: themeColors.textMuted }]}>
                Didn't receive the email?{' '}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={handleResend}
                loading={isLoading}
              >
                Click to resend
              </Button>
            </View>
          </>
        )}
      </View>
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
  header: {
    paddingHorizontal: spacing[4],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.indigo[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
    shadowColor: colors.indigo[600],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconInner: {
    width: 36,
    height: 40,
    position: 'relative',
    alignItems: 'center',
  },
  lockBody: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  lockShackle: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: colors.white,
    borderBottomColor: 'transparent',
  },
  checkIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    width: 20,
    height: 12,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: colors.white,
    transform: [{ rotate: '-45deg' }, { translateY: -2 }],
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: typography.sizes.base * 1.5,
    marginBottom: spacing[6],
  },
  form: {
    width: '100%',
  },
  errorText: {
    color: colors.status.urgent,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing[3],
  },
  submitButton: {
    marginTop: spacing[6],
  },
  backButton: {
    marginTop: spacing[4],
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[6],
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: typography.sizes.sm,
  },
});
