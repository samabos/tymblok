import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme, Input } from '@tymblok/ui';
import { spacing, borderRadius, typography, colors } from '@tymblok/theme';
import { AuthGuard } from '../../components/AuthGuard';
import { useAlert } from '../../components/AlertProvider';
import { useUpdateInboxItem, useCategories } from '../../services/apiHooks';
import { InboxPriority } from '@tymblok/api-client';

export default function EditInboxItemScreen() {
  return (
    <AuthGuard>
      <EditInboxItemContent />
    </AuthGuard>
  );
}

function EditInboxItemContent() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    description: string;
    priority: string;
  }>();

  const [title, setTitle] = useState(params.title || '');
  const [description, setDescription] = useState(params.description || '');
  const [startTime, setStartTime] = useState('09:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState(60);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [priority, setPriority] = useState<InboxPriority>(
    (params.priority as InboxPriority) || InboxPriority.Medium
  );

  const { error: showError } = useAlert();
  const updateMutation = useUpdateInboxItem();
  const { data: allCategories } = useCategories();
  const categories = allCategories?.filter(c => c.isSystem);
  const effectiveCategoryId = selectedCategoryId ?? categories?.[0]?.id ?? null;

  const timeToDate = (time: string): Date => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const formatTimeDisplay = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const handleTimeChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selectedDate) {
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
    }
  };

  const durations = [
    { value: 15, label: '15m' },
    { value: 30, label: '30m' },
    { value: 60, label: '1h' },
    { value: 90, label: '1.5h' },
    { value: 120, label: '2h' },
  ];

  const priorities: Array<{ key: InboxPriority; label: string; color: string }> = [
    { key: InboxPriority.Low, label: 'Low', color: colors.priority.low },
    { key: InboxPriority.Medium, label: 'Medium', color: colors.priority.medium },
    { key: InboxPriority.High, label: 'High', color: colors.priority.high },
    { key: InboxPriority.Critical, label: 'Critical', color: colors.priority.critical },
  ];

  const handleSave = async () => {
    if (!title.trim()) {
      showError('Error', 'Please enter a title');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: params.id,
        data: {
          title: title.trim(),
          description: description.trim() || null,
          priority,
        },
      });

      router.back();
    } catch {
      showError('Error', 'Failed to update inbox item. Please try again.');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing[5],
          paddingVertical: spacing[4],
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
        }}
      >
        <Pressable
          onPress={handleCancel}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: themeColors.input,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={20} color={themeColors.text} />
        </Pressable>

        <Text
          style={{
            fontSize: typography.sizes.lg,
            fontWeight: '600',
            color: themeColors.text,
          }}
        >
          Edit Inbox Item
        </Text>

        <Pressable
          onPress={handleSave}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.indigo[500],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="checkmark" size={20} color={colors.white} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing[5] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={{ marginBottom: spacing[5] }}>
          <Text
            style={{
              fontSize: typography.sizes.sm,
              color: themeColors.textMuted,
              marginBottom: spacing[2],
            }}
          >
            Title
          </Text>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            autoFocus
          />
        </View>

        {/* Description */}
        <View style={{ marginBottom: spacing[5] }}>
          <Text
            style={{
              fontSize: typography.sizes.sm,
              color: themeColors.textMuted,
              marginBottom: spacing[2],
            }}
          >
            Description (optional)
          </Text>
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Add more details..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Start Time */}
        <View style={{ marginBottom: spacing[5] }}>
          <Text
            style={{
              fontSize: typography.sizes.sm,
              color: themeColors.textMuted,
              marginBottom: spacing[2],
            }}
          >
            Start Time
          </Text>
          {Platform.OS === 'android' && (
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={{
                height: 48,
                borderRadius: borderRadius.xl,
                backgroundColor: themeColors.input,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: typography.sizes.lg,
                  fontWeight: '600',
                  color: themeColors.text,
                }}
              >
                {formatTimeDisplay(startTime)}
              </Text>
            </Pressable>
          )}
          {(Platform.OS === 'ios' || showTimePicker) && (
            <DateTimePicker
              value={timeToDate(startTime)}
              mode="time"
              is24Hour={false}
              minuteInterval={5}
              onChange={handleTimeChange}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant={themeColors.bg === '#0f172a' || themeColors.bg === '#1e293b' ? 'dark' : 'light'}
            />
          )}
        </View>

        {/* Duration */}
        <View style={{ marginBottom: spacing[5] }}>
          <Text
            style={{
              fontSize: typography.sizes.sm,
              color: themeColors.textMuted,
              marginBottom: spacing[2],
            }}
          >
            Duration
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            {durations.map(d => (
              <Pressable
                key={d.value}
                onPress={() => setDuration(d.value)}
                style={{
                  flex: 1,
                  paddingVertical: spacing[2.5],
                  borderRadius: borderRadius.lg,
                  alignItems: 'center',
                  backgroundColor: duration === d.value ? colors.indigo[500] : themeColors.input,
                }}
              >
                <Text
                  style={{
                    fontSize: typography.sizes.sm,
                    fontWeight: '500',
                    color: duration === d.value ? colors.white : themeColors.text,
                  }}
                >
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={{ marginBottom: spacing[5] }}>
          <Text
            style={{
              fontSize: typography.sizes.sm,
              color: themeColors.textMuted,
              marginBottom: spacing[2],
            }}
          >
            Priority
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {priorities.map(p => (
              <Pressable
                key={p.key}
                onPress={() => setPriority(p.key)}
                style={{
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[1.5],
                  borderRadius: borderRadius.lg,
                  borderWidth: 1.5,
                  borderColor: priority === p.key ? p.color : themeColors.border,
                  backgroundColor: priority === p.key ? p.color + '20' : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: typography.sizes.sm,
                    fontWeight: '500',
                    color: priority === p.key ? p.color : themeColors.text,
                  }}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Category */}
        {categories && categories.length > 0 && (
          <View style={{ marginBottom: spacing[5] }}>
            <Text
              style={{
                fontSize: typography.sizes.sm,
                color: themeColors.textMuted,
                marginBottom: spacing[2],
              }}
            >
              Category
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
              {categories.map(cat => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  style={{
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[1.5],
                    borderRadius: borderRadius.lg,
                    borderWidth: 1.5,
                    borderColor: effectiveCategoryId === cat.id ? colors.indigo[500] : themeColors.border,
                    backgroundColor: effectiveCategoryId === cat.id ? colors.indigo[500] + '20' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: typography.sizes.sm,
                      fontWeight: '500',
                      color: effectiveCategoryId === cat.id ? colors.indigo[500] : themeColors.text,
                    }}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
