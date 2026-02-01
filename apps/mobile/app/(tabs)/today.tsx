import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useTheme, TaskCard, Avatar, type TaskCardData } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { useAuthStore } from '../../stores/authStore';

// Mock data for development
const mockTasks: TaskCardData[] = [
  {
    id: '1',
    title: 'Morning standup',
    subtitle: 'Engineering Team - Daily sync',
    time: '09:00',
    endTime: '09:15',
    durationMinutes: 15,
    type: 'meeting',
    completed: true,
  },
  {
    id: '2',
    title: 'Review authentication PR',
    subtitle: 'auth-module #234 - +180 -42',
    time: '09:30',
    endTime: '10:15',
    durationMinutes: 45,
    type: 'github',
    completed: true,
  },
  {
    id: '3',
    title: 'Sprint Planning',
    subtitle: 'Engineering Team - 5 attendees',
    time: '10:30',
    endTime: '11:30',
    durationMinutes: 60,
    type: 'meeting',
    isNow: true,
    progress: 54,
  },
  {
    id: '4',
    title: 'User settings implementation',
    subtitle: 'JIRA-892 - 5 story points',
    time: '13:00',
    endTime: '15:00',
    durationMinutes: 120,
    type: 'jira',
  },
  {
    id: '5',
    title: 'Code review session',
    subtitle: 'Review PRs from team',
    time: '15:30',
    endTime: '16:30',
    durationMinutes: 60,
    type: 'github',
    urgent: true,
  },
  {
    id: '6',
    title: 'API documentation update',
    subtitle: 'JIRA-901 - 2 story points',
    time: '17:00',
    endTime: '18:00',
    durationMinutes: 60,
    type: 'jira',
  },
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function TodayScreen() {
  const { theme, isDark } = useTheme();
  const themeColors = theme.colors;
  const { user } = useAuthStore();
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState(mockTasks);
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flatListRef = useRef<any>(null);

  const expandAnimation = useSharedValue(0);

  // Reset to today whenever the tab is pressed (reset param changes)
  useEffect(() => {
    if (reset) {
      setCurrentDate(new Date());
    }
  }, [reset]);

  // Also reset to today when screen first comes into focus
  useFocusEffect(
    useCallback(() => {
      setCurrentDate(new Date());
    }, [])
  );

  const toggleHeader = () => {
    setHeaderExpanded(!headerExpanded);
    expandAnimation.value = withTiming(headerExpanded ? 0 : 1, { duration: 300 });
  };

  const expandHeader = () => {
    if (!headerExpanded) {
      setHeaderExpanded(true);
      expandAnimation.value = withTiming(1, { duration: 300 });
    }
  };

  const collapseHeader = () => {
    if (headerExpanded) {
      setHeaderExpanded(false);
      expandAnimation.value = withTiming(0, { duration: 300 });
    }
  };

  // Tap gesture for toggle on press
  const headerTapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(toggleHeader)();
    });

  // Pan gesture for swipe to expand/collapse header
  const headerPanGesture = Gesture.Pan()
    .onEnd((event) => {
      const SWIPE_THRESHOLD = 30;
      if (event.translationY > SWIPE_THRESHOLD) {
        // Swipe down - expand
        runOnJS(expandHeader)();
      } else if (event.translationY < -SWIPE_THRESHOLD) {
        // Swipe up - collapse
        runOnJS(collapseHeader)();
      }
    });

  // Compose tap and pan gestures - pan takes priority
  const headerGesture = Gesture.Race(headerPanGesture, headerTapGesture);

  const daySelectorStyle = useAnimatedStyle(() => ({
    height: interpolate(expandAnimation.value, [0, 1], [0, 60]),
    opacity: expandAnimation.value,
    overflow: 'hidden',
  }));

  const formatDateHeader = useMemo(() => {
    const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return { weekday, monthDay };
  }, [currentDate]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    return { total, completed };
  }, [tasks]);

  const getDaysCenteredOnToday = useMemo(() => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);
      days.push({
        label: DAY_LABELS[date.getDay()],
        num: date.getDate(),
        isToday: i === 0,
        offset: i,
      });
    }
    return days;
  }, [currentDate]);

  const getDayStyle = (offset: number) => {
    const absOffset = Math.abs(offset);
    if (absOffset === 0) return { size: 48, fontSize: 16, opacity: 1 };
    if (absOffset === 1) return { size: 40, fontSize: 14, opacity: 0.8 };
    if (absOffset === 2) return { size: 32, fontSize: 12, opacity: 0.6 };
    return { size: 28, fontSize: 12, opacity: 0.4 };
  };

  const navigateDay = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset);
    setCurrentDate(newDate);
  };

  // Horizontal swipe gesture for day navigation
  const daySelectorSwipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Only activate for horizontal movement
    .onEnd((event) => {
      const SWIPE_THRESHOLD = 50;
      if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left - go to next day
        runOnJS(navigateDay)(1);
      } else if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right - go to previous day
        runOnJS(navigateDay)(-1);
      }
    });

  const handleTaskComplete = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, completed: true, isNow: false } : task
      )
    );
    setExpandedTaskId(null);
  };

  const handleTaskUndoComplete = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, completed: false } : task
      )
    );
    setExpandedTaskId(null);
  };

  const handleTaskStart = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, isNow: true, progress: 0 }
          : { ...task, isNow: false } // Stop other tasks when starting a new one
      )
    );
  };

  const handleTaskPress = (taskId: string) => {
    const isExpanding = expandedTaskId !== taskId;
    setExpandedTaskId(isExpanding ? taskId : null);

    // Scroll to show the expanded card
    if (isExpanding) {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1 && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: taskIndex,
            animated: true,
            viewPosition: 0.3,
          });
        }, 100);
      }
    }
  };

  const handleDragEnd = ({ data }: { data: TaskCardData[] }) => {
    setTasks(data);
  };

  const handleDragBegin = () => {
    setExpandedTaskId(null);
  };

  const handleOpenDetail = (task: TaskCardData) => {
    setExpandedTaskId(null);
    // Navigate directly to task detail page
    router.push({
      pathname: '/task/[id]',
      params: {
        id: task.id,
        title: task.title,
        subtitle: task.subtitle || '',
        type: task.type,
        time: task.time,
        endTime: task.endTime || '',
        durationMinutes: String(task.durationMinutes || 60),
        completed: String(task.completed || false),
        isNow: String(task.isNow || false),
        progress: String(task.progress || 0),
      },
    });
  };

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<TaskCardData>) => {
      return (
        <ScaleDecorator>
          <TaskCard
            task={item}
            expanded={expandedTaskId === item.id}
            dragging={isActive}
            onLongPress={drag}
            onStart={() => handleTaskStart(item.id)}
            onComplete={() => handleTaskComplete(item.id)}
            onUndoComplete={() => handleTaskUndoComplete(item.id)}
            onPress={() => handleTaskPress(item.id)}
            onExpand={() => handleOpenDetail(item)}
            style={{ marginBottom: 12 }}
          />
        </ScaleDecorator>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expandedTaskId]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            borderBottomWidth: 1,
            borderColor: themeColors.border,
          }}
        >
          {/* Header Content - Tappable area */}
          <GestureDetector gesture={headerGesture}>
            <Animated.View
              accessibilityLabel={`${formatDateHeader.weekday}, ${formatDateHeader.monthDay}. ${taskStats.total} tasks, ${taskStats.completed} done. Tap to ${headerExpanded ? 'collapse' : 'expand'} day selector`}
              accessibilityRole="button"
            >
              <View className="px-5 pt-6 pb-3">
                <View className="flex-row items-start justify-between">
                  <View>
                    <Text
                      className="text-xs font-medium"
                      style={{ color: themeColors.textMuted }}
                    >
                      {formatDateHeader.weekday}
                    </Text>
                    <Text
                      className="text-xl font-bold mt-0.5"
                      style={{ color: themeColors.text }}
                    >
                      {formatDateHeader.monthDay}
                    </Text>
                    <Text
                      className="text-xs mt-0.5"
                      style={{ color: themeColors.textFaint }}
                    >
                      {taskStats.total} tasks · {taskStats.completed} done
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <GestureDetector gesture={Gesture.Native()}>
                      <TouchableOpacity
                        accessibilityLabel="Open profile"
                        accessibilityRole="button"
                        onPress={() => router.push('/profile')}
                      >
                        <View className="relative">
                          <Avatar name={user?.name || 'User'} size="sm" color={colors.indigo[500]} />
                          <View
                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                            style={{
                              backgroundColor: colors.status.done,
                              borderColor: themeColors.bg,
                            }}
                            accessibilityLabel="Online status"
                          />
                        </View>
                      </TouchableOpacity>
                    </GestureDetector>
                  </View>
                </View>
              </View>
            </Animated.View>
          </GestureDetector>

          {/* Day Selector - Separate gesture area */}
          <Animated.View style={daySelectorStyle}>
            <GestureDetector gesture={daySelectorSwipeGesture}>
              <Animated.View className="flex-row items-center justify-center gap-1.5 px-5 pb-4">
              {getDaysCenteredOnToday.map((day, i) => {
                const style = getDayStyle(day.offset);
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => navigateDay(day.offset)}
                    accessibilityLabel={`${day.isToday ? 'Today, ' : ''}Day ${day.num}`}
                    accessibilityRole="button"
                    style={{
                      width: style.size,
                      height: style.size,
                      borderRadius: style.size / 2,
                      backgroundColor: day.isToday ? colors.indigo[500] : themeColors.card,
                      borderWidth: day.isToday ? 0 : 1,
                      borderColor: themeColors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: style.opacity,
                      shadowColor: day.isToday ? colors.indigo[500] : 'transparent',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: day.isToday ? 0.3 : 0,
                      shadowRadius: 8,
                      elevation: day.isToday ? 4 : 0,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: style.fontSize,
                        fontWeight: '600',
                        color: day.isToday ? colors.white : themeColors.text,
                      }}
                    >
                      {day.num}
                    </Text>
                    {day.isToday && (
                      <Text
                        style={{
                          fontSize: 8,
                          fontWeight: '500',
                          color: colors.indigo[400],
                          marginTop: -2,
                        }}
                      >
                        {day.label}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              </Animated.View>
            </GestureDetector>
          </Animated.View>
        </View>

        {/* Task List */}
        <DraggableFlatList
          ref={flatListRef}
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          onDragBegin={handleDragBegin}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
          activationDistance={10}
        />

    </SafeAreaView>
  );
}
