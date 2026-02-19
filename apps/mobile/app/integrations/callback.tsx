import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@tymblok/theme';

/**
 * OAuth callback landing route.
 * When WebBrowser.openAuthSessionAsync doesn't intercept the redirect
 * (e.g. in Expo Go), the deep link falls through to Expo Router.
 * This route catches it and navigates back to the integrations screen.
 */
export default function IntegrationCallbackScreen() {
  useLocalSearchParams<{ success?: string; error?: string; provider?: string }>();

  useEffect(() => {
    // Navigate back to integrations — the parent screen's
    // openAuthSessionAsync handler will have already completed or timed out.
    router.replace('/integrations');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.indigo[500]} />
    </View>
  );
}
