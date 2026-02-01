import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';
import { Input, Button, useTheme } from '@tymblok/ui';
import { colors, spacing, borderRadius, typography } from '@tymblok/theme';
import { EnvelopeIcon } from 'react-native-heroicons/outline';
import { GoogleIcon, GitHubIcon } from '../../components/icons';
import { AuthLayout } from '../../components/layouts';

export default function LoginScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });

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
      const message = error instanceof Error ? error.message : 'Login failed';
      console.error('[Login]', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      subtitle="Time blocking for developers"
      footer={{
        text: "Don't have an account?",
        linkText: 'Sign Up',
        href: '/(auth)/register',
      }}
    >
      <View style={styles.form}>
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChangeText={setEmail}
          disabled={isLoading}
          rightIcon={<EnvelopeIcon size={20} color={themeColors.textFaint} strokeWidth={1.5} />}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          disabled={isLoading}
        />

        <Pressable style={styles.forgotContainer}>
          <Text style={[styles.forgotText, { color: colors.indigo[500] }]}>
            Forgot password?
          </Text>
        </Pressable>

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
      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
        <Text style={[styles.dividerText, { color: themeColors.textFaint }]}>
          or continue with
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
      </View>

      {/* Social Login */}
      <View style={styles.socialRow}>
        <TouchableOpacity
          style={[styles.socialButton, { borderColor: themeColors.borderSubtle }]}
          activeOpacity={0.7}
        >
          <GoogleIcon size={20} />
          <Text style={[styles.socialText, { color: themeColors.text }]}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.socialButton, { borderColor: themeColors.borderSubtle }]}
          activeOpacity={0.7}
        >
          <GitHubIcon size={20} color={themeColors.text} />
          <Text style={[styles.socialText, { color: themeColors.text }]}>GitHub</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing[4],
  },
  forgotContainer: {
    alignItems: 'flex-end',
  },
  forgotText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[4],
    gap: spacing[3],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: typography.sizes.sm,
  },
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
});
