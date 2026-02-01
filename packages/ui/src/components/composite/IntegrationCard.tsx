import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, borderRadius, typography, getLabelColor } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';

export type IntegrationType = 'github' | 'jira' | 'google-calendar' | 'slack';

export interface IntegrationCardProps {
  id: string;
  type: IntegrationType;
  name: string;
  description: string;
  connected: boolean;
  lastSync?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSync?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function IntegrationCard({
  type,
  name,
  description,
  connected,
  lastSync,
  onConnect,
  onDisconnect,
  onSync,
  icon,
  style,
}: IntegrationCardProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const integrationColor = getIntegrationColor(type);

  return (
    <Card
      variant="outlined"
      padding="md"
      style={[styles.container, { borderColor: themeColors.border }, style]}
    >
      <View style={styles.header}>
        <View style={styles.iconRow}>
          {icon ? (
            <View
              style={[styles.iconContainer, { backgroundColor: integrationColor + '20' }]}
            >
              {icon}
            </View>
          ) : (
            <View
              style={[styles.iconContainer, { backgroundColor: integrationColor + '20' }]}
            >
              <Text style={styles.iconEmoji}>{getIntegrationEmoji(type)}</Text>
            </View>
          )}

          <View style={styles.titleContainer}>
            <Text style={[styles.name, { color: themeColors.text }]}>{name}</Text>
            {connected && (
              <Badge
                variant="done"
                size="sm"
                label="Connected"
                style={{ marginLeft: spacing[2] }}
              />
            )}
          </View>
        </View>

        <Text style={[styles.description, { color: themeColors.textMuted }]}>
          {description}
        </Text>
      </View>

      {connected && lastSync && (
        <Text style={[styles.lastSync, { color: themeColors.textFaint }]}>
          Last synced: {lastSync}
        </Text>
      )}

      <View style={styles.actions}>
        {connected ? (
          <>
            {onSync && (
              <Button
                variant="secondary"
                size="sm"
                onPress={onSync}
                style={{ marginRight: spacing[2] }}
              >
                Sync Now
              </Button>
            )}
            {onDisconnect && (
              <Button variant="danger" size="sm" onPress={onDisconnect}>
                Disconnect
              </Button>
            )}
          </>
        ) : (
          onConnect && (
            <Button variant="primary" size="sm" onPress={onConnect}>
              Connect
            </Button>
          )
        )}
      </View>
    </Card>
  );
}

function getIntegrationColor(type: IntegrationType): string {
  // Use centralized getLabelColor for consistency
  return getLabelColor(type);
}

function getIntegrationEmoji(type: IntegrationType): string {
  const emojis: Record<IntegrationType, string> = {
    github: '🐙',
    jira: '🔵',
    'google-calendar': '📅',
    slack: '💬',
  };
  return emojis[type] || '🔗';
}

// API Key card variant
export interface ApiKeyCardProps {
  apiKey: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ApiKeyCard({
  apiKey,
  onCopy,
  onRegenerate,
  style,
}: ApiKeyCardProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const maskedKey = `${apiKey.slice(0, 6)}••••••••`;

  return (
    <Card variant="outlined" padding="md" style={style}>
      <Text style={[styles.apiKeyLabel, { color: themeColors.textMuted }]}>
        API Key
      </Text>

      <View style={styles.apiKeyRow}>
        <View
          style={[styles.apiKeyContainer, { backgroundColor: themeColors.input }]}
        >
          <Text
            style={[
              styles.apiKeyText,
              { color: themeColors.text, fontFamily: typography.fonts.mono },
            ]}
          >
            {maskedKey}
          </Text>
        </View>

        {onCopy && (
          <Button
            variant="secondary"
            size="sm"
            onPress={onCopy}
            style={{ marginLeft: spacing[2] }}
          >
            Copy
          </Button>
        )}
      </View>

      {onRegenerate && (
        <Button
          variant="ghost"
          size="sm"
          onPress={onRegenerate}
          style={{ marginTop: spacing[2], alignSelf: 'flex-start' }}
        >
          Regenerate Key
        </Button>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    marginBottom: spacing[3],
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  iconEmoji: {
    fontSize: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  description: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  lastSync: {
    fontSize: typography.sizes.xs,
    marginBottom: spacing[3],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  // API Key styles
  apiKeyLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[2],
  },
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apiKeyContainer: {
    flex: 1,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
  },
  apiKeyText: {
    fontSize: typography.sizes.sm,
  },
});
