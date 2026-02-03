import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { Ionicons } from '@expo/vector-icons';
import { AuthGuard } from '../components/AuthGuard';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  connected: boolean;
}

const initialIntegrations: Integration[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Sync PRs and issues',
    icon: 'logo-github',
    iconColor: colors.label.github,
    iconBg: `${colors.label.github}26`,
    connected: true,
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Import tickets and sprints',
    icon: 'albums-outline',
    iconColor: colors.label.jira,
    iconBg: `${colors.label.jira}26`,
    connected: true,
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync events and meetings',
    icon: 'calendar-outline',
    iconColor: colors.label.calendar,
    iconBg: `${colors.label.calendar}26`,
    connected: false,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications and updates',
    icon: 'chatbubbles-outline',
    iconColor: colors.label.slack,
    iconBg: `${colors.label.slack}26`,
    connected: false,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Import pages and databases',
    icon: 'document-text-outline',
    iconColor: colors.label.notion,
    iconBg: `${colors.label.notion}26`,
    connected: false,
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Sync issues and projects',
    icon: 'git-branch-outline',
    iconColor: colors.label.linear,
    iconBg: `${colors.label.linear}26`,
    connected: false,
  },
];

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

  const [integrations, setIntegrations] = useState(initialIntegrations);

  const handleBack = () => {
    router.back();
  };

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id
          ? { ...integration, connected: !integration.connected }
          : integration
      )
    );
    // TODO: Call API to connect/disconnect integration
    console.log('[Integrations] Toggle integration:', id);
  };

  const handleCopyApiKey = () => {
    // TODO: Copy API key to clipboard
    console.log('[Integrations] Copy API key');
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
        <Text
          className="text-xl font-bold flex-1"
          style={{ color: themeColors.text }}
        >
          Integrations
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text
          className="text-sm mb-4"
          style={{ color: themeColors.textMuted }}
        >
          Connect your tools to automatically import tasks and sync your workflow.
        </Text>

        {/* Integration List */}
        <View className="gap-3">
          {integrations.map((integration) => (
            <Card key={integration.id} variant="default" padding="md">
              <View className="flex-row items-center gap-4">
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{ backgroundColor: integration.iconBg }}
                >
                  <Ionicons
                    name={integration.icon}
                    size={24}
                    color={integration.iconColor}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="font-semibold"
                      style={{ color: themeColors.text }}
                    >
                      {integration.name}
                    </Text>
                    {integration.connected && (
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
                  <Text
                    className="text-sm"
                    style={{ color: themeColors.textMuted }}
                  >
                    {integration.description}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleIntegration(integration.id)}
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor: integration.connected
                      ? themeColors.input
                      : colors.indigo[500],
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: integration.connected
                        ? themeColors.textMuted
                        : colors.white,
                    }}
                  >
                    {integration.connected ? 'Disconnect' : 'Connect'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>

        {/* API Key Section */}
        <Card variant="default" padding="md" style={{ marginTop: 24 }}>
          <Text
            className="font-semibold mb-2"
            style={{ color: themeColors.text }}
          >
            API Key
          </Text>
          <Text
            className="text-sm mb-3"
            style={{ color: themeColors.textMuted }}
          >
            Use your API key to connect custom integrations.
          </Text>
          <View className="flex-row gap-2">
            <View
              className="flex-1 px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: themeColors.input,
                borderColor: themeColors.border,
              }}
            >
              <TextInput
                value="tb_sk_1234567890abcdef"
                editable={false}
                secureTextEntry
                style={{
                  color: themeColors.text,
                  fontFamily: 'monospace',
                  fontSize: 14,
                }}
              />
            </View>
            <TouchableOpacity
              onPress={handleCopyApiKey}
              className="px-4 py-2 rounded-lg items-center justify-center"
              style={{ backgroundColor: themeColors.input }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: themeColors.textMuted }}
              >
                Copy
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
