import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, getLabelColor } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { BottomSheet } from './BottomSheet';
import { Input } from '../primitives/Input';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';

export type TaskCategory = 'jira' | 'github' | 'meeting' | 'focus' | 'break';

export interface ApiCategory {
  id: string;
  name: string;
  color: string;
}

export interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (task: {
    title: string;
    startTime: string;
    duration: number;
    category: string;
    categoryId?: string;
  }) => void;
  initialDate?: Date;
  /** Real categories from the API. When provided, replaces the hardcoded list. */
  apiCategories?: ApiCategory[];
}

export function AddTaskModal({ visible, onClose, onSubmit, initialDate, apiCategories }: AddTaskModalProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  const [duration, setDuration] = useState(60); // minutes
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const fallbackCategories: Array<{ key: TaskCategory; label: string }> = [
    { key: 'focus', label: 'Focus' },
    { key: 'meeting', label: 'Meeting' },
    { key: 'break', label: 'Break' },
  ];

  // Resolve which category is selected
  const effectiveCategoryId = selectedCategoryId
    ?? (apiCategories?.[0]?.id || null);
  const effectiveCategoryName = apiCategories
    ? (apiCategories.find(c => c.id === effectiveCategoryId)?.name ?? 'focus')
    : (selectedCategoryId || 'focus');

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

  const durations = [
    { value: 15, label: '15m' },
    { value: 30, label: '30m' },
    { value: 60, label: '1h' },
    { value: 90, label: '1.5h' },
    { value: 120, label: '2h' },
  ];

  const handleSubmit = () => {
    if (!title.trim()) return;

    onSubmit?.({
      title: title.trim(),
      startTime,
      duration,
      category: effectiveCategoryName,
      categoryId: apiCategories ? (effectiveCategoryId ?? undefined) : undefined,
    });

    // Reset form
    setTitle('');
    setStartTime('09:00');
    setDuration(60);
    setSelectedCategoryId(null);
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setSelectedCategoryId(null);
    onClose();
  };

  const dateLabel = initialDate
    ? initialDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : null;

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={dateLabel ? `New Block \u00B7 ${dateLabel}` : 'New Time Block'} snapPoints={[70]}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Title input */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: themeColors.text }]}>What are you working on?</Text>
          <Input
            placeholder="e.g., Review pull requests"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
        </View>

        {/* Time selection */}
        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={[styles.label, { color: themeColors.text }]}>Start Time</Text>
            {Platform.OS === 'android' && (
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={[styles.timePickerButton, { backgroundColor: themeColors.input }]}
              >
                <Text style={[styles.timeText, { color: themeColors.text }]}>
                  {formatTimeDisplay(startTime)}
                </Text>
              </Pressable>
            )}
            {showTimePicker && (
              <DateTimePicker
                value={timeDate}
                mode="time"
                is24Hour={false}
                minuteInterval={5}
                onChange={handleTimeChange}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant={themeColors.bg === '#0f172a' || themeColors.bg === '#1e293b' ? 'dark' : 'light'}
              />
            )}
          </View>

          <View style={styles.timeField}>
            <Text style={[styles.label, { color: themeColors.text }]}>Duration</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.durationOptions}
            >
              {durations.map(d => (
                <Pressable
                  key={d.value}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDuration(d.value);
                  }}
                  style={[
                    styles.durationOption,
                    {
                      backgroundColor:
                        duration === d.value ? colors.indigo[600] : themeColors.input,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.durationText,
                      {
                        color: duration === d.value ? colors.white : themeColors.text,
                      },
                    ]}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Category selection */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: themeColors.text }]}>Category</Text>
          <View style={styles.categoryOptions}>
            {apiCategories ? (
              apiCategories.map(cat => (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategoryId(cat.id);
                  }}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor:
                        effectiveCategoryId === cat.id ? colors.indigo[500] + '20' : 'transparent',
                      borderColor: effectiveCategoryId === cat.id ? colors.indigo[500] : themeColors.border,
                    },
                  ]}
                >
                  <Text style={[styles.categoryLabel, { color: effectiveCategoryId === cat.id ? colors.indigo[500] : themeColors.text }]}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))
            ) : (
              fallbackCategories.map(cat => (
                <Pressable
                  key={cat.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategoryId(cat.key);
                  }}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor:
                        (selectedCategoryId || 'focus') === cat.key ? colors.indigo[600] + '20' : 'transparent',
                      borderColor: (selectedCategoryId || 'focus') === cat.key ? colors.indigo[500] : themeColors.border,
                    },
                  ]}
                >
                  <Badge variant={cat.key as any} size="sm" label={cat.label} />
                </Pressable>
              ))
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Button
            variant="secondary"
            onPress={handleClose}
            style={{ flex: 1, marginRight: spacing[2] }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmit}
            disabled={!title.trim()}
            style={{ flex: 1, marginLeft: spacing[2] }}
          >
            Add Block
          </Button>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

// Task detail modal
export interface TaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  task?: {
    id: string;
    title: string;
    subtitle?: string;
    type: TaskCategory;
    startTime: string;
    endTime: string;
    durationMinutes?: number;
    status?: 'pending' | 'in_progress' | 'completed';
    progress?: number;
    completed?: boolean;
    isNow?: boolean;
  };
  onEdit?: (taskId: string) => void;
  onComplete?: () => void;
}

export function TaskDetailModal({
  visible,
  onClose,
  task,
  onEdit,
  onComplete,
}: TaskDetailModalProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  if (!task) return null;

  const typeColor = getTypeColor(task.type);

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[50]} showHandle={false}>
      {/* Colored header */}
      <View style={[styles.detailHeader, { backgroundColor: typeColor }]}>
        <View style={styles.detailHeaderContent}>
          <Badge variant={task.type as any} size="md" label={task.type} />
          <Text style={styles.detailTitle}>{task.title}</Text>
          {task.subtitle && <Text style={styles.detailSubtitle}>{task.subtitle}</Text>}
        </View>
        <Pressable onPress={onClose} style={styles.detailClose}>
          <Text style={styles.detailCloseText}>✕</Text>
        </Pressable>
      </View>

      {/* Time info */}
      <View style={styles.detailTimeRow}>
        <View style={styles.detailTimeBox}>
          <Text style={[styles.detailTimeLabel, { color: themeColors.textMuted }]}>Start</Text>
          <Text style={[styles.detailTimeValue, { color: themeColors.text }]}>
            {task.startTime}
          </Text>
        </View>
        <View style={styles.detailTimeBox}>
          <Text style={[styles.detailTimeLabel, { color: themeColors.textMuted }]}>End</Text>
          <Text style={[styles.detailTimeValue, { color: themeColors.text }]}>{task.endTime}</Text>
        </View>
      </View>

      {/* Status */}
      {task.status && (
        <View style={[styles.statusBox, { backgroundColor: themeColors.input }]}>
          <Text style={[styles.statusLabel, { color: themeColors.textMuted }]}>
            Status:{' '}
            <Text style={{ color: colors.indigo[500] }}>
              {task.status === 'in_progress'
                ? 'In Progress'
                : task.status === 'completed'
                  ? 'Completed'
                  : 'Pending'}
            </Text>
          </Text>
          {task.progress !== undefined && (
            <>
              <Text style={[styles.progressLabel, { color: themeColors.textMuted }]}>
                Progress: {task.progress}%
              </Text>
              <View style={[styles.progressBar, { backgroundColor: themeColors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${task.progress}%`,
                      backgroundColor: colors.indigo[500],
                    },
                  ]}
                />
              </View>
            </>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.detailActions}>
        {onEdit && (
          <Button
            variant="secondary"
            onPress={() => {
              onClose();
              onEdit(task.id);
            }}
            style={{ flex: 1, marginRight: spacing[2] }}
          >
            Edit
          </Button>
        )}
        {onComplete && task.status !== 'completed' && (
          <Button
            variant="primary"
            onPress={onComplete}
            style={{ flex: 1, marginLeft: spacing[2] }}
          >
            Complete
          </Button>
        )}
        {task.status === 'completed' && (
          <Button
            variant="secondary"
            onPress={onComplete}
            style={{ flex: 1, marginLeft: onEdit ? spacing[2] : 0 }}
          >
            Reopen
          </Button>
        )}
      </View>
    </BottomSheet>
  );
}

function getTypeColor(type: TaskCategory): string {
  // Use centralized getLabelColor for consistency across all components
  return getLabelColor(type);
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing[5],
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing[2],
  },
  timeRow: {
    marginBottom: spacing[5],
  },
  timeField: {
    marginBottom: spacing[3],
  },
  timePickerButton: {
    height: 48,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.mono,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  durationOption: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.lg,
  },
  durationText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[1.5],
  },
  categoryLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },

  // Detail modal styles
  detailHeader: {
    margin: -spacing[6],
    marginBottom: spacing[4],
    padding: spacing[4],
    paddingTop: spacing[5],
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    position: 'relative',
  },
  detailHeaderContent: {
    paddingRight: spacing[8],
  },
  detailTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.white,
    marginTop: spacing[2],
  },
  detailSubtitle: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: spacing[1],
  },
  detailClose: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    padding: spacing[1],
  },
  detailCloseText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: typography.weights.medium,
  },
  detailTimeRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  detailTimeBox: {
    flex: 1,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
  },
  detailTimeLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing[1],
  },
  detailTimeValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.mono,
  },
  statusBox: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
  },
  statusLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing[2],
  },
  progressLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing[2],
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailActions: {
    flexDirection: 'row',
  },
});
