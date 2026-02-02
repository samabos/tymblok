import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../../stores/authStore';
import { authService, OAuthProvider } from '../../services/authService';
import { TymblokLogo } from '../../components/icons';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async () => {
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      console.error('[Register]', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthRegister = async (provider: OAuthProvider) => {
    setError(null);
    setOauthLoading(provider);

    try {
      const url = authService.getExternalLoginUrl(provider);
      console.log(`[Register] Opening OAuth for ${provider}:`, url);

      // Open the OAuth URL in system browser
      // The browser will redirect back to our app via deep link
      await WebBrowser.openAuthSessionAsync(url, 'tymblok://auth/callback');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `${provider} sign up failed`;
      setError(message);
      console.error(`[Register] ${provider} OAuth error:`, err);
    } finally {
      setOauthLoading(null);
    }
  };

  const passwordsMatch = !confirmPassword || password === confirmPassword;
  const passwordLongEnough = !password || password.length >= 8;
  const isAnyLoading = isLoading || oauthLoading !== null;
  const isDisabled = !name || !email || !password || !confirmPassword || !passwordsMatch || !passwordLongEnough || isAnyLoading;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        contentContainerClassName="flex-grow justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-6">
          <TymblokLogo size="md" style={{ marginBottom: 12 }} />
          <Text className="text-3xl font-bold text-white text-center">Create Account</Text>
          <Text className="text-base text-slate-400 text-center mt-2">
            Join Tymblok today
          </Text>
        </View>

        {/* OAuth Buttons at top for quick signup */}
        <View className="gap-3 mb-6">
          <TouchableOpacity
            className={`flex-row items-center justify-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-4 ${
              isAnyLoading ? 'opacity-50' : ''
            }`}
            onPress={() => handleOAuthRegister('google')}
            disabled={isAnyLoading}
          >
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text className="text-white text-base font-medium">
              {oauthLoading === 'google' ? 'Loading...' : 'Sign up with Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center justify-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-4 ${
              isAnyLoading ? 'opacity-50' : ''
            }`}
            onPress={() => handleOAuthRegister('github')}
            disabled={isAnyLoading}
          >
            <Ionicons name="logo-github" size={20} color="#fff" />
            <Text className="text-white text-base font-medium">
              {oauthLoading === 'github' ? 'Loading...' : 'Sign up with GitHub'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px bg-slate-700" />
          <Text className="mx-4 text-slate-500 text-sm">or sign up with email</Text>
          <View className="flex-1 h-px bg-slate-700" />
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-200">Name</Text>
            <TextInput
              className="bg-slate-800 rounded-xl p-4 text-white text-base border border-slate-700"
              placeholder="Firstname Lastname"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!isAnyLoading}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-200">Email</Text>
            <TextInput
              className="bg-slate-800 rounded-xl p-4 text-white text-base border border-slate-700"
              placeholder="you@example.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isAnyLoading}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-200">Password</Text>
            <TextInput
              className={`bg-slate-800 rounded-xl p-4 text-white text-base border ${
                !passwordLongEnough ? 'border-red-500' : 'border-slate-700'
              }`}
              placeholder="At least 8 characters"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isAnyLoading}
            />
            <Text className={`text-xs ${!passwordLongEnough ? 'text-red-500' : 'text-slate-500'}`}>
              Must be at least 8 characters
            </Text>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-200">Confirm Password</Text>
            <TextInput
              className={`bg-slate-800 rounded-xl p-4 text-white text-base border ${
                !passwordsMatch ? 'border-red-500' : 'border-slate-700'
              }`}
              placeholder="Re-enter your password"
              placeholderTextColor="#64748b"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isAnyLoading}
            />
            {!passwordsMatch && (
              <Text className="text-xs text-red-500">Passwords do not match</Text>
            )}
          </View>

          {error && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <Text className="text-sm text-red-400 text-center">{error}</Text>
            </View>
          )}

          <TouchableOpacity
            className={`bg-indigo-500 rounded-xl p-4 items-center mt-2 ${
              isDisabled ? 'opacity-50' : ''
            }`}
            onPress={handleRegister}
            disabled={isDisabled}
          >
            <Text className="text-white text-base font-semibold">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-slate-400 text-sm">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="text-indigo-500 text-sm font-semibold">Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
