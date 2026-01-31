import { View, Text, ActivityIndicator } from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-4xl font-bold text-primary-600 mb-6">Tymblok</Text>
      <ActivityIndicator testID="loading-indicator" size="large" color="#7c3aed" />
      {message && <Text className="text-gray-500 mt-4">{message}</Text>}
    </View>
  );
}
