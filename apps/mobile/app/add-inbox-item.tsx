import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Button, Input } from '@tymblok/ui';
import { spacing, borderRadius, typography, colors } from '@tymblok/theme';
import { AuthGuard } from '../components/AuthGuard';
import { RecurrencePicker, type RecurrenceConfig } from '../components/RecurrencePicker';
import { useCreateInboxItem } from '../services/apiHooks';

// Use string literal type instead of enum to avoid module initialization issues
type InboxPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export default function AddInboxItemScreen() {
  return (
    <AuthGuard>
      <AddInboxItemContent />
    </AuthGuard>
  );
}

function AddInboxItemContent() {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<InboxPriority>('Medium');
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    isRecurring: false,
    recurrenceType: null,
    recurrenceInterval: 1,
    recurrenceEndDate: null,
  });

  const createInboxItemMutation = useCreateInboxItem();

  const priorities: Array<{ key: InboxPriority; label: string; color: string }> = [
    { key: 'Low', label: 'Low', color: colors.priority.low },
    { key: 'Medium', label: 'Medium', color: colors.priority.medium },
    { key: 'High', label: 'High', color: colors.priority.high },
    { key: 'Critical', label: 'Critical', color: colors.priority.critical },
  ];

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      await createInboxItemMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        isRecurring: recurrence.isRecurring,
        recurrenceType: recurrence.recurrenceType,
        recurrenceInterval: recurrence.recurrenceInterval,
        recurrenceEndDate: recurrence.recurrenceEndDate,
      });

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create inbox item. Please try again.');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: themeColors.border,
      }}>
        <Pressable
          onPress={handleCancel}
          style={{
            width: 40,
            height: 40,
            borderRadius: borderRadius.lg,
            backgroundColor: themeColors.input,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={20} color={themeColors.text} />
        </Pressable>

        <Text style={{
          fontSize: typography.sizes.lg,
          fontWeight: '600',
          color: themeColors.text,
        }}>
          New Inbox Item
        </Text>

        <Pressable
          onPress={handleCreate}
          style={{
            width: 40,
            height: 40,
            borderRadius: borderRadius.lg,
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
          <Text style={{
            fontSize: typography.sizes.sm,
            color: themeColors.textMuted,
            marginBottom: spacing[2],
          }}>
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
          <Text style={{
            fontSize: typography.sizes.sm,
            color: themeColors.textMuted,
            marginBottom: spacing[2],
          }}>
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

        {/* Priority */}
        <View style={{ marginBottom: spacing[5] }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            color: themeColors.textMuted,
            marginBottom: spacing[2],
          }}>
            Priority
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {priorities.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => setPriority(p.key)}
                style={{
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  borderRadius: borderRadius.lg,
                  borderWidth: 2,
                  borderColor: priority === p.key ? p.color : themeColors.border,
                  backgroundColor: priority === p.key
                    ? p.color + '20'
                    : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: typography.sizes.sm,
                  fontWeight: '500',
                  color: priority === p.key ? p.color : themeColors.text,
                }}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recurrence */}
        <View style={{ marginBottom: spacing[5] }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            color: themeColors.textMuted,
            marginBottom: spacing[2],
          }}>
            Repeat
          </Text>
          <RecurrencePicker value={recurrence} onChange={setRecurrence} />
        </View>

        {/* Info Text */}
        <View style={{
          padding: spacing[4],
          borderRadius: borderRadius.lg,
          backgroundColor: themeColors.input,
        }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            color: themeColors.textMuted,
            lineHeight: 20,
          }}>
            💡 {recurrence.isRecurring
              ? 'Recurring inbox items stay in your inbox and automatically create blocks when viewing dates. Perfect for daily routines!'
              : 'Inbox items can be scheduled to your day by tapping the + button. They disappear once added.'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={{
        padding: spacing[5],
        borderTopWidth: 1,
        borderTopColor: themeColors.border,
        gap: spacing[3],
      }}>
        <Button variant="primary" fullWidth onPress={handleCreate}>
          Create Inbox Item
        </Button>
        <TouchableOpacity
          style={{
            padding: spacing[4],
            borderRadius: borderRadius.xl,
            alignItems: 'center',
            backgroundColor: themeColors.card,
          }}
          onPress={handleCancel}
        >
          <Text style={{
            fontWeight: '500',
            color: themeColors.textMuted,
          }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
