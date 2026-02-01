import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, InboxItem, type InboxItemData } from '@tymblok/ui';
import { colors } from '@tymblok/theme';

// Mock data for development
const mockInboxItems: InboxItemData[] = [
  {
    id: '1',
    title: 'Review Q4 Planning Doc',
    source: 'google-drive',
    time: '2h ago',
    type: 'task',
  },
  {
    id: '2',
    title: 'JIRA-923: Fix login redirect',
    source: 'jira',
    time: '3h ago',
    type: 'task',
    priority: 'high',
  },
  {
    id: '3',
    title: 'Team standup moved to 10am',
    source: 'calendar',
    time: '5h ago',
    type: 'update',
  },
  {
    id: '4',
    title: 'PR #456 ready for review',
    source: 'github',
    time: '6h ago',
    type: 'task',
  },
  {
    id: '5',
    title: 'Weekly report due Friday',
    source: 'slack',
    time: '1d ago',
    type: 'reminder',
  },
];

type FilterType = 'all' | 'tasks' | 'updates';

export default function InboxScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const [filter, setFilter] = useState<FilterType>('all');
  const [items, setItems] = useState(mockInboxItems);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'tasks') return items.filter(item => item.type === 'task');
    return items.filter(item => item.type !== 'task');
  }, [items, filter]);

  const handleAdd = (itemId: string) => {
    // TODO: Add to today's schedule
    console.log('Adding to schedule:', itemId);
  };

  const handleDismiss = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'updates', label: 'Updates' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
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
