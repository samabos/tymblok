import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '@tymblok/ui';
import { colors } from '@tymblok/theme';

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: string;
    userId?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    emailVerified?: string;
    error?: string;
    errorMessage?: string;
  }>();

  const { theme } = useTheme();
  const themeColors = theme.colors;
  const setAuth = useAuthStore(state => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error from OAuth provider
      if (params.error) {
        setError(params.errorMessage || params.error || 'Authentication failed');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
        return;
      }

      // Validate required tokens
      if (!params.accessToken || !params.refreshToken) {
        setError('Invalid authentication response');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
        return;
      }

      try {
        // Store the auth data
        setAuth(
          {
            id: params.userId || '',
            email: params.email || '',
            name: params.name || '',
            avatar_url: params.avatarUrl || null,
            email_verified: params.emailVerified === 'true',
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
            access_token: params.accessToken,
            refresh_token: params.refreshToken,
            expires_in: params.expiresIn ? parseInt(params.expiresIn, 10) : 900,
            token_type: 'Bearer',
          }
        );

        // Navigate to main app
        router.replace('/(tabs)/today');
      } catch {
        setError('Failed to complete authentication');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
      }
    };

    handleCallback();
  }, [params, setAuth]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      <View className="flex-1 items-center justify-center p-6">
        {error ? (
          <>
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.status.urgent + '20' }}
            >
              <Text className="text-3xl">!</Text>
            </View>
            <Text
              className="text-xl font-semibold text-center mb-2"
              style={{ color: themeColors.text }}
            >
              Authentication Failed
            </Text>
            <Text className="text-base text-center" style={{ color: themeColors.textMuted }}>
              {error}
            </Text>
            <Text className="text-sm text-center mt-4" style={{ color: themeColors.textFaint }}>
              Redirecting to login...
            </Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.indigo[500]} />
            <Text className="text-lg font-medium mt-4" style={{ color: themeColors.text }}>
              Completing sign in...
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
