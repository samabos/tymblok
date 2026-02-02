import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { authService } from '../../services/authService';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = !confirmPassword || password === confirmPassword;
  const passwordLongEnough = !password || password.length >= 8;
  const isDisabled = !password || !confirmPassword || !passwordsMatch || !passwordLongEnough || isLoading;

  const handleReset = async () => {
    if (!params.token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await authService.resetPassword(params.token, password);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setError(message);
      console.error('[ResetPassword]', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  if (!params.token) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6" style={{ backgroundColor: colors.status.urgent + '20' }}>
            <Ionicons name="alert-circle" size={40} color={colors.status.urgent} />
          </View>
          <Text className="text-2xl font-bold text-center mb-2" style={{ color: themeColors.text }}>
            Invalid Reset Link
          </Text>
          <Text className="text-base text-center mb-6" style={{ color: themeColors.textMuted }}>
            This password reset link is invalid or has expired. Please request a new one.
          </Text>
          <TouchableOpacity
            className="bg-indigo-500 rounded-xl px-8 py-4"
            onPress={handleBackToLogin}
          >
            <Text className="text-white text-base font-semibold">Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6" style={{ backgroundColor: colors.status.done + '20' }}>
            <Ionicons name="checkmark-circle" size={40} color={colors.status.done} />
          </View>
          <Text className="text-2xl font-bold text-center mb-2" style={{ color: themeColors.text }}>
            Password Reset!
          </Text>
          <Text className="text-base text-center mb-6" style={{ color: themeColors.textMuted }}>
            Your password has been successfully reset. You can now sign in with your new password.
          </Text>
          <TouchableOpacity
            className="bg-indigo-500 rounded-xl px-8 py-4"
            onPress={handleBackToLogin}
          >
            <Text className="text-white text-base font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-center p-6">
          {/* Icon */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-3xl items-center justify-center mb-4" style={{ backgroundColor: colors.indigo[600] }}>
              <Ionicons name="key" size={36} color="#fff" />
            </View>
            <Text className="text-2xl font-bold text-center" style={{ color: themeColors.text }}>
              Set New Password
            </Text>
            <Text className="text-base text-center mt-2" style={{ color: themeColors.textMuted }}>
              Enter your new password below
            </Text>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-sm font-medium" style={{ color: themeColors.text }}>
                New Password
              </Text>
              <TextInput
                className={`rounded-xl p-4 text-base border ${
                  !passwordLongEnough ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: themeColors.input,
                  borderColor: !passwordLongEnough ? colors.status.urgent : themeColors.border,
                  color: themeColors.text,
                }}
                placeholder="At least 8 characters"
                placeholderTextColor={themeColors.textFaint}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
              <Text className={`text-xs ${!passwordLongEnough ? 'text-red-500' : ''}`} style={{ color: !passwordLongEnough ? colors.status.urgent : themeColors.textFaint }}>
                Must be at least 8 characters
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium" style={{ color: themeColors.text }}>
                Confirm Password
              </Text>
              <TextInput
                className={`rounded-xl p-4 text-base border ${
                  !passwordsMatch ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: themeColors.input,
                  borderColor: !passwordsMatch ? colors.status.urgent : themeColors.border,
                  color: themeColors.text,
                }}
                placeholder="Re-enter your password"
                placeholderTextColor={themeColors.textFaint}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isLoading}
              />
              {!passwordsMatch && (
                <Text className="text-xs" style={{ color: colors.status.urgent }}>
                  Passwords do not match
                </Text>
              )}
            </View>

            {error && (
              <View className="rounded-xl p-3" style={{ backgroundColor: colors.status.urgent + '15', borderWidth: 1, borderColor: colors.status.urgent + '30' }}>
                <Text className="text-sm text-center" style={{ color: colors.status.urgent }}>
                  {error}
                </Text>
              </View>
            )}

            <TouchableOpacity
              className={`bg-indigo-500 rounded-xl p-4 items-center mt-2 ${
                isDisabled ? 'opacity-50' : ''
              }`}
              onPress={handleReset}
              disabled={isDisabled}
            >
              <Text className="text-white text-base font-semibold">
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center mt-4"
              onPress={handleBackToLogin}
              disabled={isLoading}
            >
              <Text className="text-sm" style={{ color: colors.indigo[500] }}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
