import { View, Text, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';
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
  const { isAvailable, isEnabled, biometricType, enableBiometric, disableBiometric } = useBiometricAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            clearAuth();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      await enableBiometric();
    } else {
      await disableBiometric();
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
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Section */}
        <View className="pt-4">
          <Card variant="default" padding="md" pressable onPress={() => router.push('/profile')}>
            <View className="flex-row items-center">
              <Avatar name={user?.name || 'User'} size="md" color={colors.indigo[500]} />
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
              label={biometricType || 'Biometric Lock'}
              sublabel={isAvailable ? 'Require biometrics to open app' : 'Not available on this device'}
              showSwitch
              value={isEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!isAvailable}
            />
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <SettingsRow
                icon="key-outline"
                label="Change Password"
                sublabel="Update your account password"
                onPress={() => router.push('/change-password' as never)}
              />
            </View>
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <SettingsRow
                icon="link-outline"
                label="Linked Accounts"
                sublabel="Google, GitHub sign-in options"
                onPress={() => router.push('/linked-accounts' as never)}
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
