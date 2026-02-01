import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';
import { TymblokLogo } from '../../components/icons';

export default function LoginScreen() {
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
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 justify-center p-6">
        <View className="items-center mb-6">
          <TymblokLogo size="md" style={{ marginBottom: 12 }} />
          <Text className="text-3xl font-bold text-white text-center">Tymblok</Text>
          <Text className="text-base text-slate-400 text-center mt-2">
            Time blocking for developers
          </Text>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-200">Email</Text>
            <TextInput
              className="bg-slate-800 rounded-xl p-4 text-white text-base border border-slate-700"
              placeholder="you@company.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-200">Password</Text>
            <TextInput
              className="bg-slate-800 rounded-xl p-4 text-white text-base border border-slate-700"
              placeholder="Enter your password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            className={`bg-indigo-500 rounded-xl p-4 items-center mt-2 ${
              !email || !password || isLoading ? 'opacity-50' : ''
            }`}
            onPress={handleLogin}
            disabled={!email || !password || isLoading}
          >
            <Text className="text-white text-base font-semibold">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-slate-400 text-sm">{"Don't have an account? "}</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text className="text-indigo-500 text-sm font-semibold">Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
