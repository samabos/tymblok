import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../../stores/authStore';
import { authService, mapUserDtoToUser, OAuthProvider } from '../../services/authService';
import { useBiometricSignIn } from '../../hooks/useBiometricSignIn';
import { TymblokLogo } from '../../components/icons';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@tymblok/theme';

// Needed for web browser to properly close on Android
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);

  const {
    canUseBiometricSignIn,
    rememberedUser,
    biometricType,
    isLoading: biometricIsLoading,
    isEnabled: biometricIsEnabled,
    signInWithBiometrics,
    forgetUser,
    updateStoredCredentials,
  } = useBiometricSignIn();

  // Auto-trigger biometric sign-in on mount if available
  useEffect(() => {
    if (!biometricIsLoading && canUseBiometricSignIn && !showPasswordForm) {
      handleBiometricSignIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricIsLoading, canUseBiometricSignIn]);

  const handleBiometricSignIn = async () => {
    setError(null);
    setBiometricLoading(true);

    const result = await signInWithBiometrics();

    if (result.success) {
      router.replace('/(tabs)/today');
    } else {
      setError(result.error || 'Biometric sign-in failed');
    }

    setBiometricLoading(false);
  };

  const handleSwitchAccount = async () => {
    await forgetUser();
    setShowPasswordForm(true);
  };

  const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({ email: email.trim(), password: password.trim() });

      setAuth(mapUserDtoToUser(response.user), {
        access_token: response.accessToken,
        refresh_token: response.refreshToken,
        expires_in: response.expiresIn,
        token_type: 'Bearer',
      });

      // Re-store biometric credentials if enabled for this user (after session expiry)
      if (biometricIsEnabled) {
        await updateStoredCredentials({
          user: {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            avatar_url: response.user.avatarUrl,
          },
          refreshToken: response.refreshToken,
        });
      }

      // Check if email is verified before proceeding
      if (!response.user.emailVerified) {
        router.replace('/(auth)/email-verification-pending');
        return;
      }

      router.replace('/(tabs)/today');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
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

      // Open the OAuth URL in system browser
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

      if (result.type === 'success' && result.url) {
        // Parse the URL and extract tokens
        const { queryParams } = Linking.parse(result.url);
        if (queryParams?.accessToken && queryParams?.refreshToken) {
          // Store auth data
          const oauthUser = {
            id: (queryParams.userId as string) || '',
            email: (queryParams.email as string) || '',
            name: (queryParams.name as string) || '',
            avatar_url: (queryParams.avatarUrl as string) || null,
          };

          setAuth(
            {
              ...oauthUser,
              email_verified: queryParams.emailVerified === 'true',
              has_password: queryParams.hasPassword === 'true',
              timezone: 'UTC',
              working_hours_start: '09:00',
              working_hours_end: '18:00',
              lunch_start: '12:00',
              lunch_duration_minutes: 60,
              notification_block_reminder: true,
              notification_reminder_minutes: 5,
              notification_daily_summary: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              access_token: queryParams.accessToken as string,
              refresh_token: queryParams.refreshToken as string,
              expires_in: queryParams.expiresIn
                ? parseInt(queryParams.expiresIn as string, 10)
                : 900,
              token_type: 'Bearer',
            }
          );

          // Re-store biometric credentials if enabled for this user
          if (biometricIsEnabled) {
            await updateStoredCredentials({
              user: oauthUser,
              refreshToken: queryParams.refreshToken as string,
            });
          }

          router.replace('/(tabs)/today');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `${provider} login failed`;
      setError(message);
    } finally {
      setOauthLoading(null);
    }
  };

  const isAnyLoading = isLoading || oauthLoading !== null || biometricLoading;

  // Show biometric sign-in screen if available and not switched to password form
  if (canUseBiometricSignIn && !showPasswordForm && rememberedUser) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <View className="flex-1 justify-center p-6">
          <View className="items-center mb-8">
            <TymblokLogo size="md" style={{ marginBottom: 12 }} />
            <Text className="text-3xl font-bold text-white text-center">Welcome back</Text>
            <Text className="text-lg text-slate-300 text-center mt-2">{rememberedUser.name}</Text>
            <Text className="text-sm text-slate-500 text-center mt-1">{rememberedUser.email}</Text>
          </View>

          {error && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6">
              <Text className="text-sm text-red-400 text-center">{error}</Text>
            </View>
          )}

          <View className="gap-4">
            {/* Biometric Sign-in Button */}
            <TouchableOpacity
              className={`bg-indigo-500 rounded-xl p-4 items-center flex-row justify-center gap-3 ${
                biometricLoading ? 'opacity-70' : ''
              }`}
              onPress={handleBiometricSignIn}
              disabled={biometricLoading}
            >
              {biometricLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons
                  name={biometricType === 'Face ID' ? 'scan' : 'finger-print'}
                  size={24}
                  color={colors.white}
                />
              )}
              <Text className="text-white text-base font-semibold">
                {biometricLoading
                  ? 'Signing in...'
                  : `Sign in with ${biometricType || 'Biometrics'}`}
              </Text>
            </TouchableOpacity>

            {/* Use Password Instead */}
            <TouchableOpacity
              className="py-3 items-center"
              onPress={() => setShowPasswordForm(true)}
            >
              <Text className="text-indigo-400 text-sm">Use password instead</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-2">
              <View className="flex-1 h-px bg-slate-700" />
              <Text className="mx-4 text-slate-500 text-sm">or</Text>
              <View className="flex-1 h-px bg-slate-700" />
            </View>

            {/* Switch Account */}
            <TouchableOpacity className="py-3 items-center" onPress={handleSwitchAccount}>
              <Text className="text-slate-400 text-sm">
                Not {rememberedUser.name}? Sign in with a different account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Regular login form
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
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#64748b" />
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

        {/* Back to biometric sign-in if available */}
        {canUseBiometricSignIn && showPasswordForm && (
          <TouchableOpacity
            className="mt-4 py-2 items-center"
            onPress={() => setShowPasswordForm(false)}
          >
            <Text className="text-slate-500 text-sm">Back to biometric sign-in</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
