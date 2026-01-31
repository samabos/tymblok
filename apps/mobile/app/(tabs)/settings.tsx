import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export default function SettingsScreen() {
  const { user, clearAuth } = useAuthStore();

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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
      </View>

      <View className="flex-1 px-4 pt-6">
        {/* Profile Section */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-sm text-gray-500 uppercase mb-2">Account</Text>
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center">
              <Text className="text-primary-600 font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-900 font-medium">{user?.name || 'User'}</Text>
              <Text className="text-gray-500 text-sm">{user?.email || 'No email'}</Text>
            </View>
          </View>
        </View>

        {/* Settings Options */}
        <View className="bg-white rounded-xl mb-4">
          <TouchableOpacity className="p-4 border-b border-gray-100">
            <Text className="text-gray-900">Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity className="p-4 border-b border-gray-100">
            <Text className="text-gray-900">Appearance</Text>
          </TouchableOpacity>
          <TouchableOpacity className="p-4">
            <Text className="text-gray-900">Working Hours</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-white rounded-xl p-4"
          onPress={handleLogout}
        >
          <Text className="text-red-600 text-center font-medium">Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 pb-4">
        <Text className="text-center text-gray-400 text-sm">Tymblok v0.1.0</Text>
      </View>
    </SafeAreaView>
  );
}
