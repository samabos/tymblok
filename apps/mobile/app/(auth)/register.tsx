import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';
import { Input, Button } from '@tymblok/ui';
import { spacing } from '@tymblok/theme';
import { AuthLayout } from '../../components/layouts';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (password !== confirmPassword) return;
    if (password.length < 8) return;

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
      const message = error instanceof Error ? error.message : 'Registration failed';
      console.error('[Register]', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      subtitle="Create your account"
      footer={{
        text: 'Already have an account?',
        linkText: 'Sign In',
        href: '/(auth)/login',
      }}
    >
      <View style={styles.form}>
        <Input
          label="Name"
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          disabled={isLoading}
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          disabled={isLoading}
        />

        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChangeText={setPassword}
          disabled={isLoading}
          hint="Must be at least 8 characters"
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          disabled={isLoading}
          error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
        />

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={!name || !email || !password || !confirmPassword || password !== confirmPassword}
          onPress={handleRegister}
          style={styles.button}
        >
          Create Account
        </Button>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing[4],
  },
  button: {
    marginTop: spacing[2],
  },
});
