import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, Avatar, Card, Input } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { useAuthStore } from '../stores/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { user, clearAuth } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'User');
  const [email, setEmail] = useState(user?.email || '');

  const handleBack = () => {
    router.back();
  };

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Call API to delete account
            console.log('[Profile] Delete account requested');
          },
        },
      ]
    );
  };

  const handleSave = () => {
    // TODO: Call API to update profile
    console.log('[Profile] Saving profile:', { name, email });
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={handleBack}
          className="p-2 -ml-2 rounded-xl"
          style={{ backgroundColor: themeColors.input }}
        >
          <Ionicons name="arrow-back" size={20} color={themeColors.text} />
        </TouchableOpacity>
        <Text
          className="text-xl font-bold flex-1"
          style={{ color: themeColors.text }}
        >
          Profile
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Avatar Section */}
        <View className="items-center py-6">
          <View className="relative">
            <Avatar name={name} size="lg" color={colors.indigo[500]} />
            <TouchableOpacity
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center border-2"
              style={{
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              }}
            >
              <Ionicons name="camera" size={16} color={colors.indigo[500]} />
            </TouchableOpacity>
          </View>
          <Text
            className="text-xl font-bold mt-4"
            style={{ color: themeColors.text }}
          >
            {name}
          </Text>
          <Text
            className="text-sm mt-1"
            style={{ color: themeColors.textMuted }}
          >
            {email}
          </Text>
        </View>

        {/* Personal Info */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: themeColors.textMuted }}
            >
              Personal Info
            </Text>
            <TouchableOpacity onPress={isEditing ? handleSave : () => setIsEditing(true)}>
              <Text className="text-xs font-medium" style={{ color: colors.indigo[500] }}>
                {isEditing ? 'Done' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          <Card variant="default" padding="none">
            <View className="p-4">
              {isEditing ? (
                <Input
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                />
              ) : (
                <>
                  <Text
                    className="text-sm mb-1"
                    style={{ color: themeColors.textMuted }}
                  >
                    Full Name
                  </Text>
                  <Text className="font-medium" style={{ color: themeColors.text }}>
                    {name}
                  </Text>
                </>
              )}
            </View>
            <View
              className="p-4 border-t"
              style={{ borderColor: themeColors.border }}
            >
              {isEditing ? (
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChangeText={setEmail}
                />
              ) : (
                <>
                  <Text
                    className="text-sm mb-1"
                    style={{ color: themeColors.textMuted }}
                  >
                    Email
                  </Text>
                  <Text className="font-medium" style={{ color: themeColors.text }}>
                    {email}
                  </Text>
                </>
              )}
            </View>
          </Card>
        </View>

        {/* Activity Stats */}
        <View className="mb-4">
          <Text
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: themeColors.textMuted }}
          >
            Activity
          </Text>
          <View className="flex-row gap-3">
            <Card variant="default" padding="md" style={{ flex: 1 }}>
              <Text
                className="text-2xl font-bold text-center"
                style={{ color: themeColors.text }}
              >
                156
              </Text>
              <Text
                className="text-xs text-center mt-1"
                style={{ color: themeColors.textMuted }}
              >
                Tasks Done
              </Text>
            </Card>
            <Card variant="default" padding="md" style={{ flex: 1 }}>
              <Text
                className="text-2xl font-bold text-center"
                style={{ color: themeColors.text }}
              >
                12
              </Text>
              <Text
                className="text-xs text-center mt-1"
                style={{ color: themeColors.textMuted }}
              >
                Day Streak
              </Text>
            </Card>
            <Card variant="default" padding="md" style={{ flex: 1 }}>
              <Text
                className="text-2xl font-bold text-center"
                style={{ color: themeColors.text }}
              >
                89h
              </Text>
              <Text
                className="text-xs text-center mt-1"
                style={{ color: themeColors.textMuted }}
              >
                This Month
              </Text>
            </Card>
          </View>
        </View>

        {/* Account Actions */}
        <View className="mb-4">
          <Text
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: themeColors.textMuted }}
          >
            Account
          </Text>
          <Card variant="default" padding="none">
            <TouchableOpacity
              className="p-4 flex-row items-center justify-between"
              onPress={() => console.log('[Profile] Change password')}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: themeColors.input }}
                >
                  <Ionicons name="lock-closed-outline" size={18} color={themeColors.textMuted} />
                </View>
                <Text className="font-medium" style={{ color: themeColors.text }}>
                  Change Password
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.textFaint} />
            </TouchableOpacity>
            <TouchableOpacity
              className="p-4 flex-row items-center justify-between border-t"
              style={{ borderColor: themeColors.border }}
              onPress={() => console.log('[Profile] Export data')}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: themeColors.input }}
                >
                  <Ionicons name="download-outline" size={18} color={themeColors.textMuted} />
                </View>
                <Text className="font-medium" style={{ color: themeColors.text }}>
                  Export Data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.textFaint} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Sign Out Button - Same style as Settings */}
        <TouchableOpacity
          className="mb-4 p-4 rounded-2xl items-center"
          style={{ backgroundColor: themeColors.card }}
          onPress={handleLogout}
        >
          <Text className="font-medium" style={{ color: colors.status.urgent }}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Danger Zone - Delete Account only */}
        <View className="mb-4">
          <Text
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: themeColors.textMuted }}
          >
            Danger Zone
          </Text>
          <Card variant="outlined" padding="none" style={{ borderColor: `${colors.status.urgent}30` }}>
            <TouchableOpacity
              className="p-4 flex-row items-center gap-3"
              onPress={handleDeleteAccount}
            >
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${colors.status.urgent}26` }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.status.urgent} />
              </View>
              <Text className="font-medium" style={{ color: colors.status.urgent }}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
