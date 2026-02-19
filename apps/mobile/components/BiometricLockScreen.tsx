import { View, Text, TouchableOpacity } from 'react-native';

interface BiometricLockScreenProps {
  biometricType: string | null;
  onRetry: () => void;
}

export function BiometricLockScreen({ biometricType, onRetry }: BiometricLockScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Locked</Text>
      <Text className="text-gray-500 text-center mb-6">
        Use {biometricType || 'biometrics'} to unlock Tymblok
      </Text>
      <TouchableOpacity className="bg-primary-600 rounded-xl py-4 px-8" onPress={onRetry}>
        <Text className="text-white font-semibold">Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}
