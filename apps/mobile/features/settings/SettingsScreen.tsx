import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';
import { useBiometricSignIn } from '../../hooks/useBiometricSignIn';
import { authService } from '../../services/authService';
import { useTheme, Avatar, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeDisplay } from '../../utils/formatTime';
import { SettingsRow } from './components/SettingsRow';
import { useAlert } from '../../components/AlertProvider';

export default function SettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme();
  const themeColors = theme.colors;
  const { alert, confirm } = useAlert();
  const { user, clearAuth } = useAuthStore();
  const {
    isAvailable,
    isEnabled: isProtectionEnabled,
    enableBiometric,
    disableBiometric,
  } = useBiometricAuth();
  const {
    isEnabled: isSignInEnabled,
    enableBiometricSignIn,
    disableBiometricSignIn,
  } = useBiometricSignIn();

  const isBiometricEnabled = isProtectionEnabled || isSignInEnabled;
  const hasPassword = user?.has_password ?? true;
  const { tokens } = useAuthStore();

  const handleLogout = () => {
    confirm(
      'Sign Out',
      'Are you sure you want to sign out?',
      async () => {
        try {
          if (tokens?.refresh_token) {
            await authService.logout(tokens.refresh_token);
          }
        } catch (error) {
          console.warn('[Logout] Failed to revoke token:', error);
        }
        clearAuth();
        router.replace('/(auth)/login');
      },
      'Sign Out'
    );
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const signInEnabled = await enableBiometricSignIn();
      if (signInEnabled) {
        await enableBiometric();
      }
    } else {
      await disableBiometric();
      await disableBiometricSignIn();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold" style={{ color: themeColors.text }}>
          Settings
        </Text>
        <Text className="text-sm mt-1" style={{ color: themeColors.textMuted }}>
          Manage your account and preferences
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Section */}
        <View className="pt-4">
          <Card
            variant="default"
            padding="md"
            pressable
            onPress={() => router.push('/(auth)/profile')}
          >
            <View className="flex-row items-center">
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
              ) : (
                <Avatar name={user?.name || 'User'} size="md" color={colors.indigo[500]} />
              )}
              <View className="ml-3 flex-1">
                <Text className="font-medium" style={{ color: themeColors.text }}>
                  {user?.name || 'User'}
                </Text>
                <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                  {user?.email || 'No email'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.textFaint} />
            </View>
          </Card>
        </View>

        {/* Integrations Section */}
        <View className="mt-4">
          <Text
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: themeColors.textMuted }}
          >
            Connections
          </Text>
          <Card variant="default" padding="none">
            <SettingsRow
              icon="git-branch-outline"
              label="Integrations"
              sublabel="GitHub, Jira, Calendar & more"
              onPress={() => router.push('/integrations')}
            />
          </Card>
        </View>

        {/* Preferences Section */}
        <View className="mt-4">
          <Text
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: themeColors.textMuted }}
          >
            Preferences
          </Text>
          <Card variant="default" padding="none">
            <SettingsRow
              icon="notifications-outline"
              label="Notifications"
              sublabel="Push notifications & reminders"
              onPress={() => router.push('/notification-settings')}
            />
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <SettingsRow
                icon="moon-outline"
                label="Dark Mode"
                sublabel={isDark ? 'Currently enabled' : 'Currently disabled'}
                showSwitch
                value={isDark}
                onValueChange={toggleTheme}
              />
            </View>
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <SettingsRow
                icon="time-outline"
                label="Working Hours"
                sublabel={`${formatTimeDisplay(user?.working_hours_start ?? '09:00')} - ${formatTimeDisplay(user?.working_hours_end ?? '18:00')}`}
                onPress={() => router.push('/working-hours')}
              />
            </View>
          </Card>
        </View>

        {/* Security Section */}
        <View className="mt-4">
          <Text
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: themeColors.textMuted }}
          >
            Security
          </Text>
          <Card variant="default" padding="none">
            <SettingsRow
              icon="finger-print-outline"
              label="Biometric Sign-in"
              sublabel={
                isAvailable
                  ? 'Sign in faster & protect sensitive actions'
                  : 'Not available on this device'
              }
              showSwitch
              value={isBiometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!isAvailable}
            />
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <SettingsRow
                icon="key-outline"
                label={hasPassword ? 'Change Password' : 'Set Password'}
                sublabel={
                  hasPassword ? 'Update your account password' : 'Add a password to your account'
                }
                onPress={() =>
                  router.push(hasPassword ? '/(auth)/change-password' : '/(auth)/set-password')
                }
              />
            </View>
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <SettingsRow
                icon="link-outline"
                label="Linked Accounts"
                sublabel="Google, GitHub sign-in options"
                onPress={() => router.push('/(auth)/linked-accounts')}
              />
            </View>
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <SettingsRow
                icon="phone-portrait-outline"
                label="Active Sessions"
                sublabel="Manage devices signed in"
                onPress={() => router.push('/(auth)/sessions')}
              />
            </View>
          </Card>
        </View>

        {/* Support Section */}
        <View className="mt-4">
          <Text
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: themeColors.textMuted }}
          >
            Support
          </Text>
          <Card variant="default" padding="none">
            <SettingsRow
              icon="help-circle-outline"
              label="Help & FAQ"
              onPress={() => router.push('/support-content?slug=help-faq')}
            />
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <SettingsRow
                icon="chatbubble-outline"
                label="Contact Support"
                onPress={() => alert('Contact Support', 'Email us at support@tymblok.com')}
              />
            </View>
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <SettingsRow
                icon="document-text-outline"
                label="Privacy Policy"
                onPress={() => router.push('/support-content?slug=privacy-policy')}
              />
            </View>
          </Card>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          className="mt-6 p-4 rounded-2xl items-center"
          style={{ backgroundColor: themeColors.card }}
          onPress={handleLogout}
        >
          <Text className="font-medium" style={{ color: colors.status.urgent }}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Version */}
        <Text className="text-center mt-4 text-sm" style={{ color: themeColors.textFaint }}>
          Tymblok v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
