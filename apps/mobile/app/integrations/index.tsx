import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { IntegrationProvider } from '@tymblok/api-client';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AuthGuard } from '../../components/AuthGuard';
import { useAlert } from '../../components/AlertProvider';
import { useQueryClient } from '@tanstack/react-query';
import {
  useIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
  useSyncIntegration,
} from '../../services/apiHooks';

interface IntegrationConfig {
  provider: IntegrationProvider;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}

const integrationConfigs: IntegrationConfig[] = [
  {
    provider: IntegrationProvider.GitHub,
    name: 'GitHub',
    description: 'Sync PRs and issues',
    icon: 'logo-github',
    iconColor: colors.label.github,
    iconBg: `${colors.label.github}26`,
  },
  {
    provider: IntegrationProvider.GoogleCalendar,
    name: 'Google Calendar',
    description: 'Sync events and meetings',
    icon: 'calendar-outline',
    iconColor: colors.label.calendar,
    iconBg: `${colors.label.calendar}26`,
  },
  {
    provider: IntegrationProvider.Jira,
    name: 'Jira',
    description: 'Import tickets and sprints',
    icon: 'albums-outline',
    iconColor: colors.label.jira,
    iconBg: `${colors.label.jira}26`,
  },
  {
    provider: IntegrationProvider.Slack,
    name: 'Slack',
    description: 'Get notifications and updates',
    icon: 'chatbubbles-outline',
    iconColor: colors.label.slack,
    iconBg: `${colors.label.slack}26`,
  },
  {
    provider: IntegrationProvider.Notion,
    name: 'Notion',
    description: 'Import pages and databases',
    icon: 'document-text-outline',
    iconColor: colors.label.notion,
    iconBg: `${colors.label.notion}26`,
  },
  {
    provider: IntegrationProvider.Linear,
    name: 'Linear',
    description: 'Sync issues and projects',
    icon: 'git-branch-outline',
    iconColor: colors.label.linear,
    iconBg: `${colors.label.linear}26`,
  },
];

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function IntegrationsScreen() {
  return (
    <AuthGuard>
      <IntegrationsContent />
    </AuthGuard>
  );
}

function IntegrationsContent() {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const queryClient = useQueryClient();
  const { data: integrations, isLoading } = useIntegrations();
  const connectMutation = useConnectIntegration();
  const disconnectMutation = useDisconnectIntegration();
  const syncMutation = useSyncIntegration();
  const [connectingProvider, setConnectingProvider] = useState<IntegrationProvider | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<IntegrationProvider | null>(null);
  const { alert, error: showError, success, confirm } = useAlert();

  const handleBack = () => {
    router.back();
  };

  const getConnectedIntegration = (provider: IntegrationProvider) => {
    return integrations?.find(i => i.provider === provider);
  };

  const handleConnect = async (provider: IntegrationProvider) => {
    try {
      setConnectingProvider(provider);

      // Pass the Expo redirect URI so the API can forward back to the app after OAuth
      const redirectUri = Linking.createURL('integrations/callback');
      const { authUrl } = await connectMutation.mutateAsync({ provider, redirectUri });

      // Open the auth URL — the API handles the OAuth callback from Google/GitHub,
      // then redirects to tymblok://integrations/callback?success=true
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        const { queryParams } = Linking.parse(result.url);

        if (queryParams?.error) {
          showError('Connection Failed', queryParams.error as string);
        } else {
          // Success — the API already exchanged the code, stored tokens, and ran initial sync.
          // Invalidate all relevant queries to show synced data immediately.
          queryClient.invalidateQueries({ queryKey: ['integrations'] });
          queryClient.invalidateQueries({ queryKey: ['inbox'] });
          queryClient.invalidateQueries({ queryKey: ['blocks'] });
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : `Failed to connect ${provider}`;
      showError('Connection Failed', message);
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = (provider: IntegrationProvider, name: string) => {
    confirm(
      `Disconnect ${name}`,
      `Are you sure you want to disconnect ${name}? Synced items will remain in your inbox.`,
      async () => {
        try {
          await disconnectMutation.mutateAsync(provider);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to disconnect';
          showError('Error', message);
        }
      },
      'Disconnect'
    );
  };

  const handleSync = async (provider: IntegrationProvider) => {
    try {
      setSyncingProvider(provider);
      const result = await syncMutation.mutateAsync(provider);
      const synced = (result as { itemsSynced?: number })?.itemsSynced ?? 0;
      success('Sync Complete', `${synced} new items synced.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sync';
      showError('Sync Failed', message);
    } finally {
      setSyncingProvider(null);
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
          Integrations
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text className="text-sm mb-4" style={{ color: themeColors.textMuted }}>
          Connect your tools to automatically import tasks and sync your workflow.
        </Text>

        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color={colors.indigo[500]} />
          </View>
        ) : (
          <View className="gap-3">
            {integrationConfigs.map(config => {
              const connected = getConnectedIntegration(config.provider);
              const isConnecting = connectingProvider === config.provider;
              const isSyncing = syncingProvider === config.provider;
              const isAvailable =
                config.provider === IntegrationProvider.GitHub ||
                config.provider === IntegrationProvider.GoogleCalendar;

              return (
                <Card key={config.provider} variant="default" padding="md">
                  <View className="flex-row items-center gap-4">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: config.iconBg }}
                    >
                      <Ionicons name={config.icon} size={24} color={config.iconColor} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-semibold" style={{ color: themeColors.text }}>
                          {config.name}
                        </Text>
                        {connected && (
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
                        {connected?.externalUsername || config.description}
                      </Text>
                      {connected?.lastSyncAt && (
                        <Text className="text-xs mt-0.5" style={{ color: themeColors.textMuted }}>
                          Synced {formatRelativeTime(connected.lastSyncAt)}
                        </Text>
                      )}
                      {connected?.lastSyncError && (
                        <Text className="text-xs mt-0.5" style={{ color: colors.status.urgent }}>
                          Sync error: {connected.lastSyncError}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row gap-2">
                      {connected && (
                        <TouchableOpacity
                          onPress={() => handleSync(config.provider)}
                          disabled={isSyncing}
                          className="p-2 rounded-xl"
                          style={{ backgroundColor: themeColors.input }}
                        >
                          {isSyncing ? (
                            <ActivityIndicator size={16} color={themeColors.textMuted} />
                          ) : (
                            <Ionicons name="sync-outline" size={16} color={themeColors.textMuted} />
                          )}
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() =>
                          connected
                            ? handleDisconnect(config.provider, config.name)
                            : handleConnect(config.provider)
                        }
                        disabled={isConnecting || !isAvailable}
                        className="px-4 py-2 rounded-xl"
                        style={{
                          backgroundColor: connected
                            ? themeColors.input
                            : isAvailable
                              ? colors.indigo[500]
                              : themeColors.input,
                          opacity: !isAvailable && !connected ? 0.5 : 1,
                        }}
                      >
                        {isConnecting ? (
                          <ActivityIndicator size={14} color={colors.white} />
                        ) : (
                          <Text
                            className="text-sm font-medium"
                            style={{
                              color: connected
                                ? themeColors.textMuted
                                : isAvailable
                                  ? colors.white
                                  : themeColors.textMuted,
                            }}
                          >
                            {connected ? 'Disconnect' : isAvailable ? 'Connect' : 'Coming Soon'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
