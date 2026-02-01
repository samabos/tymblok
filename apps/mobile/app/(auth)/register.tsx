import { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, type Href } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';
import { Input, Button, useTheme } from '@tymblok/ui';
import { colors, spacing, borderRadius, typography } from '@tymblok/theme';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register({ email, password, name });

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
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
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
            {/* Branding */}
            <View style={styles.brandingContainer}>
              <Text style={[styles.title, { color: themeColors.text }]}>Tymblok</Text>
              <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                Create your account
              </Text>
            </View>

            {/* Register Card */}
            <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.formContainer}>
                {/* Name Input */}
                <Input
                  label="Name"
                  placeholder="John Doe"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  disabled={isLoading}
                />

                {/* Email Input */}
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  disabled={isLoading}
                />

                {/* Password Input */}
                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChangeText={setPassword}
                  disabled={isLoading}
                  hint="Must be at least 8 characters"
                />

                {/* Confirm Password Input */}
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  disabled={isLoading}
                  error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
                />

                {/* Register Button */}
                <View style={styles.buttonContainer}>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    disabled={!name || !email || !password || !confirmPassword}
                    onPress={handleRegister}
                  >
                    Create Account
                  </Button>
                </View>
              </View>
            </View>

            {/* Sign In Link */}
            <View style={styles.signinContainer}>
              <Text style={[styles.signinText, { color: themeColors.textMuted }]}>
                Already have an account?{' '}
              </Text>
              <Link href={'/(auth)/login' as Href} asChild>
                <Pressable>
                  <Text style={[styles.signinLink, { color: colors.indigo[500] }]}>Sign In</Text>
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
  buttonContainer: {
    marginTop: spacing[2],
  },
  // Sign In
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[5],
  },
  signinText: {
    fontSize: typography.sizes.sm,
  },
  signinLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
