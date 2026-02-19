import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function EmailVerificationPendingScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { user, clearAuth, updateUser } = useAuthStore();

  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResendEmail = async () => {
    if (!user?.id) return;

    setError(null);
    setResendSuccess(false);
    setIsResending(true);

    try {
      await authService.resendVerificationEmail(user.id);
      setResendSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification email';
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setError(null);
    setIsChecking(true);

    try {
      // Re-authenticate to get fresh user data
      // For now, we'll use a simple approach - the user needs to re-login
      // In a more complete implementation, we could add a /auth/me endpoint
      setError('Please sign in again to continue after verifying your email.');
      setTimeout(() => {
        clearAuth();
        router.replace('/(auth)/login');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check verification status';
      setError(message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignOut = () => {
    clearAuth();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      <View className="flex-1 p-6">
        {/* Header */}
        <View className="items-center mt-8 mb-8">
          <View
            className="w-20 h-20 rounded-3xl items-center justify-center mb-6"
            style={{ backgroundColor: `${colors.status.pending}20` }}
          >
            <Ionicons name="mail-unread" size={40} color={colors.status.pending} />
          </View>
          <Text className="text-2xl font-bold text-center mb-2" style={{ color: themeColors.text }}>
            Verify Your Email
          </Text>
          <Text className="text-base text-center" style={{ color: themeColors.textMuted }}>
            Please verify your email address to access all features of Tymblok.
          </Text>
        </View>

        {/* Email Info */}
        <Card variant="default" padding="md" style={{ marginBottom: 16 }}>
          <View className="flex-row items-center gap-3">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: themeColors.input }}
            >
              <Ionicons name="at" size={20} color={themeColors.textMuted} />
            </View>
            <View className="flex-1">
              <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                Verification email sent to
              </Text>
              <Text className="font-medium" style={{ color: themeColors.text }}>
                {user?.email || 'your email'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Instructions */}
        <Card variant="default" padding="md" style={{ marginBottom: 24 }}>
          <Text className="font-medium mb-3" style={{ color: themeColors.text }}>
            Next steps:
          </Text>
          <View className="gap-2">
            <View className="flex-row items-start gap-2">
              <Text style={{ color: colors.indigo[500] }}>1.</Text>
              <Text className="flex-1" style={{ color: themeColors.textMuted }}>
                Check your inbox for a verification email from Tymblok
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text style={{ color: colors.indigo[500] }}>2.</Text>
              <Text className="flex-1" style={{ color: themeColors.textMuted }}>
                Click the verification link in the email
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text style={{ color: colors.indigo[500] }}>3.</Text>
              <Text className="flex-1" style={{ color: themeColors.textMuted }}>
                Sign in again to continue
              </Text>
            </View>
          </View>
        </Card>

        {/* Success Message */}
        {resendSuccess && (
          <Card
            variant="default"
            padding="md"
            style={{
              backgroundColor: `${colors.status.done}15`,
              borderWidth: 1,
              borderColor: `${colors.status.done}30`,
              marginBottom: 16,
            }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={20} color={colors.status.done} />
              <Text className="flex-1" style={{ color: colors.status.done }}>
                Verification email sent! Check your inbox.
              </Text>
            </View>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card
            variant="default"
            padding="md"
            style={{
              backgroundColor: `${colors.status.urgent}15`,
              borderWidth: 1,
              borderColor: `${colors.status.urgent}30`,
              marginBottom: 16,
            }}
          >
            <Text className="text-sm text-center" style={{ color: colors.status.urgent }}>
              {error}
            </Text>
          </Card>
        )}

        {/* Action Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            className="py-4 rounded-xl items-center flex-row justify-center gap-2"
            style={{ backgroundColor: colors.indigo[500] }}
            onPress={handleResendEmail}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="refresh" size={20} color={colors.white} />
            )}
            <Text className="text-base font-semibold" style={{ color: colors.white }}>
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-4 rounded-xl items-center flex-row justify-center gap-2"
            style={{ backgroundColor: themeColors.input }}
            onPress={handleCheckVerification}
            disabled={isChecking}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color={themeColors.text} />
            ) : (
              <Ionicons name="checkmark-done" size={20} color={themeColors.text} />
            )}
            <Text className="text-base font-semibold" style={{ color: themeColors.text }}>
              {isChecking ? 'Checking...' : "I've Verified My Email"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Link */}
        <TouchableOpacity className="mt-6 py-3 items-center" onPress={handleSignOut}>
          <Text className="text-sm" style={{ color: themeColors.textMuted }}>
            Sign in with a different account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
