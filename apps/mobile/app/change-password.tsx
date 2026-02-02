import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, BackButton } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { authService } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;
  const passwordLongEnough = !newPassword || newPassword.length >= 8;
  const isDisabled = !currentPassword || !newPassword || !confirmPassword || !passwordsMatch || !passwordLongEnough || isLoading;

  const handleChangePassword = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setError(message);
      console.error('[ChangePassword]', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6" style={{ backgroundColor: colors.status.done + '20' }}>
            <Ionicons name="checkmark-circle" size={40} color={colors.status.done} />
          </View>
          <Text className="text-2xl font-bold text-center mb-2" style={{ color: themeColors.text }}>
            Password Changed!
          </Text>
          <Text className="text-base text-center mb-6" style={{ color: themeColors.textMuted }}>
            Your password has been successfully updated.
          </Text>
          <TouchableOpacity
            className="bg-indigo-500 rounded-xl px-8 py-4"
            onPress={() => router.back()}
          >
            <Text className="text-white text-base font-semibold">Done</Text>
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
        {/* Header */}
        <View className="flex-row items-center px-4 py-2">
          <BackButton onPress={() => router.back()} />
          <Text className="text-xl font-bold ml-3" style={{ color: themeColors.text }}>
            Change Password
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-4 mt-4">
            <View className="gap-2">
              <Text className="text-sm font-medium" style={{ color: themeColors.text }}>
                Current Password
              </Text>
              <TextInput
                className="rounded-xl p-4 text-base border"
                style={{
                  backgroundColor: themeColors.input,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }}
                placeholder="Enter your current password"
                placeholderTextColor={themeColors.textFaint}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <View className="h-px my-2" style={{ backgroundColor: themeColors.border }} />

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
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                editable={!isLoading}
              />
              <Text className={`text-xs`} style={{ color: !passwordLongEnough ? colors.status.urgent : themeColors.textFaint }}>
                Must be at least 8 characters
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium" style={{ color: themeColors.text }}>
                Confirm New Password
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
                placeholder="Re-enter your new password"
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
              className={`bg-indigo-500 rounded-xl p-4 items-center mt-4 ${
                isDisabled ? 'opacity-50' : ''
              }`}
              onPress={handleChangePassword}
              disabled={isDisabled}
            >
              <Text className="text-white text-base font-semibold">
                {isLoading ? 'Updating...' : 'Update Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
