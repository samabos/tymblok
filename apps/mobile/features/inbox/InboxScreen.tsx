import { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTheme, InboxItem } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import {
  useInboxItems,
  useDismissInboxItem,
  useCreateBlock,
  useBlocks,
  useCategories,
} from '../../services/apiHooks';
import { mapInboxItemToData } from '../../utils/mappers';
import { useAlert } from '../../components/AlertProvider';
import { Ionicons } from '@expo/vector-icons';

type FilterType = 'all' | 'tasks' | 'todos';

export default function InboxScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const [filter, setFilter] = useState<FilterType>('all');
  const { success, error: showError, confirm } = useAlert();

  const { data: inboxItems, isLoading, error, refetch } = useInboxItems();
  const { data: categories } = useCategories();
  const todayDate = new Date().toISOString().split('T')[0];
  const { data: todayBlocks } = useBlocks({ date: todayDate });
  const dismissMutation = useDismissInboxItem();
  const createBlockMutation = useCreateBlock();

  // Refetch when screen comes into focus (e.g. after adding an item)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const items = useMemo(() => {
    if (!inboxItems) return [];
    return inboxItems.filter(item => !item.isDismissed).map(mapInboxItemToData);
  }, [inboxItems]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'tasks') return items.filter(item => item.type === 'task');
    return items.filter(item => item.type !== 'task');
  }, [items, filter]);

  const addToSchedule = async (item: NonNullable<typeof inboxItems>[number]) => {
    if (!categories || categories.length === 0) {
      showError('Error', 'No categories available. Please create a category first.');
      return;
    }

    const defaultCategory = categories[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const sourceToProvider: Record<string, string> = {
      GitHub: 'GitHub',
      GoogleCalendar: 'GoogleCalendar',
    };
    const externalSource = sourceToProvider[item.source] || null;

    try {
      await createBlockMutation.mutateAsync({
        title: item.title,
        subtitle: item.description || undefined,
        categoryId: defaultCategory.id,
        date: todayDate,
        startTime: currentTime,
        durationMinutes: 60,
        isUrgent: item.priority === 'Critical' || item.priority === 'High',
        externalId: item.externalId,
        externalUrl: item.externalUrl,
        externalSource,
      });
      success('Success', "Added to today's schedule!");
    } catch {
      showError('Error', 'Failed to add to schedule');
    }
  };

  const handleAdd = async (itemId: string) => {
    const item = inboxItems?.find(i => i.id === itemId);
    if (!item) return;

    // Check for duplicates in today's blocks
    const duplicate = todayBlocks?.find(
      b =>
        (item.externalId && b.externalId === item.externalId) ||
        b.title.toLowerCase() === item.title.toLowerCase()
    );

    if (duplicate) {
      confirm(
        'Already Scheduled',
        `"${item.title}" is already on today's schedule. Add it again?`,
        () => addToSchedule(item),
        'Add Anyway'
      );
      return;
    }

    await addToSchedule(item);
  };

  const handleDismiss = (itemId: string) => {
    dismissMutation.mutate(itemId);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'todos', label: 'Todo' },
  ];

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

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}
        >
          <Ionicons name="alert-circle-outline" size={48} color={colors.status.urgent} />
          <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 16, color: themeColors.text }}>
            Failed to load inbox
          </Text>
          <Text
            style={{
              fontSize: 14,
              marginTop: 8,
              textAlign: 'center',
              color: themeColors.textMuted,
            }}
          >
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
        <Text className="text-2xl font-bold" style={{ color: themeColors.text }}>
          Inbox
        </Text>
        <Text className="text-sm mt-1" style={{ color: themeColors.textMuted }}>
          Tasks and updates from your integrations
        </Text>
      </View>

      {/* Filter tabs */}
      <View className="px-5 py-3 flex-row gap-2">
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            className="px-4 py-1.5 rounded-full"
            style={{ backgroundColor: filter === f.key ? colors.indigo[500] : themeColors.input }}
          >
            <Text
              className="text-sm font-medium"
              style={{ color: filter === f.key ? colors.white : themeColors.textMuted }}
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
                const raw = inboxItems?.find(i => i.id === item.id);
                router.push({
                  pathname: '/edit-inbox-item',
                  params: {
                    id: item.id,
                    title: raw?.title ?? item.title,
                    description: raw?.description ?? '',
                    priority: raw?.priority ?? item.priority,
                  },
                });
              }}
            />
          ))}
        </View>

        {/* Add Inbox Item Card */}
        <TouchableOpacity
          onPress={() => router.push('/add-inbox-item')}
          activeOpacity={0.7}
          style={{
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: themeColors.border,
            borderRadius: 16,
            minHeight: 64,
            paddingHorizontal: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 12,
          }}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={themeColors.textMuted}
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: themeColors.textMuted, fontSize: 14, fontWeight: '500' }}>
            Add an item
          </Text>
        </TouchableOpacity>

        <View className="py-8 items-center">
          <Text className="text-sm text-center" style={{ color: themeColors.textFaint }}>
            Tap + to add to today&apos;s schedule{'\n'}Tap x to dismiss
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
