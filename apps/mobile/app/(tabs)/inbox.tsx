import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, InboxItem, type InboxItemData } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { useInboxItems, useDismissInboxItem, useCreateBlock, useCategories } from '../../services/apiHooks';
import { mapInboxItemToData } from '../../utils/mappers';
import { Ionicons } from '@expo/vector-icons';

type FilterType = 'all' | 'tasks' | 'updates';

export default function InboxScreen() {
  const { theme, isDark } = useTheme();
  const themeColors = theme.colors;
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: inboxItems, isLoading, error, refetch } = useInboxItems();
  const { data: categories } = useCategories();
  const dismissMutation = useDismissInboxItem();
  const createBlockMutation = useCreateBlock();

  // Map and filter items
  const items = useMemo(() => {
    if (!inboxItems) return [];

    return inboxItems
      .filter(item => !item.isDismissed)
      .map(mapInboxItemToData);
  }, [inboxItems]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'tasks') return items.filter(item => item.type === 'task');
    return items.filter(item => item.type === 'update');
  }, [items, filter]);

  const handleAdd = async (itemId: string) => {
    const item = inboxItems?.find(i => i.id === itemId);
    if (!item) return;

    if (!categories || categories.length === 0) {
      Alert.alert('Error', 'No categories available. Please create a category first.');
      return;
    }

    // Use the first available category (could enhance this to let user choose)
    const defaultCategory = categories[0];

    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
      await createBlockMutation.mutateAsync({
        title: item.title,
        subtitle: item.description || undefined,
        categoryId: defaultCategory.id,
        date: todayDate,
        startTime: currentTime,
        durationMinutes: 60, // Default 1 hour
        isUrgent: item.priority === 'Critical' || item.priority === 'High',
      });

      Alert.alert('Success', 'Added to today\'s schedule!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add to schedule');
    }
  };

  const handleDismiss = (itemId: string) => {
    dismissMutation.mutate(itemId);
  };

  const handleCreateInboxItem = () => {
    // Navigate to create inbox item screen
    router.push('/add-inbox-item');
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'updates', label: 'Updates' },
  ];

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.indigo[500]} />
          <Text style={{ color: themeColors.textMuted, marginTop: 16 }}>Loading inbox...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.status.urgent} />
          <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 16, color: themeColors.text }}>
            Failed to load inbox
          </Text>
          <Text style={{ fontSize: 14, marginTop: 8, textAlign: 'center', color: themeColors.textMuted }}>
            {error.message || 'Something went wrong'}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: colors.indigo[500],
            }}
            onPress={() => refetch()}
          >
            <Text style={{ color: colors.white, fontWeight: '500' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text
              className="text-2xl font-bold"
              style={{ color: themeColors.text }}
            >
              Inbox
            </Text>
            <Text
              className="text-sm mt-1"
              style={{ color: themeColors.textMuted }}
            >
              Tasks and updates from your integrations
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCreateInboxItem}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.indigo[500],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter tabs */}
      <View className="px-5 py-3 flex-row gap-2">
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            className="px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: filter === f.key ? colors.indigo[500] : themeColors.input,
            }}
          >
            <Text
              className="text-sm font-medium"
              style={{
                color: filter === f.key ? colors.white : themeColors.textMuted,
              }}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Inbox Items */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="gap-3 pt-2">
          {filteredItems.map(item => (
            <InboxItem
              key={item.id}
              item={item}
              onAdd={() => handleAdd(item.id)}
              onDismiss={() => handleDismiss(item.id)}
              onPress={() => {
                // TODO: Open item detail
              }}
            />
          ))}
        </View>

        {/* Hint text */}
        <View className="py-8 items-center">
          <Text
            className="text-sm text-center"
            style={{ color: themeColors.textFaint }}
          >
            Tap + to add to today&apos;s schedule{'\n'}
            Tap x to dismiss
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
