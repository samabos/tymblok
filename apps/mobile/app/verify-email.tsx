import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { Ionicons } from '@expo/vector-icons';

type ScreenState = 'verifying' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ userId?: string; token?: string }>();
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const updateUser = useAuthStore(state => state.updateUser);
  const user = useAuthStore(state => state.user);

  const [screenState, setScreenState] = useState<ScreenState>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!params.userId || !params.token) {
        setError('Invalid verification link. Please request a new one.');
        setScreenState('error');
        return;
      }

      try {
        await authService.verifyEmail(params.userId, params.token);
        // Update local auth store if user is logged in
        if (user) {
          updateUser({ email_verified: true });
        }
        setScreenState('success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Verification failed';
        setError(message);
        setScreenState('error');
      }
    };

    verifyEmail();
  }, [params.userId, params.token, updateUser, user]);

  const handleContinue = () => {
    if (user) {
      router.replace('/(tabs)/today');
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  // Verifying state
  if (screenState === 'verifying') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color={colors.indigo[500]} />
          <Text className="text-lg font-medium mt-4" style={{ color: themeColors.text }}>
            Verifying your email...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (screenState === 'error') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View className="flex-1 items-center justify-center p-6">
          <View
            className="w-20 h-20 rounded-3xl items-center justify-center mb-6"
            style={{ backgroundColor: `${colors.status.urgent}20` }}
          >
            <Ionicons name="alert-circle" size={40} color={colors.status.urgent} />
          </View>
          <Text className="text-2xl font-bold text-center mb-2" style={{ color: themeColors.text }}>
            Verification Failed
          </Text>
          <Text className="text-base text-center mb-6" style={{ color: themeColors.textMuted }}>
            {error || 'This verification link is invalid or has expired. Please request a new one.'}
          </Text>
          <TouchableOpacity
            className="px-8 py-4 rounded-xl"
            style={{ backgroundColor: colors.indigo[500] }}
            onPress={handleBackToLogin}
          >
            <Text className="text-white text-base font-semibold">Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Success state
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      <View className="flex-1 items-center justify-center p-6">
        <View
          className="w-20 h-20 rounded-3xl items-center justify-center mb-6"
          style={{ backgroundColor: `${colors.status.done}20` }}
        >
          <Ionicons name="checkmark-circle" size={40} color={colors.status.done} />
        </View>
        <Text className="text-2xl font-bold text-center mb-2" style={{ color: themeColors.text }}>
          Email Verified!
        </Text>
        <Text className="text-base text-center mb-6" style={{ color: themeColors.textMuted }}>
          Your email has been successfully verified. You can now access all features of Tymblok.
        </Text>
        <TouchableOpacity
          className="px-8 py-4 rounded-xl"
          style={{ backgroundColor: colors.indigo[500] }}
          onPress={handleContinue}
        >
          <Text className="text-white text-base font-semibold">
            {user ? 'Continue' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
