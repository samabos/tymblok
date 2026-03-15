import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { IntegrationProvider } from '@tymblok/api-client';
import type { IntegrationDto } from '@tymblok/api-client';
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

interface ProviderConfig {
  provider: IntegrationProvider;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  available: boolean;
}

const providerConfigs: ProviderConfig[] = [
  {
    provider: IntegrationProvider.GitHub,
    name: 'GitHub',
    description: 'Sync PRs and issues',
    icon: 'logo-github',
    iconColor: colors.label.github,
    iconBg: `${colors.label.github}26`,
    available: true,
  },
  {
    provider: IntegrationProvider.GoogleCalendar,
    name: 'Google Calendar',
    description: 'Sync events and meetings',
    icon: 'calendar-outline',
    iconColor: colors.label.calendar,
    iconBg: `${colors.label.calendar}26`,
    available: true,
  },
  {
    provider: IntegrationProvider.Jira,
    name: 'Jira',
    description: 'Import tickets and sprints',
    icon: 'albums-outline',
    iconColor: colors.label.jira,
    iconBg: `${colors.label.jira}26`,
    available: false,
  },
  {
    provider: IntegrationProvider.Slack,
    name: 'Slack',
    description: 'Get notifications and updates',
    icon: 'chatbubbles-outline',
    iconColor: colors.label.slack,
    iconBg: `${colors.label.slack}26`,
    available: false,
  },
  {
    provider: IntegrationProvider.Notion,
    name: 'Notion',
    description: 'Import pages and databases',
    icon: 'document-text-outline',
    iconColor: colors.label.notion,
    iconBg: `${colors.label.notion}26`,
    available: false,
  },
  {
    provider: IntegrationProvider.Linear,
    name: 'Linear',
    description: 'Sync issues and projects',
    icon: 'git-branch-outline',
    iconColor: colors.label.linear,
    iconBg: `${colors.label.linear}26`,
    available: false,
  },
];

function getProviderConfig(provider: IntegrationProvider): ProviderConfig | undefined {
  return providerConfigs.find(c => c.provider === provider);
}

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
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const { error: showError, success, confirm } = useAlert();

  const handleBack = () => {
    router.back();
  };

  const handleConnect = useCallback(
    async (provider: IntegrationProvider) => {
      setShowProviderPicker(false);

      try {
        setConnectingProvider(provider);

        const redirectUri = Linking.createURL('integrations/callback');
        const { authUrl } = await connectMutation.mutateAsync({ provider, redirectUri });

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

        if (result.type === 'success' && result.url) {
          const { queryParams } = Linking.parse(result.url);

          if (queryParams?.error) {
            showError('Connection Failed', queryParams.error as string);
          } else {
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
    },
    [connectMutation, queryClient, showError]
  );

  const handleDisconnect = useCallback(
    (integration: IntegrationDto) => {
      confirm(
        `Disconnect ${integration.name}`,
        `Are you sure you want to disconnect "${integration.name}"? Synced items will remain in your inbox.`,
        async () => {
          try {
            await disconnectMutation.mutateAsync(integration.id);
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to disconnect';
            showError('Error', message);
          }
        },
        'Disconnect'
      );
    },
    [disconnectMutation, showError, confirm]
  );

  const handleSync = useCallback(
    async (integration: IntegrationDto) => {
      try {
        setSyncingId(integration.id);
        const result = await syncMutation.mutateAsync(integration.id);
        const synced = (result as { itemsSynced?: number })?.itemsSynced ?? 0;
        success('Sync Complete', `${synced} new items synced.`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to sync';
        showError('Sync Failed', message);
      } finally {
        setSyncingId(null);
      }
    },
    [syncMutation, showError, success]
  );

  const connectedIntegrations = integrations ?? [];
  const hasIntegrations = connectedIntegrations.length > 0;

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
        <TouchableOpacity
          onPress={() => setShowProviderPicker(true)}
          className="flex-row items-center gap-2 px-4 py-2 rounded-xl"
          style={{ backgroundColor: colors.indigo[500] }}
          disabled={connectingProvider !== null}
        >
          {connectingProvider ? (
            <ActivityIndicator size={14} color={colors.white} />
          ) : (
            <>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text className="text-sm font-medium" style={{ color: colors.white }}>
                Add
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text className="text-sm mb-4" style={{ color: themeColors.textMuted }}>
          Connect your tools to automatically import tasks and sync your workflow. You can add
          multiple accounts per service.
        </Text>

        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color={colors.indigo[500]} />
          </View>
        ) : !hasIntegrations ? (
          <View className="py-12 items-center gap-3">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: `${colors.indigo[500]}15` }}
            >
              <Ionicons name="link-outline" size={32} color={colors.indigo[500]} />
            </View>
            <Text className="text-base font-semibold" style={{ color: themeColors.text }}>
              No integrations yet
            </Text>
            <Text className="text-sm text-center px-8" style={{ color: themeColors.textMuted }}>
              Tap &ldquo;Add&rdquo; to connect GitHub, Google Calendar, and more.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {connectedIntegrations.map(integration => {
              const config = getProviderConfig(integration.provider);
              const isSyncing = syncingId === integration.id;

              return (
                <Card key={integration.id} variant="default" padding="md">
                  <View className="flex-row items-center gap-3">
                    {/* Provider icon */}
                    <View
                      className="w-11 h-11 rounded-xl items-center justify-center"
                      style={{ backgroundColor: config?.iconBg ?? `${colors.indigo[500]}26` }}
                    >
                      <Ionicons
                        name={config?.icon ?? 'link-outline'}
                        size={22}
                        color={config?.iconColor ?? colors.indigo[500]}
                      />
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className="font-semibold text-[15px]"
                          style={{ color: themeColors.text }}
                          numberOfLines={1}
                        >
                          {integration.name}
                        </Text>
                        <View
                          className="px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${colors.status.done}20` }}
                        >
                          <Text
                            className="text-[9px] font-semibold"
                            style={{ color: colors.status.done }}
                          >
                            Connected
                          </Text>
                        </View>
                      </View>
                      {integration.externalUsername && (
                        <Text
                          className="text-xs mt-0.5"
                          style={{ color: themeColors.textMuted }}
                          numberOfLines={1}
                        >
                          {integration.externalUsername}
                        </Text>
                      )}
                      {integration.lastSyncAt && (
                        <Text className="text-xs mt-0.5" style={{ color: themeColors.textMuted }}>
                          Synced {formatRelativeTime(integration.lastSyncAt)}
                        </Text>
                      )}
                      {integration.lastSyncError && (
                        <Text
                          className="text-xs mt-0.5"
                          style={{ color: colors.status.urgent }}
                          numberOfLines={1}
                        >
                          Error: {integration.lastSyncError}
                        </Text>
                      )}
                    </View>

                    {/* Actions */}
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleSync(integration)}
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
                      <TouchableOpacity
                        onPress={() => handleDisconnect(integration)}
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: themeColors.input }}
                      >
                        <Ionicons
                          name="close-outline"
                          size={16}
                          color={themeColors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Provider Picker Bottom Sheet */}
      <Modal
        visible={showProviderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProviderPicker(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => setShowProviderPicker(false)}
        />
        <View
          className="rounded-t-3xl pb-8"
          style={{ backgroundColor: themeColors.card }}
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-2">
            <View
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: themeColors.border }}
            />
          </View>

          <Text
            className="text-lg font-bold px-5 pb-4"
            style={{ color: themeColors.text }}
          >
            Add Integration
          </Text>

          <FlatList
            data={providerConfigs}
            keyExtractor={item => item.provider}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => item.available && handleConnect(item.provider)}
                disabled={!item.available}
                className="flex-row items-center gap-4 px-5 py-3.5"
                style={{ opacity: item.available ? 1 : 0.45 }}
                activeOpacity={0.6}
              >
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center"
                  style={{ backgroundColor: item.iconBg }}
                >
                  <Ionicons name={item.icon} size={22} color={item.iconColor} />
                </View>
                <View className="flex-1">
                  <Text
                    className="font-semibold text-[15px]"
                    style={{ color: themeColors.text }}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-xs" style={{ color: themeColors.textMuted }}>
                    {item.description}
                  </Text>
                </View>
                {item.available ? (
                  <Ionicons name="add-circle-outline" size={22} color={colors.indigo[500]} />
                ) : (
                  <Text className="text-xs" style={{ color: themeColors.textMuted }}>
                    Coming Soon
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />

          {/* Cancel button */}
          <View className="px-5 pt-2">
            <TouchableOpacity
              onPress={() => setShowProviderPicker(false)}
              className="py-3 rounded-xl items-center"
              style={{ backgroundColor: themeColors.input }}
            >
              <Text className="font-medium" style={{ color: themeColors.text }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
