import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme, Avatar, Card, Input } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';
import { Ionicons } from '@expo/vector-icons';
import { AuthGuard } from '../../components/AuthGuard';
import { useAlert } from '../../components/AlertProvider';

const AVATAR_SIZE = 256; // Resize avatars to 256x256 for storage efficiency

export default function ProfileScreen() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { user, tokens, clearAuth, updateUser } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [name, setName] = useState(user?.name || 'User');

  // Email is read-only
  const email = user?.email || '';
  const avatarUrl = user?.avatar_url;
  const { alert, error: showError, confirm } = useAlert();

  // Use stored has_password from user object (set during login/OAuth)
  const hasPassword = user?.has_password ?? true;

  const handleBack = () => {
    router.back();
  };

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

  const handleDeleteAccount = () => {
    confirm(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      () => {
        alert('Coming Soon', 'Account deletion will be available in a future update.');
      },
      'Delete'
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Error', 'Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      // Call API to update profile
      const updatedUser = await authService.updateProfile(name.trim());

      // Update local state with response from server
      updateUser({
        name: updatedUser.name,
      });
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      showError('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeAvatar = async () => {
    const buttons = [
      { text: 'Take Photo', onPress: () => pickImage('camera') },
      { text: 'Choose from Library', onPress: () => pickImage('library') },
    ];
    if (avatarUrl) {
      buttons.push({ text: 'Remove Photo', onPress: handleDeleteAvatar });
    }
    alert('Change Avatar', 'Choose an option', buttons);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showError('Permission Denied', 'Camera permission is required to take photos.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showError('Permission Denied', 'Photo library permission is required to choose photos.');
          return;
        }
      }

      // Launch picker
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to pick image';
      showError('Error', message);
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    setIsUploadingAvatar(true);
    try {
      // Resize image to 256x256 for storage efficiency
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const response = await authService.uploadAvatar(manipulated.uri);
      updateUser({ avatar_url: response.avatarUrl });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload avatar';
      showError('Error', message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      await authService.deleteAvatar();
      updateUser({ avatar_url: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete avatar';
      showError('Error', message);
    } finally {
      setIsUploadingAvatar(false);
    }
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
        <Text className="text-xl font-bold flex-1" style={{ color: themeColors.text }}>
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
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
              />
            ) : (
              <Avatar name={name} size="lg" color={colors.indigo[500]} />
            )}
            <TouchableOpacity
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center border-2"
              style={{
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              }}
              onPress={handleChangeAvatar}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color={colors.indigo[500]} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.indigo[500]} />
              )}
            </TouchableOpacity>
          </View>
          <Text className="text-xl font-bold mt-4" style={{ color: themeColors.text }}>
            {name}
          </Text>
          <Text className="text-sm mt-1" style={{ color: themeColors.textMuted }}>
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
            <TouchableOpacity
              onPress={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={isSaving}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: isSaving ? themeColors.textMuted : colors.indigo[500] }}
              >
                {isSaving ? 'Saving...' : isEditing ? 'Done' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          <Card variant="default" padding="none">
            <View className="p-4">
              {isEditing ? (
                <View>
                  <Input
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    editable={!isSaving}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setName(user?.name || 'User');
                      setIsEditing(false);
                    }}
                    disabled={isSaving}
                    className="mt-2"
                  >
                    <Text
                      className="text-sm"
                      style={{ color: isSaving ? themeColors.textMuted : themeColors.textFaint }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text className="text-sm mb-1" style={{ color: themeColors.textMuted }}>
                    Full Name
                  </Text>
                  <Text className="font-medium" style={{ color: themeColors.text }}>
                    {name}
                  </Text>
                </>
              )}
            </View>
            <View className="p-4 border-t" style={{ borderColor: themeColors.border }}>
              {/* Email is not editable */}
              <Text className="text-sm mb-1" style={{ color: themeColors.textMuted }}>
                Email
              </Text>
              <Text className="font-medium" style={{ color: themeColors.text }}>
                {email}
              </Text>
            </View>
          </Card>
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
              onPress={() =>
                router.push(hasPassword ? '/(auth)/change-password' : '/(auth)/set-password')
              }
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: themeColors.input }}
                >
                  <Ionicons name="lock-closed-outline" size={18} color={themeColors.textMuted} />
                </View>
                <View>
                  <Text className="font-medium" style={{ color: themeColors.text }}>
                    {hasPassword ? 'Change Password' : 'Set Password'}
                  </Text>
                  {hasPassword === false && (
                    <Text className="text-xs" style={{ color: themeColors.textMuted }}>
                      Add a password to your account
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.textFaint} />
            </TouchableOpacity>
            <TouchableOpacity
              className="p-4 flex-row items-center justify-between border-t"
              style={{ borderColor: themeColors.border }}
              onPress={() =>
                alert('Coming Soon', 'Data export will be available in a future update.')
              }
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
          <Card
            variant="outlined"
            padding="none"
            style={{ borderColor: `${colors.status.urgent}30` }}
          >
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
