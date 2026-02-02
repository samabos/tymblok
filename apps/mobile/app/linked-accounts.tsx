import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTheme, BackButton, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { authService, OAuthProvider } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';

interface ProviderInfo {
  id: OAuthProvider;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const PROVIDERS: ProviderInfo[] = [
  { id: 'google', name: 'Google', icon: 'logo-google', color: '#4285F4' },
  { id: 'github', name: 'GitHub', icon: 'logo-github', color: '#333' },
];

export default function LinkedAccountsScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [hasPassword, setHasPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [providers, passwordStatus] = await Promise.all([
        authService.getLinkedProviders(),
        authService.hasPassword(),
      ]);
      setLinkedProviders(providers.map(p => p.toLowerCase()));
      setHasPassword(passwordStatus);
    } catch (err) {
      console.error('[LinkedAccounts] Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLink = async (provider: OAuthProvider) => {
    setActionLoading(provider);
    try {
      const url = authService.getExternalLoginUrl(provider);
      await WebBrowser.openAuthSessionAsync(url, 'tymblok://auth/callback');
      // Refresh the list after linking
      await loadData();
    } catch (err) {
      console.error(`[LinkedAccounts] Failed to link ${provider}:`, err);
      Alert.alert('Error', `Failed to link ${provider}. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlink = async (provider: OAuthProvider) => {
    // Check if this is the only sign-in method
    const isOnlyMethod = linkedProviders.length === 1 && !hasPassword;

    if (isOnlyMethod) {
      Alert.alert(
        'Cannot Unlink',
        'This is your only sign-in method. Please add a password or link another account first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      `Unlink ${provider.charAt(0).toUpperCase() + provider.slice(1)}?`,
      `You won't be able to sign in with ${provider} after unlinking.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(provider);
            try {
              await authService.unlinkProvider(provider);
              await loadData();
            } catch (err) {
              console.error(`[LinkedAccounts] Failed to unlink ${provider}:`, err);
              Alert.alert('Error', `Failed to unlink ${provider}. Please try again.`);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const isLinked = (provider: OAuthProvider) => linkedProviders.includes(provider);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View className="flex-row items-center px-4 py-2">
          <BackButton onPress={() => router.back()} />
          <Text className="text-xl font-bold ml-3" style={{ color: themeColors.text }}>
            Linked Accounts
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.indigo[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-2">
        <BackButton onPress={() => router.back()} />
        <Text className="text-xl font-bold ml-3" style={{ color: themeColors.text }}>
          Linked Accounts
        </Text>
      </View>

      <View className="flex-1 px-5 pt-4">
        <Text className="text-sm mb-4" style={{ color: themeColors.textMuted }}>
          Link your accounts to sign in faster. You can unlink accounts as long as you have another way to sign in.
        </Text>

        <Card variant="default" padding="none">
          {PROVIDERS.map((provider, index) => {
            const linked = isLinked(provider.id);
            const loading = actionLoading === provider.id;

            return (
              <View key={provider.id}>
                {index > 0 && <View style={{ borderTopWidth: 1, borderColor: themeColors.border }} />}
                <View className="p-4 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: themeColors.input }}
                    >
                      <Ionicons name={provider.icon} size={22} color={themeColors.text} />
                    </View>
                    <View>
                      <Text className="font-medium" style={{ color: themeColors.text }}>
                        {provider.name}
                      </Text>
                      <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                        {linked ? 'Connected' : 'Not connected'}
                      </Text>
                    </View>
                  </View>

                  {loading ? (
                    <ActivityIndicator size="small" color={colors.indigo[500]} />
                  ) : linked ? (
                    <TouchableOpacity
                      className="px-4 py-2 rounded-lg"
                      style={{ backgroundColor: themeColors.input }}
                      onPress={() => handleUnlink(provider.id)}
                    >
                      <Text className="text-sm font-medium" style={{ color: colors.status.urgent }}>
                        Unlink
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      className="px-4 py-2 rounded-lg"
                      style={{ backgroundColor: colors.indigo[500] }}
                      onPress={() => handleLink(provider.id)}
                    >
                      <Text className="text-sm font-medium text-white">
                        Link
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </Card>

        {/* Password status info */}
        <View className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: themeColors.card }}>
          <View className="flex-row items-center gap-3">
            <Ionicons
              name={hasPassword ? 'checkmark-circle' : 'alert-circle'}
              size={24}
              color={hasPassword ? colors.status.done : colors.status.pending}
            />
            <View className="flex-1">
              <Text className="font-medium" style={{ color: themeColors.text }}>
                {hasPassword ? 'Password is set' : 'No password set'}
              </Text>
              <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                {hasPassword
                  ? 'You can sign in with your email and password'
                  : 'Set a password to have another way to sign in'}
              </Text>
            </View>
          </View>
          {!hasPassword && (
            <TouchableOpacity
              className="mt-3 p-3 rounded-xl items-center"
              style={{ backgroundColor: colors.indigo[500] }}
              onPress={() => router.push('/change-password')}
            >
              <Text className="text-white font-medium">Set Password</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
