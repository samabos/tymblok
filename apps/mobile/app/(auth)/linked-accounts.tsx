import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTheme, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { authService, OAuthProvider } from '../../services/authService';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';
import { Ionicons } from '@expo/vector-icons';
import { AuthGuard } from '../../components/AuthGuard';

// Needed for web browser to properly close
WebBrowser.maybeCompleteAuthSession();

interface ProviderInfo {
  id: OAuthProvider;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: 'google',
    name: 'Google',
    icon: 'logo-google',
    iconColor: '#4285F4',
    iconBg: '#4285F426',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'logo-github',
    iconColor: colors.label.github,
    iconBg: `${colors.label.github}26`,
  },
];

export default function LinkedAccountsScreen() {
  return (
    <AuthGuard>
      <LinkedAccountsContent />
    </AuthGuard>
  );
}

function LinkedAccountsContent() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { authenticateForSensitiveAction } = useBiometricAuth();

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
    } catch {
      console.error('[LinkedAccounts] Failed to load data');
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
      // Create the redirect URL using expo-linking (works with Expo Go and standalone)
      const redirectUrl = Linking.createURL('callback');
      const url = authService.getExternalLoginUrl(provider, redirectUrl);

      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

      if (result.type === 'success' && result.url) {
        // Parse the URL - if successful, the provider is now linked
        const { queryParams } = Linking.parse(result.url);
        if (queryParams?.accessToken) {
          // OAuth completed successfully, refresh the providers list
          await loadData();
        } else if (queryParams?.error) {
          Alert.alert('Error', (queryParams.message as string) || `Failed to link ${provider}.`);
        }
      }
    } catch {
      console.error(`[LinkedAccounts] Failed to link ${provider}`);
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

    // Require biometric authentication if enabled
    const authenticated = await authenticateForSensitiveAction('unlink account');
    if (!authenticated) {
      Alert.alert('Authentication Required', 'Biometric authentication is required to unlink an account.');
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
            } catch {
              console.error(`[LinkedAccounts] Failed to unlink ${provider}`);
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
        <View className="px-5 py-4 flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-xl"
            style={{ backgroundColor: themeColors.input }}
          >
            <Ionicons name="arrow-back" size={20} color={themeColors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold flex-1" style={{ color: themeColors.text }}>
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
      <View className="px-5 py-4 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-xl"
          style={{ backgroundColor: themeColors.input }}
        >
          <Ionicons name="arrow-back" size={20} color={themeColors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: themeColors.text }}>
          Linked Accounts
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text className="text-sm mb-4" style={{ color: themeColors.textMuted }}>
          Link your accounts to sign in faster. You can unlink accounts as long as you have another way to sign in.
        </Text>

        {/* Provider List */}
        <View className="gap-3">
          {PROVIDERS.map((provider) => {
            const linked = isLinked(provider.id);
            const loading = actionLoading === provider.id;

            return (
              <Card key={provider.id} variant="default" padding="md">
                <View className="flex-row items-center gap-4">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: provider.iconBg }}
                  >
                    <Ionicons name={provider.icon} size={24} color={provider.iconColor} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-semibold" style={{ color: themeColors.text }}>
                        {provider.name}
                      </Text>
                      {linked && (
                        <View
                          className="px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${colors.status.done}26` }}
                        >
                          <Text
                            className="text-[10px] font-medium"
                            style={{ color: colors.status.done }}
                          >
                            Connected
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                      {linked ? 'Sign in with this account' : 'Not connected'}
                    </Text>
                  </View>
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.indigo[500]} />
                  ) : linked ? (
                    <TouchableOpacity
                      className="px-4 py-2 rounded-xl"
                      style={{ backgroundColor: themeColors.input }}
                      onPress={() => handleUnlink(provider.id)}
                    >
                      <Text className="text-sm font-medium" style={{ color: colors.status.urgent }}>
                        Unlink
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      className="px-4 py-2 rounded-xl"
                      style={{ backgroundColor: colors.indigo[500] }}
                      onPress={() => handleLink(provider.id)}
                    >
                      <Text className="text-sm font-medium" style={{ color: colors.white }}>
                        Connect
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          })}
        </View>

        {/* Password status info */}
        <Card variant="default" padding="md" style={{ marginTop: 24 }}>
          <View className="flex-row items-center gap-4">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: hasPassword ? `${colors.status.done}26` : `${colors.status.pending}26` }}
            >
              <Ionicons
                name={hasPassword ? 'key' : 'key-outline'}
                size={24}
                color={hasPassword ? colors.status.done : colors.status.pending}
              />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold" style={{ color: themeColors.text }}>
                  Password
                </Text>
                {hasPassword && (
                  <View
                    className="px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${colors.status.done}26` }}
                  >
                    <Text
                      className="text-[10px] font-medium"
                      style={{ color: colors.status.done }}
                    >
                      Set
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                {hasPassword
                  ? 'Sign in with your email and password'
                  : 'Add another way to sign in'}
              </Text>
            </View>
            {!hasPassword && (
              <TouchableOpacity
                className="px-4 py-2 rounded-xl"
                style={{ backgroundColor: colors.indigo[500] }}
                onPress={() => router.push('/(auth)/set-password')}
              >
                <Text className="text-sm font-medium" style={{ color: colors.white }}>
                  Set
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
