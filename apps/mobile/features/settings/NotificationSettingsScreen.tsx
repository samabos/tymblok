import { useState } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useUpdateSettings } from '../../services/apiHooks';
import { useTheme, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../components/AlertProvider';

const REMINDER_OPTIONS = [
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
];

export default function NotificationSettingsScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const { error: showError } = useAlert();
  const { mutateAsync: updateSettings, isPending } = useUpdateSettings();

  const [blockReminder, setBlockReminder] = useState(user?.notification_block_reminder ?? true);
  const [reminderMinutes, setReminderMinutes] = useState(user?.notification_reminder_minutes ?? 5);
  const [dailySummary, setDailySummary] = useState(user?.notification_daily_summary ?? true);

  const hasChanges =
    blockReminder !== (user?.notification_block_reminder ?? true) ||
    reminderMinutes !== (user?.notification_reminder_minutes ?? 5) ||
    dailySummary !== (user?.notification_daily_summary ?? true);

  const handleSave = async () => {
    try {
      await updateSettings({
        notificationBlockReminder: blockReminder,
        notificationReminderMinutes: reminderMinutes,
        notificationDailySummary: dailySummary,
      });
      updateUser({
        notification_block_reminder: blockReminder,
        notification_reminder_minutes: reminderMinutes,
        notification_daily_summary: dailySummary,
      });
      router.back();
    } catch {
      showError('Error', 'Failed to save notification settings. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold" style={{ color: themeColors.text }}>
            Notifications
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: themeColors.textMuted }}>
            Configure push notifications & reminders
          </Text>
        </View>
      </View>

      <View className="flex-1 px-5 pt-4">
        {/* Task Reminders */}
        <Card variant="default" padding="none">
          <View className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: themeColors.input }}
              >
                <Ionicons name="alarm-outline" size={18} color={themeColors.textMuted} />
              </View>
              <View className="flex-1">
                <Text className="font-medium" style={{ color: themeColors.text }}>
                  Task Reminders
                </Text>
                <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                  Get notified before a task starts
                </Text>
              </View>
            </View>
            <Switch
              value={blockReminder}
              onValueChange={setBlockReminder}
              trackColor={{ false: themeColors.input, true: colors.indigo[500] }}
              thumbColor={colors.white}
            />
          </View>

          {/* Reminder Time - only show when enabled */}
          {blockReminder && (
            <View style={{ borderTopWidth: 1, borderColor: themeColors.border }}>
              <View className="p-4">
                <Text className="font-medium mb-3" style={{ color: themeColors.text }}>
                  Remind me before
                </Text>
                <View className="flex-row gap-2">
                  {REMINDER_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setReminderMinutes(option.value)}
                      className="flex-1 py-2.5 rounded-xl items-center"
                      style={{
                        backgroundColor:
                          reminderMinutes === option.value ? colors.indigo[500] : themeColors.input,
                      }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{
                          color:
                            reminderMinutes === option.value ? colors.white : themeColors.textMuted,
                        }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* Daily Summary */}
        <View className="mt-4">
          <Card variant="default" padding="none">
            <View className="p-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: themeColors.input }}
                >
                  <Ionicons name="today-outline" size={18} color={themeColors.textMuted} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium" style={{ color: themeColors.text }}>
                    Daily Summary
                  </Text>
                  <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                    Receive a summary of your day each morning
                  </Text>
                </View>
              </View>
              <Switch
                value={dailySummary}
                onValueChange={setDailySummary}
                trackColor={{ false: themeColors.input, true: colors.indigo[500] }}
                thumbColor={colors.white}
              />
            </View>
          </Card>
        </View>

        {/* Save Button */}
        {hasChanges && (
          <TouchableOpacity
            className="mt-6 p-4 rounded-2xl items-center"
            style={{ backgroundColor: colors.indigo[500], opacity: isPending ? 0.6 : 1 }}
            onPress={handleSave}
            disabled={isPending}
          >
            <Text className="font-semibold" style={{ color: colors.white }}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
