import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../../stores/authStore';
import { authService, OAuthProvider } from '../../services/authService';
import { TymblokLogo } from '../../components/icons';
import { Ionicons } from '@expo/vector-icons';

// Needed for web browser to properly close on Android
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({ email: email.trim(), password: password.trim() });

      setAuth(
        {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          avatar_url: response.user.avatarUrl,
          has_password: response.user.hasPassword,
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
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      console.error('[Login]', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setError(null);
    setOauthLoading(provider);

    try {
      // Create the redirect URL using expo-linking (works with Expo Go and standalone)
      const redirectUrl = Linking.createURL('callback');
      const url = authService.getExternalLoginUrl(provider, redirectUrl);
      console.log(`[Login] Opening OAuth for ${provider}:`, url);
      console.log(`[Login] Redirect URL:`, redirectUrl);

      // Open the OAuth URL in system browser
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
      console.log(`[Login] OAuth result:`, result);

      if (result.type === 'success' && result.url) {
        // Parse the URL and extract tokens
        const { queryParams } = Linking.parse(result.url);
        if (queryParams?.accessToken && queryParams?.refreshToken) {
          // Store auth data
          setAuth(
            {
              id: (queryParams.userId as string) || '',
              email: (queryParams.email as string) || '',
              name: (queryParams.name as string) || '',
              avatar_url: (queryParams.avatarUrl as string) || null,
              email_verified: queryParams.emailVerified === 'true',
              has_password: queryParams.hasPassword === 'true',
              timezone: 'UTC',
              working_hours_start: '09:00',
              working_hours_end: '17:00',
              lunch_start: '12:00',
              lunch_duration_minutes: 60,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              access_token: queryParams.accessToken as string,
              refresh_token: queryParams.refreshToken as string,
              expires_in: queryParams.expiresIn ? parseInt(queryParams.expiresIn as string, 10) : 900,
              token_type: 'Bearer',
            }
          );
          router.replace('/(tabs)/today');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `${provider} login failed`;
      setError(message);
      console.error(`[Login] ${provider} OAuth error:`, err);
    } finally {
      setOauthLoading(null);
    }
  };

  const isAnyLoading = isLoading || oauthLoading !== null;

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
              editable={!isAnyLoading}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-200">Password</Text>
            <View className="relative">
              <TextInput
                className="bg-slate-800 rounded-xl p-4 pr-12 text-white text-base border border-slate-700"
                placeholder="Enter your password"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isAnyLoading}
              />
              <TouchableOpacity
                className="absolute right-4 top-4"
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          {error && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <Text className="text-sm text-red-400 text-center">{error}</Text>
            </View>
          )}

          <TouchableOpacity
            className={`bg-indigo-500 rounded-xl p-4 items-center mt-2 ${
              !email || !password || isAnyLoading ? 'opacity-50' : ''
            }`}
            onPress={handleLogin}
            disabled={!email || !password || isAnyLoading}
          >
            <Text className="text-white text-base font-semibold">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable className="mt-2 items-center">
              <Text className="text-indigo-500 text-sm">Forgot password?</Text>
            </Pressable>
          </Link>

          {/* Divider */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-slate-700" />
            <Text className="mx-4 text-slate-500 text-sm">or continue with</Text>
            <View className="flex-1 h-px bg-slate-700" />
          </View>

          {/* OAuth Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-4 ${
                isAnyLoading ? 'opacity-50' : ''
              }`}
              onPress={() => handleOAuthLogin('google')}
              disabled={isAnyLoading}
            >
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text className="text-white text-base font-medium">
                {oauthLoading === 'google' ? 'Loading...' : 'Google'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-4 ${
                isAnyLoading ? 'opacity-50' : ''
              }`}
              onPress={() => handleOAuthLogin('github')}
              disabled={isAnyLoading}
            >
              <Ionicons name="logo-github" size={20} color="#fff" />
              <Text className="text-white text-base font-medium">
                {oauthLoading === 'github' ? 'Loading...' : 'GitHub'}
              </Text>
            </TouchableOpacity>
          </View>
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
