import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InboxScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-primary-600">Inbox</Text>
        <Text className="text-gray-500 mt-2">Task inbox coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
