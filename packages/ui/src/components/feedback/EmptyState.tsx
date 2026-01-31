import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../primitives/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
  secondaryAction?: () => void;
  secondaryActionLabel?: string;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryActionLabel,
  style,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  return (
    <View style={[styles.container, style]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: themeColors.input }]}>
          {icon}
        </View>
      )}

      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>

      {description && (
        <Text style={[styles.description, { color: themeColors.textMuted }]}>
          {description}
        </Text>
      )}

      {(action || secondaryAction) && (
        <View style={styles.actions}>
          {action && actionLabel && (
            <Button variant="primary" onPress={action}>
              {actionLabel}
            </Button>
          )}
          {secondaryAction && secondaryActionLabel && (
            <Button
              variant="ghost"
              onPress={secondaryAction}
              style={action ? { marginTop: spacing[2] } : undefined}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

// Pre-built empty states for common scenarios
export function InboxEmptyState({ onAddTask }: { onAddTask?: () => void }) {
  return (
    <EmptyState
      icon={<InboxZeroIcon />}
      title="Inbox zero!"
      description="You've processed all your tasks. Great job staying on top of things."
      action={onAddTask}
      actionLabel="Add a task"
    />
  );
}

export function TasksEmptyState({ onAddTask }: { onAddTask?: () => void }) {
  return (
    <EmptyState
      icon={<CalendarIcon />}
      title="No tasks scheduled"
      description="Your day is wide open. Add some tasks to get started."
      action={onAddTask}
      actionLabel="Add time block"
    />
  );
}

export function SearchEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      icon={<SearchIcon />}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
    />
  );
}

// Simple icon components (placeholder implementations)
function InboxZeroIcon() {
  const { theme } = useTheme();
  return (
    <View style={iconStyles.container}>
      <View style={[iconStyles.checkCircle, { borderColor: colors.status.done }]}>
        <View style={[iconStyles.checkMark, { backgroundColor: colors.status.done }]} />
      </View>
    </View>
  );
}

function CalendarIcon() {
  const { theme } = useTheme();
  return (
    <View style={iconStyles.container}>
      <View style={[iconStyles.calendar, { borderColor: theme.colors.textMuted }]}>
        <View style={[iconStyles.calendarDot, { backgroundColor: colors.indigo[500] }]} />
      </View>
    </View>
  );
}

function SearchIcon() {
  const { theme } = useTheme();
  return (
    <View style={iconStyles.container}>
      <View style={[iconStyles.searchCircle, { borderColor: theme.colors.textMuted }]} />
      <View style={[iconStyles.searchHandle, { backgroundColor: theme.colors.textMuted }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[12],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: typography.sizes.base * 1.5,
    maxWidth: 280,
  },
  actions: {
    marginTop: spacing[6],
    alignItems: 'center',
  },
});

const iconStyles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    width: 12,
    height: 6,
    borderRadius: 1,
  },
  calendar: {
    width: 28,
    height: 32,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  calendarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  searchHandle: {
    position: 'absolute',
    width: 8,
    height: 2,
    borderRadius: 1,
    bottom: 4,
    right: 4,
    transform: [{ rotate: '45deg' }],
  },
});
