import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme, Input } from '@tymblok/ui';
import { spacing, typography, colors } from '@tymblok/theme';
import { AuthGuard } from '../../components/AuthGuard';
import { useAlert } from '../../components/AlertProvider';
import {
  useBlock,
  useUpdateBlock,
  useStartBlock,
  usePauseBlock,
  useResumeBlock,
  useCompleteBlock,
  useDeleteBlock,
  useCategories,
} from '../../services/apiHooks';
import { TimerState } from '@tymblok/api-client';

export default function TaskDetailScreen() {
  return (
    <AuthGuard>
      <TaskDetailContent />
    </AuthGuard>
  );
}

function TaskDetailContent() {
  const { theme, isDark } = useTheme();
  const themeColors = theme.colors;
  const params = useLocalSearchParams<{ id: string }>();

  const { data: task, isLoading, error } = useBlock(params.id!);

  const { error: showError, confirm } = useAlert();
  const updateMutation = useUpdateBlock();
  const startMutation = useStartBlock();
  const pauseMutation = usePauseBlock();
  const resumeMutation = useResumeBlock();
  const completeMutation = useCompleteBlock();
  const deleteMutation = useDeleteBlock();

  const { data: categories } = useCategories();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState('09:00');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  const [initialized, setInitialized] = useState(false);

  // Only sync from server on initial load — not on every refetch,
  // otherwise TanStack Query refetches overwrite user edits
  useEffect(() => {
    if (task && !initialized) {
      setTitle(task.title);
      setSubtitle(task.subtitle || '');
      setDuration(task.durationMinutes);
      setStartTime(task.startTime);
      setSelectedCategoryId(task.categoryId);
      setInitialized(true);
    }
  }, [task, initialized]);

  const elapsed = (() => {
    if (!task) return 0;
    const base = task.elapsedSeconds || 0;
    if (task.timerState === TimerState.Running) {
      const resumedAt = task.resumedAt || task.startedAt;
      if (resumedAt) {
        const currentRunSeconds = Math.floor((Date.now() - new Date(resumedAt).getTime()) / 1000);
        return base + Math.max(0, currentRunSeconds);
      }
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })();

  const durations = [
    { value: 15, label: '15m' },
    { value: 30, label: '30m' },
    { value: 60, label: '1h' },
    { value: 90, label: '1.5h' },
    { value: 120, label: '2h' },
  ];

  const formatElapsed = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (h > 0) return `${h}:${pad(m)}`;
    return `${m}m`;
  };

  // Build a Date from the startTime string for the picker
  const timeDate = (() => {
    const [h, m] = startTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  })();

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

  const handleSave = async () => {
    if (!task) return;
    try {
      await updateMutation.mutateAsync({
        id: task.id,
        data: {
          title,
          subtitle: subtitle || undefined,
          durationMinutes: duration,
          startTime,
          categoryId: selectedCategoryId,
        },
      });
      router.back();
    } catch {
      showError('Error', 'Failed to save task');
    }
  };

  const handleStart = () => {
    if (task) startMutation.mutate(task.id);
  };
  const handlePause = () => {
    if (task) pauseMutation.mutate(task.id);
  };
  const handleResume = () => {
    if (task) resumeMutation.mutate(task.id);
  };
  const handleComplete = () => {
    if (task) completeMutation.mutate(task.id);
  };

  const handleDelete = () => {
    if (!task) return;
    confirm(
      'Delete Task',
      'Are you sure you want to delete this task?',
      async () => {
        try {
          await deleteMutation.mutateAsync(task.id);
          router.back();
        } catch {
          showError('Error', 'Failed to delete task');
        }
      },
      'Delete'
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.indigo[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[5] }}
        >
          <Ionicons name="alert-circle-outline" size={48} color={colors.status.urgent} />
          <Text style={{ color: themeColors.text, marginTop: 16, marginBottom: spacing[4] }}>
            Failed to load task
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: colors.indigo[500],
            }}
          >
            <Text style={{ color: colors.white, fontWeight: '500' }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isRunning = task.timerState === TimerState.Running;
  const isPaused = task.timerState === TimerState.Paused;
  const isCompleted = task.timerState === TimerState.Completed || task.isCompleted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing[5],
          paddingVertical: spacing[3],
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: themeColors.bgSubtle,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={20} color={themeColors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: typography.sizes.sm, color: themeColors.textMuted }}>
            {task.startTime} – {task.endTime}
          </Text>
        </View>
        <Pressable
          onPress={handleDelete}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: themeColors.bgSubtle,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.status.urgent} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Card */}
        <View
          style={{
            alignItems: 'center',
            paddingVertical: spacing[6],
            marginBottom: spacing[5],
            backgroundColor: themeColors.card,
            borderRadius: 20,
            borderWidth: isRunning ? 2 : isDark ? 1 : 0,
            borderColor: isRunning ? colors.indigo[500] : themeColors.border,
            ...(isDark
              ? {}
              : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isRunning ? 0.12 : 0.08,
                  shadowRadius: isRunning ? 16 : 12,
                  elevation: isRunning ? 6 : 3,
                }),
          }}
        >
          <Text
            style={{
              fontSize: 48,
              fontWeight: '200',
              fontFamily: typography.fonts.mono,
              color: isRunning ? colors.indigo[500] : themeColors.text,
              letterSpacing: 2,
            }}
          >
            {formatElapsed(elapsed)}
          </Text>
          <Text
            style={{
              fontSize: typography.sizes.xs,
              fontWeight: '600',
              color: isRunning
                ? colors.indigo[500]
                : isPaused
                  ? colors.status.urgent
                  : themeColors.textMuted,
              marginTop: spacing[2],
              letterSpacing: 1,
            }}
          >
            {isCompleted
              ? 'COMPLETED'
              : isRunning
                ? 'RUNNING'
                : isPaused
                  ? 'PAUSED'
                  : 'NOT STARTED'}
          </Text>

          {!isCompleted && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[4],
                marginTop: spacing[5],
              }}
            >
              {isRunning ? (
                <Pressable
                  onPress={handlePause}
                  disabled={pauseMutation.isPending}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.label.focus,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="pause" size={20} color={colors.white} />
                </Pressable>
              ) : (
                <Pressable
                  onPress={isPaused ? handleResume : handleStart}
                  disabled={startMutation.isPending || resumeMutation.isPending}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.indigo[500],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="play" size={20} color={colors.white} />
                </Pressable>
              )}
              {(isRunning || isPaused) && (
                <Pressable
                  onPress={handleComplete}
                  disabled={completeMutation.isPending}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.status.done,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="checkmark" size={20} color={colors.white} />
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: typography.sizes.xs,
            fontWeight: '600',
            color: themeColors.textMuted,
            marginBottom: spacing[2],
            letterSpacing: 0.5,
          }}
        >
          TITLE
        </Text>
        <Input value={title} onChangeText={setTitle} placeholder="Task title" />

        {/* Description */}
        <Text
          style={{
            fontSize: typography.sizes.xs,
            fontWeight: '600',
            color: themeColors.textMuted,
            marginBottom: spacing[2],
            marginTop: spacing[5],
            letterSpacing: 0.5,
          }}
        >
          DESCRIPTION
        </Text>
        <View style={{ marginBottom: spacing[5] }}>
          <Input value={subtitle} onChangeText={setSubtitle} placeholder="Add description..." />
        </View>

        {/* Start Time */}
        <Text
          style={{
            fontSize: typography.sizes.xs,
            fontWeight: '600',
            color: themeColors.textMuted,
            marginBottom: spacing[2],
            letterSpacing: 0.5,
          }}
        >
          START TIME
        </Text>
        <View style={{ marginBottom: spacing[5] }}>
          {Platform.OS === 'android' && (
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={{
                height: 48,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: themeColors.card,
                borderWidth: isDark ? 1 : 0,
                borderColor: themeColors.border,
                ...(isDark
                  ? {}
                  : {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 2,
                    }),
              }}
            >
              <Text
                style={{
                  fontSize: typography.sizes.lg,
                  fontWeight: '600',
                  fontFamily: typography.fonts.mono,
                  color: themeColors.text,
                }}
              >
                {formatTimeDisplay(startTime)}
              </Text>
            </Pressable>
          )}
          {(Platform.OS === 'ios' || showTimePicker) && (
            <DateTimePicker
              value={timeDate}
              mode="time"
              is24Hour={false}
              minuteInterval={5}
              onChange={handleTimeChange}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant={isDark ? 'dark' : 'light'}
            />
          )}
        </View>

        {/* Duration */}
        <Text
          style={{
            fontSize: typography.sizes.xs,
            fontWeight: '600',
            color: themeColors.textMuted,
            marginBottom: spacing[2],
            letterSpacing: 0.5,
          }}
        >
          DURATION
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing[2], marginBottom: spacing[5] }}>
          {durations.map(d => (
            <Pressable
              key={d.value}
              onPress={() => setDuration(d.value)}
              style={{
                flex: 1,
                paddingVertical: spacing[3],
                borderRadius: 10,
                alignItems: 'center' as const,
                backgroundColor: duration === d.value ? colors.indigo[500] : themeColors.card,
                borderWidth: duration === d.value ? 0 : isDark ? 1 : 0,
                borderColor: themeColors.border,
                ...(isDark || duration === d.value
                  ? {}
                  : {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 6,
                      elevation: 2,
                    }),
              }}
            >
              <Text
                style={{
                  fontSize: typography.sizes.sm,
                  fontWeight: '600',
                  color: duration === d.value ? colors.white : themeColors.text,
                }}
              >
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Category */}
        <Text
          style={{
            fontSize: typography.sizes.xs,
            fontWeight: '600',
            color: themeColors.textMuted,
            marginBottom: spacing[2],
            letterSpacing: 0.5,
          }}
        >
          CATEGORY
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
          {categories?.filter(c => c.isSystem).map(cat => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategoryId(cat.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[1.5],
                borderRadius: 10,
                borderWidth: 1.5,
                backgroundColor:
                  selectedCategoryId === cat.id ? colors.indigo[500] + '20' : 'transparent',
                borderColor:
                  selectedCategoryId === cat.id ? colors.indigo[500] : themeColors.border,
              }}
            >
              <Text
                style={{
                  fontSize: typography.sizes.sm,
                  fontWeight: '500',
                  color:
                    selectedCategoryId === cat.id ? colors.indigo[500] : themeColors.text,
                }}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Save */}
      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingVertical: spacing[4],
          borderTopWidth: isDark ? 1 : 0,
          borderTopColor: themeColors.border,
          ...(isDark
            ? {}
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 4,
              }),
        }}
      >
        <Pressable
          onPress={handleSave}
          disabled={updateMutation.isPending}
          style={{
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center' as const,
            backgroundColor: colors.indigo[500],
          }}
        >
          <Text style={{ color: colors.white, fontWeight: '600', fontSize: typography.sizes.base }}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
