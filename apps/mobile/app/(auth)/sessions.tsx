import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, SessionDto } from '../../services/authService';
import { AuthGuard } from '../../components/AuthGuard';
import { useAlert } from '../../components/AlertProvider';

export default function SessionsScreen() {
  return (
    <AuthGuard>
      <SessionsContent />
    </AuthGuard>
  );
}

function SessionsContent() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const { confirm } = useAlert();

  const {
    data: sessions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => authService.getSessions(),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => authService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: (exceptSessionId?: string) => authService.revokeAllSessions(exceptSessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleBack = () => {
    router.back();
  };

  const handleRevokeSession = (session: SessionDto) => {
    confirm(
      'Revoke Session',
      `Are you sure you want to sign out from "${session.deviceName || 'Unknown device'}"?`,
      () => revokeSessionMutation.mutate(session.id),
      'Sign Out'
    );
  };

  const handleRevokeAll = () => {
    const currentSession = sessions?.find(s => s.isCurrent);
    confirm(
      'Sign Out All Devices',
      'This will sign out all other devices. You will remain signed in on this device.',
      () => revokeAllMutation.mutate(currentSession?.id),
      'Sign Out All'
    );
  };

  const getDeviceIcon = (deviceType: string | null): keyof typeof Ionicons.glyphMap => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return 'phone-portrait-outline';
      case 'desktop':
        return 'laptop-outline';
      case 'web':
        return 'globe-outline';
      default:
        return 'hardware-chip-outline';
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const otherSessions = sessions?.filter(s => !s.isCurrent) || [];

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
          Active Sessions
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.indigo[500]} />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.indigo[500]}
            />
          }
        >
          {/* Info Text */}
          <Text className="text-sm mb-4" style={{ color: themeColors.textMuted }}>
            {
              "These are the devices that are currently signed in to your account. You can sign out any session that you don't recognize."
            }
          </Text>

          {/* Current Session */}
          {sessions
            ?.filter(s => s.isCurrent)
            .map(session => (
              <View key={session.id} className="mb-4">
                <Text
                  className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
                  style={{ color: themeColors.textMuted }}
                >
                  This Device
                </Text>
                <Card variant="default" padding="none">
                  <View className="p-4 flex-row items-center gap-3">
                    <View
                      className="w-11 h-11 rounded-xl items-center justify-center"
                      style={{ backgroundColor: `${colors.indigo[500]}20` }}
                    >
                      <Ionicons
                        name={getDeviceIcon(session.deviceType)}
                        size={22}
                        color={colors.indigo[500]}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-medium" style={{ color: themeColors.text }}>
                          {session.deviceName || 'Unknown device'}
                        </Text>
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${colors.status.done}20` }}
                        >
                          <Text
                            className="text-xs font-medium"
                            style={{ color: colors.status.done }}
                          >
                            Current
                          </Text>
                        </View>
                      </View>
                      {session.deviceOs && (
                        <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                          {session.deviceOs}
                        </Text>
                      )}
                      <Text className="text-xs mt-1" style={{ color: themeColors.textFaint }}>
                        Active now {session.ipAddress && `• ${session.ipAddress}`}
                      </Text>
                    </View>
                  </View>
                </Card>
              </View>
            ))}

          {/* Other Sessions */}
          {otherSessions.length > 0 && (
            <View className="mb-4">
              <Text
                className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
                style={{ color: themeColors.textMuted }}
              >
                Other Sessions ({otherSessions.length})
              </Text>
              <Card variant="default" padding="none">
                {otherSessions.map((session, index) => (
                  <View
                    key={session.id}
                    className="p-4 flex-row items-center gap-3"
                    style={
                      index > 0 ? { borderTopWidth: 1, borderColor: themeColors.border } : undefined
                    }
                  >
                    <View
                      className="w-11 h-11 rounded-xl items-center justify-center"
                      style={{ backgroundColor: themeColors.input }}
                    >
                      <Ionicons
                        name={getDeviceIcon(session.deviceType)}
                        size={22}
                        color={themeColors.textMuted}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium" style={{ color: themeColors.text }}>
                        {session.deviceName || 'Unknown device'}
                      </Text>
                      {session.deviceOs && (
                        <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                          {session.deviceOs}
                        </Text>
                      )}
                      <Text className="text-xs mt-1" style={{ color: themeColors.textFaint }}>
                        {formatRelativeTime(session.lastActiveAt)}{' '}
                        {session.ipAddress && `• ${session.ipAddress}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRevokeSession(session)}
                      disabled={revokeSessionMutation.isPending}
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${colors.status.urgent}15` }}
                    >
                      <Ionicons name="log-out-outline" size={18} color={colors.status.urgent} />
                    </TouchableOpacity>
                  </View>
                ))}
              </Card>
            </View>
          )}

          {/* No other sessions message */}
          {otherSessions.length === 0 && (
            <View className="mb-4">
              <Text
                className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
                style={{ color: themeColors.textMuted }}
              >
                Other Sessions
              </Text>
              <Card variant="default" padding="md">
                <View className="items-center py-4">
                  <Ionicons name="checkmark-circle-outline" size={40} color={colors.status.done} />
                  <Text
                    className="text-center mt-3 font-medium"
                    style={{ color: themeColors.text }}
                  >
                    No other active sessions
                  </Text>
                  <Text
                    className="text-center text-sm mt-1"
                    style={{ color: themeColors.textMuted }}
                  >
                    {"You're only signed in on this device"}
                  </Text>
                </View>
              </Card>
            </View>
          )}

          {/* Sign Out All Button */}
          {otherSessions.length > 0 && (
            <TouchableOpacity
              className="mt-2 p-4 rounded-2xl items-center"
              style={{ backgroundColor: themeColors.card }}
              onPress={handleRevokeAll}
              disabled={revokeAllMutation.isPending}
            >
              {revokeAllMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.status.urgent} />
              ) : (
                <Text className="font-medium" style={{ color: colors.status.urgent }}>
                  Sign Out All Other Devices
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
