import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { authService } from '../../services/authService';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = !confirmPassword || newPassword.trim() === confirmPassword.trim();
  const passwordLongEnough = !newPassword || newPassword.trim().length >= 8;
  const isDisabled = !currentPassword || !newPassword || !confirmPassword || !passwordsMatch || !passwordLongEnough || isLoading;

  const handleChangePassword = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await authService.changePassword(currentPassword.trim(), newPassword.trim());
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
        <View className="flex-1 items-center justify-center px-5">
          <View
            className="w-20 h-20 rounded-3xl items-center justify-center mb-6"
            style={{ backgroundColor: `${colors.status.done}26` }}
          >
            <Ionicons name="checkmark-circle" size={40} color={colors.status.done} />
          </View>
          <Text className="text-2xl font-bold text-center mb-2" style={{ color: themeColors.text }}>
            Password Changed!
          </Text>
          <Text className="text-base text-center mb-6" style={{ color: themeColors.textMuted }}>
            Your password has been successfully updated.
          </Text>
          <TouchableOpacity
            className="px-8 py-4 rounded-xl"
            style={{ backgroundColor: colors.indigo[500] }}
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
        <View className="px-5 py-4 flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-xl"
            style={{ backgroundColor: themeColors.input }}
          >
            <Ionicons name="arrow-back" size={20} color={themeColors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold flex-1" style={{ color: themeColors.text }}>
            Change Password
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-sm mb-4" style={{ color: themeColors.textMuted }}>
            Enter your current password and choose a new one.
          </Text>

          <View className="gap-4">
            {/* Current Password */}
            <Card variant="default" padding="md">
              <Text className="text-sm font-medium mb-2" style={{ color: themeColors.text }}>
                Current Password
              </Text>
              <View className="relative">
                <TextInput
                  className="rounded-lg p-3 pr-12 text-base border"
                  style={{
                    backgroundColor: themeColors.input,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                  placeholder="Enter your current password"
                  placeholderTextColor={themeColors.textFaint}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  className="absolute right-3 top-3"
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showCurrentPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={themeColors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </Card>

            {/* New Password */}
            <Card variant="default" padding="md">
              <Text className="text-sm font-medium mb-2" style={{ color: themeColors.text }}>
                New Password
              </Text>
              <View className="relative">
                <TextInput
                  className="rounded-lg p-3 pr-12 text-base border"
                  style={{
                    backgroundColor: themeColors.input,
                    borderColor: !passwordLongEnough ? colors.status.urgent : themeColors.border,
                    color: themeColors.text,
                  }}
                  placeholder="At least 8 characters"
                  placeholderTextColor={themeColors.textFaint}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  className="absolute right-3 top-3"
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={themeColors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              <Text
                className="text-xs mt-2"
                style={{ color: !passwordLongEnough ? colors.status.urgent : themeColors.textFaint }}
              >
                Must be at least 8 characters
              </Text>
            </Card>

            {/* Confirm New Password */}
            <Card variant="default" padding="md">
              <Text className="text-sm font-medium mb-2" style={{ color: themeColors.text }}>
                Confirm New Password
              </Text>
              <View className="relative">
                <TextInput
                  className="rounded-lg p-3 pr-12 text-base border"
                  style={{
                    backgroundColor: themeColors.input,
                    borderColor: !passwordsMatch ? colors.status.urgent : themeColors.border,
                    color: themeColors.text,
                  }}
                  placeholder="Re-enter your new password"
                  placeholderTextColor={themeColors.textFaint}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  className="absolute right-3 top-3"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={themeColors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {!passwordsMatch && (
                <Text className="text-xs mt-2" style={{ color: colors.status.urgent }}>
                  Passwords do not match
                </Text>
              )}
            </Card>

            {error && (
              <Card variant="default" padding="md" style={{ backgroundColor: `${colors.status.urgent}15`, borderWidth: 1, borderColor: `${colors.status.urgent}30` }}>
                <Text className="text-sm text-center" style={{ color: colors.status.urgent }}>
                  {error}
                </Text>
              </Card>
            )}

            <TouchableOpacity
              className="py-4 rounded-xl items-center mt-2"
              style={{
                backgroundColor: isDisabled ? themeColors.input : colors.indigo[500],
              }}
              onPress={handleChangePassword}
              disabled={isDisabled}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: isDisabled ? themeColors.textMuted : colors.white }}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
