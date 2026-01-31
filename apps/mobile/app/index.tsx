import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    // Give the store time to rehydrate from SecureStore
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [setLoading]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/today" />;
  }

  return <Redirect href="/(auth)/login" />;
}
