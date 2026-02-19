import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { Ionicons } from '@expo/vector-icons';

interface EmailVerificationBannerProps {
  onDismiss?: () => void;
}

export function EmailVerificationBanner({ onDismiss }: EmailVerificationBannerProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const user = useAuthStore(state => state.user);

  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show if user is verified or no user
  if (!user || user.email_verified) {
    return null;
  }

  const handleResend = async () => {
    if (!user?.id) return;

    setError(null);
    setIsLoading(true);

    try {
      await authService.resendVerificationEmail(user.id);
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send email';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      className="mx-4 mb-4 p-4 rounded-2xl"
      style={{
        backgroundColor: colors.status.pending + '15',
        borderWidth: 1,
        borderColor: colors.status.pending + '30',
      }}
    >
      <View className="flex-row items-start">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: colors.status.pending + '20' }}
        >
          <Ionicons name="mail-outline" size={20} color={colors.status.pending} />
        </View>

        <View className="flex-1">
          <Text className="font-semibold mb-1" style={{ color: themeColors.text }}>
            Verify your email
          </Text>
          <Text className="text-sm mb-3" style={{ color: themeColors.textMuted }}>
            Please check your inbox and click the verification link to complete your registration.
          </Text>

          {error && (
            <Text className="text-sm mb-2" style={{ color: colors.status.urgent }}>
              {error}
            </Text>
          )}

          {sent ? (
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color={colors.status.done} />
              <Text className="text-sm ml-1" style={{ color: colors.status.done }}>
                Verification email sent!
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: colors.status.pending }}
                onPress={handleResend}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-medium text-white">Resend Email</Text>
                )}
              </TouchableOpacity>

              {onDismiss && (
                <TouchableOpacity onPress={onDismiss}>
                  <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                    Dismiss
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
