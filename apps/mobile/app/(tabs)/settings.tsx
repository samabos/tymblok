import { View, Text, TouchableOpacity, Alert, ScrollView, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';
import { useBiometricSignIn } from '../../hooks/useBiometricSignIn';
import { authService } from '../../services/authService';
import { useTheme, Avatar, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { Ionicons } from '@expo/vector-icons';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  showSwitch,
  value,
  onValueChange,
  disabled,
}: SettingsRowProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const content = (
    <View className="p-4 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3 flex-1">
        <View
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: themeColors.input }}
        >
          <Ionicons name={icon} size={18} color={themeColors.textMuted} />
        </View>
        <View className="flex-1">
          <Text
            className="font-medium"
            style={{ color: disabled ? themeColors.textFaint : themeColors.text }}
          >
            {label}
          </Text>
          {sublabel && (
            <Text className="text-sm" style={{ color: themeColors.textMuted }}>
              {sublabel}
            </Text>
          )}
        </View>
      </View>
      {showSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: themeColors.input, true: colors.indigo[500] }}
          thumbColor={colors.white}
        />
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={18} color={themeColors.textFaint} />
      ) : null}
    </View>
  );

  if (onPress && !showSwitch) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export default function SettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme();
  const themeColors = theme.colors;
  const { user, clearAuth } = useAuthStore();
  const { isAvailable, isEnabled: isProtectionEnabled, enableBiometric, disableBiometric } = useBiometricAuth();
  const { isEnabled: isSignInEnabled, enableBiometricSignIn, disableBiometricSignIn } = useBiometricSignIn();

  // Combined biometric state - enabled if either is enabled
  const isBiometricEnabled = isProtectionEnabled || isSignInEnabled;

  // Use stored has_password from user object (set during login/OAuth)
  const hasPassword = user?.has_password ?? true;

  const { tokens } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            // Revoke refresh token on server before clearing local state
            try {
              if (tokens?.refresh_token) {
                await authService.logout(tokens.refresh_token);
              }
            } catch (error) {
              // Log but don't block logout if API fails
              console.warn('[Logout] Failed to revoke token:', error);
            }
            clearAuth();
            // Navigate to login - AuthGuard on protected screens handles back navigation
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Enable both features
      const signInEnabled = await enableBiometricSignIn();
      if (signInEnabled) {
        await enableBiometric();
      }
    } else {
      // Disable both features
      await disableBiometric();
      await disableBiometricSignIn();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text
          className="text-2xl font-bold"
          style={{ color: themeColors.text }}
        >
          Settings
        </Text>
        <Text
          className="text-sm mt-1"
          style={{ color: themeColors.textMuted }}
        >
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
          <Card variant="default" padding="md" pressable onPress={() => router.push('/(auth)/profile')}>
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
              onPress={() => console.log('[Settings] Notifications')}
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
                sublabel="9:00 AM - 5:00 PM"
                onPress={() => console.log('[Settings] Working hours')}
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
              sublabel={isAvailable ? 'Sign in faster & protect sensitive actions' : 'Not available on this device'}
              showSwitch
              value={isBiometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!isAvailable}
            />
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <SettingsRow
                icon="key-outline"
                label={hasPassword ? "Change Password" : "Set Password"}
                sublabel={hasPassword ? "Update your account password" : "Add a password to your account"}
                onPress={() => router.push(hasPassword ? '/(auth)/change-password' : '/(auth)/set-password')}
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
              onPress={() => console.log('[Settings] Help')}
            />
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <SettingsRow
                icon="chatbubble-outline"
                label="Contact Support"
                onPress={() => console.log('[Settings] Support')}
              />
            </View>
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <SettingsRow
                icon="document-text-outline"
                label="Privacy Policy"
                onPress={() => console.log('[Settings] Privacy')}
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
        <Text
          className="text-center mt-4 text-sm"
          style={{ color: themeColors.textFaint }}
        >
          Tymblok v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
