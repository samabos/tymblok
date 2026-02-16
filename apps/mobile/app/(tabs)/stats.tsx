import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useTheme,
  StatCard,
  StreakCard,
  FocusScoreCard,
  CategoryBreakdown,
  Card,
} from '@tymblok/ui';
import { colors } from '@tymblok/theme';

// Mock data for development
const weekData = [
  { day: 'Mon', hours: 6.5, completed: 8 },
  { day: 'Tue', hours: 7.2, completed: 10 },
  { day: 'Wed', hours: 5.8, completed: 7 },
  { day: 'Thu', hours: 8.1, completed: 12 },
  { day: 'Fri', hours: 6.0, completed: 9 },
  { day: 'Sat', hours: 2.5, completed: 3 },
  { day: 'Sun', hours: 1.0, completed: 2 },
];

const categoryData = [
  { name: 'Deep Work', hours: 18.5, percent: 45 },
  { name: 'Meetings', hours: 12.0, percent: 29 },
  { name: 'Code Review', hours: 6.5, percent: 16 },
  { name: 'Admin', hours: 4.1, percent: 10 },
];

export default function StatsScreen() {
  const { theme, isDark } = useTheme();
  const themeColors = theme.colors;

  const maxHours = Math.max(...weekData.map(d => d.hours));
  const todayIndex = 3; // Thursday is highlighted

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text
          className="text-2xl font-bold"
          style={{ color: themeColors.text }}
        >
          Stats
        </Text>
        <Text
          className="text-sm mt-1"
          style={{ color: themeColors.textMuted }}
        >
          Your productivity insights
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Summary Cards */}
        <View className="flex-row gap-3 pt-4">
          <View className="flex-1">
            <StatCard
              title="This Week"
              value="37.1h"
              change={{ value: '12% vs last week', positive: true }}
            />
          </View>
          <View className="flex-1">
            <StatCard
              title="Tasks Done"
              value={51}
              change={{ value: '8 more than last week', positive: true }}
            />
          </View>
        </View>

        {/* Weekly Chart */}
        <Card variant="default" padding="md" style={{ marginTop: 12 }}>
          <Text
            className="font-semibold mb-4"
            style={{ color: themeColors.text }}
          >
            Daily Hours
          </Text>
          <View className="flex-row items-end justify-between h-32">
            {weekData.map((day, i) => (
              <View key={day.day} className="flex-1 items-center gap-2">
                <View className="w-full justify-end h-24">
                  <View
                    style={{
                      width: '80%',
                      alignSelf: 'center',
                      height: `${(day.hours / maxHours) * 100}%`,
                      backgroundColor: i === todayIndex ? colors.indigo[500] : themeColors.input,
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    }}
                  />
                </View>
                <Text
                  className="text-xs"
                  style={{
                    color: i === todayIndex ? colors.indigo[500] : themeColors.textFaint,
                    fontWeight: i === todayIndex ? '600' : '400',
                  }}
                >
                  {day.day}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Category Breakdown */}
        <View style={{ marginTop: 12 }}>
          <CategoryBreakdown categories={categoryData} />
        </View>

        {/* Streak */}
        <View style={{ marginTop: 12 }}>
          <StreakCard currentStreak={12} bestStreak={28} />
        </View>

        {/* Focus Score */}
        <View style={{ marginTop: 12 }}>
          <FocusScoreCard score={85} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
