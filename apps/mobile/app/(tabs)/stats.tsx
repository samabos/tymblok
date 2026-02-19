import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
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
import { useStats } from '../../services/apiHooks';

export default function StatsScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View className="px-5 pt-4 pb-2">
          <Text className="text-2xl font-bold" style={{ color: themeColors.text }}>
            Stats
          </Text>
          <Text className="text-sm mt-1" style={{ color: themeColors.textMuted }}>
            Your productivity insights
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.indigo[500]} />
        </View>
      </SafeAreaView>
    );
  }

  const weeklyChart = stats?.weeklyChart ?? [];
  const maxHours = Math.max(...weeklyChart.map(d => d.hours), 0.001);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayIndex = weeklyChart.findIndex(d => d.date === todayStr);

  // Format change strings
  const weekChangeStr =
    stats?.weekSummary.weekChangePercent != null
      ? `${Math.abs(stats.weekSummary.weekChangePercent)}% vs last week`
      : 'No prior data';
  const weekChangePositive = (stats?.weekSummary.weekChangePercent ?? 0) >= 0;

  const tasksChangeStr =
    stats?.weekSummary.tasksDoneChange != null
      ? `${Math.abs(stats.weekSummary.tasksDoneChange)} vs last week`
      : 'No prior data';
  const tasksChangePositive = (stats?.weekSummary.tasksDoneChange ?? 0) >= 0;

  const monthChangeStr =
    stats?.monthSummary.monthChangePercent != null
      ? `${Math.abs(stats.monthSummary.monthChangePercent)}% vs last month`
      : 'No prior data';
  const monthChangePositive = (stats?.monthSummary.monthChangePercent ?? 0) >= 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold" style={{ color: themeColors.text }}>
          Stats
        </Text>
        <Text className="text-sm mt-1" style={{ color: themeColors.textMuted }}>
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
              value={`${stats?.weekSummary.thisWeekHours ?? 0}h`}
              change={{ value: weekChangeStr, positive: weekChangePositive }}
            />
          </View>
          <View className="flex-1">
            <StatCard
              title="Tasks Done"
              value={stats?.weekSummary.tasksDone ?? 0}
              change={{ value: tasksChangeStr, positive: tasksChangePositive }}
            />
          </View>
        </View>
        <View className="flex-row gap-3 pt-3">
          <View className="flex-1">
            <StatCard
              title="This Month"
              value={`${stats?.monthSummary.thisMonthHours ?? 0}h`}
              change={{ value: monthChangeStr, positive: monthChangePositive }}
            />
          </View>
          <View className="flex-1">
            <StatCard
              title="Avg / Day"
              value={`${stats?.monthSummary.avgHoursPerDay ?? 0}h`}
              change={{ value: 'This week', positive: true }}
            />
          </View>
        </View>

        {/* Weekly Chart */}
        <Card variant="default" padding="md" style={{ marginTop: 12 }}>
          <Text className="font-semibold mb-4" style={{ color: themeColors.text }}>
            Daily Hours
          </Text>
          <View className="flex-row items-end justify-between h-32">
            {weeklyChart.map((day, i) => (
              <View key={day.dayLabel} className="flex-1 items-center gap-2">
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
                  {day.dayLabel}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Category Breakdown */}
        <View style={{ marginTop: 12 }}>
          <CategoryBreakdown
            categories={
              stats?.categoryBreakdown.map(c => ({
                name: c.categoryName,
                hours: c.hours,
                percent: c.percent,
                color: c.categoryColor,
              })) ?? []
            }
          />
        </View>

        {/* Streak */}
        <View style={{ marginTop: 12 }}>
          <StreakCard
            currentStreak={stats?.streak.currentStreak ?? 0}
            bestStreak={stats?.streak.bestStreak ?? 0}
          />
        </View>

        {/* Focus Score */}
        <View style={{ marginTop: 12 }}>
          <FocusScoreCard score={stats?.focusScore ?? 0} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
