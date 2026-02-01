import { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';
import { Input, Button, useTheme } from '@tymblok/ui';
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
      <View className="gap-4">
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

        <Pressable className="items-end">
          <Text className="text-sm font-medium text-indigo-500">Forgot password?</Text>
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
      <View className="flex-row items-center my-4 gap-3">
        <View className="flex-1 h-px bg-slate-800" />
        <Text className="text-sm text-slate-500">or continue with</Text>
        <View className="flex-1 h-px bg-slate-800" />
      </View>

      {/* Social Login */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-lg border border-slate-700"
          activeOpacity={0.7}
        >
          <GoogleIcon size={20} />
          <Text className="text-sm font-medium text-white">Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-lg border border-slate-700"
          activeOpacity={0.7}
        >
          <GitHubIcon size={20} color="#fff" />
          <Text className="text-sm font-medium text-white">GitHub</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}
