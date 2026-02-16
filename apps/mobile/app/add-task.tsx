import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Button, Input, Badge } from '@tymblok/ui';
import { spacing, borderRadius, typography, colors } from '@tymblok/theme';
import { AuthGuard } from '../components/AuthGuard';
import { useCategories, useCreateBlock } from '../services/apiHooks';

export default function AddTaskScreen() {
  return (
    <AuthGuard>
      <AddTaskContent />
    </AuthGuard>
  );
}

function AddTaskContent() {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createBlockMutation = useCreateBlock();

  const durations = [
    { value: 15, label: '15m' },
    { value: 30, label: '30m' },
    { value: 60, label: '1h' },
    { value: 90, label: '1.5h' },
    { value: 120, label: '2h' },
  ];

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];

    // Round up to next 15-minute interval to avoid tasks being "live" immediately
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const roundedMinutes = Math.ceil(currentMinutes / 15) * 15;
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
    const currentTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    try {
      await createBlockMutation.mutateAsync({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        categoryId: selectedCategoryId,
        date: todayDate,
        startTime: currentTime,
        durationMinutes: duration,
        isUrgent: false,
      });

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create task. Please try again.');
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
          New Task
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
            placeholder="What do you need to do?"
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
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="Add more details..."
          />
        </View>

        {/* Duration */}
        <View style={{ marginBottom: spacing[5] }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            color: themeColors.textMuted,
            marginBottom: spacing[2],
          }}>
            Duration
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing[2] }}
          >
            {durations.map((d) => (
              <Pressable
                key={d.value}
                onPress={() => setDuration(d.value)}
                style={{
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  borderRadius: borderRadius.lg,
                  backgroundColor: duration === d.value
                    ? themeColors.text
                    : themeColors.input,
                }}
              >
                <Text style={{
                  fontSize: typography.sizes.sm,
                  fontWeight: '500',
                  color: duration === d.value ? themeColors.bg : themeColors.text,
                }}>
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Category */}
        <View style={{ marginBottom: spacing[5] }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            color: themeColors.textMuted,
            marginBottom: spacing[2],
          }}>
            Category
          </Text>
          {categoriesLoading ? (
            <ActivityIndicator size="small" color={colors.indigo[500]} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
              {categories?.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  style={{
                    paddingHorizontal: spacing[4],
                    paddingVertical: spacing[3],
                    borderRadius: borderRadius.lg,
                    borderWidth: 1,
                    borderColor: selectedCategoryId === cat.id
                      ? cat.color
                      : themeColors.border,
                    backgroundColor: selectedCategoryId === cat.id
                      ? cat.color + '20'
                      : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: typography.sizes.sm,
                    fontWeight: '500',
                    color: selectedCategoryId === cat.id ? cat.color : themeColors.text,
                  }}>
                    {cat.icon} {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
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
          Create Task
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
