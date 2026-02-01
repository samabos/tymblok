import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { BottomSheet } from './BottomSheet';
import { Input } from '../primitives/Input';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';

export type TaskCategory = 'jira' | 'github' | 'meeting' | 'focus';

export interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (task: {
    title: string;
    startTime: string;
    duration: number;
    category: TaskCategory;
  }) => void;
  initialDate?: Date;
}

export function AddTaskModal({
  visible,
  onClose,
  onSubmit,
}: AddTaskModalProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(60); // minutes
  const [category, setCategory] = useState<TaskCategory>('focus');

  const categories: Array<{ key: TaskCategory; label: string }> = [
    { key: 'jira', label: 'Jira' },
    { key: 'github', label: 'GitHub' },
    { key: 'meeting', label: 'Meeting' },
    { key: 'focus', label: 'Focus' },
  ];

  const durations = [
    { value: 15, label: '15m' },
    { value: 30, label: '30m' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
  ];

  const handleSubmit = () => {
    if (!title.trim()) return;

    onSubmit?.({
      title: title.trim(),
      startTime,
      duration,
      category,
    });

    // Reset form
    setTitle('');
    setStartTime('09:00');
    setDuration(60);
    setCategory('focus');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title="New Time Block"
      snapPoints={[65]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title input */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: themeColors.text }]}>
            What are you working on?
          </Text>
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
            <Text style={[styles.label, { color: themeColors.text }]}>
              Start Time
            </Text>
            <View
              style={[
                styles.timePickerButton,
                { backgroundColor: themeColors.input },
              ]}
            >
              <Text style={[styles.timeText, { color: themeColors.text }]}>
                {startTime}
              </Text>
            </View>
          </View>

          <View style={styles.timeField}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              Duration
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.durationOptions}
            >
              {durations.map((d) => (
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
                        duration === d.value
                          ? colors.indigo[600]
                          : themeColors.input,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.durationText,
                      {
                        color:
                          duration === d.value ? colors.white : themeColors.text,
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
          <Text style={[styles.label, { color: themeColors.text }]}>
            Category
          </Text>
          <View style={styles.categoryOptions}>
            {categories.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategory(cat.key);
                }}
                style={[
                  styles.categoryOption,
                  {
                    backgroundColor:
                      category === cat.key
                        ? colors.indigo[600] + '20'
                        : 'transparent',
                    borderColor:
                      category === cat.key
                        ? colors.indigo[500]
                        : themeColors.border,
                  },
                ]}
              >
                <Badge
                  variant={cat.key as any}
                  size="sm"
                  label={cat.label}
                />
              </Pressable>
            ))}
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
    status?: 'pending' | 'in_progress' | 'completed';
    progress?: number;
  };
  onEdit?: () => void;
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
    <BottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={[50]}
      showHandle={false}
    >
      {/* Colored header */}
      <View style={[styles.detailHeader, { backgroundColor: typeColor }]}>
        <View style={styles.detailHeaderContent}>
          <Badge variant={task.type as any} size="md" label={task.type} />
          <Text style={styles.detailTitle}>{task.title}</Text>
          {task.subtitle && (
            <Text style={styles.detailSubtitle}>{task.subtitle}</Text>
          )}
        </View>
        <Pressable onPress={onClose} style={styles.detailClose}>
          <Text style={styles.detailCloseText}>✕</Text>
        </Pressable>
      </View>

      {/* Time info */}
      <View style={styles.detailTimeRow}>
        <View style={styles.detailTimeBox}>
          <Text style={[styles.detailTimeLabel, { color: themeColors.textMuted }]}>
            Start
          </Text>
          <Text style={[styles.detailTimeValue, { color: themeColors.text }]}>
            {task.startTime}
          </Text>
        </View>
        <View style={styles.detailTimeBox}>
          <Text style={[styles.detailTimeLabel, { color: themeColors.textMuted }]}>
            End
          </Text>
          <Text style={[styles.detailTimeValue, { color: themeColors.text }]}>
            {task.endTime}
          </Text>
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
            onPress={onEdit}
            style={{ flex: 1, marginRight: spacing[2] }}
          >
            Edit
          </Button>
        )}
        {onComplete && (
          <Button
            variant="primary"
            onPress={onComplete}
            style={{ flex: 1, marginLeft: spacing[2] }}
          >
            Complete
          </Button>
        )}
      </View>
    </BottomSheet>
  );
}

function getTypeColor(type: TaskCategory): string {
  const typeColors: Record<TaskCategory, string> = {
    github: colors.taskType.github,
    jira: colors.taskType.jira,
    meeting: colors.taskType.meeting,
    focus: colors.taskType.focus,
  };
  return typeColors[type] || colors.indigo[500];
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
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
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
