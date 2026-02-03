import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function SetPasswordScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const updateUser = useAuthStore((state) => state.updateUser);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = !confirmPassword || newPassword.trim() === confirmPassword.trim();
  const passwordLongEnough = !newPassword || newPassword.trim().length >= 8;
  const isDisabled = !newPassword || !confirmPassword || !passwordsMatch || !passwordLongEnough || isLoading;

  const handleSetPassword = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await authService.setPassword(newPassword.trim());
      // Update the auth store to reflect that user now has a password
      updateUser({ has_password: true });
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set password';

      // If user already has a password, update state and redirect to change password
      if (message.includes('already have a password')) {
        updateUser({ has_password: true });
        setError('You already have a password. Redirecting to change password...');
        setTimeout(() => {
          router.replace('/(auth)/change-password');
        }, 1500);
        return;
      }

      setError(message);
      console.error('[SetPassword]', err);
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
            Password Set!
          </Text>
          <Text className="text-base text-center mb-6" style={{ color: themeColors.textMuted }}>
            You can now sign in with your email and password.
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
            Set Password
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-sm mb-4" style={{ color: themeColors.textMuted }}>
            Add a password to your account so you can sign in with your email address.
          </Text>

          <View className="gap-4">
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

            {/* Confirm Password */}
            <Card variant="default" padding="md">
              <Text className="text-sm font-medium mb-2" style={{ color: themeColors.text }}>
                Confirm Password
              </Text>
              <View className="relative">
                <TextInput
                  className="rounded-lg p-3 pr-12 text-base border"
                  style={{
                    backgroundColor: themeColors.input,
                    borderColor: !passwordsMatch ? colors.status.urgent : themeColors.border,
                    color: themeColors.text,
                  }}
                  placeholder="Re-enter your password"
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
              testID="set-password-button"
              className="py-4 rounded-xl items-center mt-2"
              style={{
                backgroundColor: isDisabled ? themeColors.input : colors.indigo[500],
              }}
              onPress={handleSetPassword}
              disabled={isDisabled}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: isDisabled ? themeColors.textMuted : colors.white }}
              >
                {isLoading ? 'Setting Password...' : 'Set Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
