import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
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
import { EmailVerificationBanner } from '../../components/EmailVerificationBanner';
import { useBlocks, useUpdateBlock, useCompleteBlock, useStartBlock, usePauseBlock, useUpdateBlocksSortOrder } from '../../services/apiHooks';
import { mapBlockToTaskCard } from '../../utils/mappers';
import { Ionicons } from '@expo/vector-icons';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function TodayScreen() {
  const { theme, isDark } = useTheme();
  const themeColors = theme.colors;
  const { user } = useAuthStore();
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [localElapsed, setLocalElapsed] = useState<Record<string, number>>({});
  const [completedCollapsed, setCompletedCollapsed] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flatListRef = useRef<any>(null);

  const expandAnimation = useSharedValue(0);

  // Convert date to ISO string for API
  const currentDateStr = useMemo(() =>
    currentDate.toISOString().split('T')[0], // "2024-01-31"
    [currentDate]
  );

  // Fetch blocks from API
  const { data: blocks, isLoading, error, refetch } = useBlocks({ date: currentDateStr });
  const updateBlockMutation = useUpdateBlock();
  const completeBlockMutation = useCompleteBlock();
  const startBlockMutation = useStartBlock();
  const pauseBlockMutation = usePauseBlock();
  const updateSortOrderMutation = useUpdateBlocksSortOrder();

  // Frontend timer: tick elapsed seconds for running tasks
  useEffect(() => {
    const runningIds = blocks
      ?.filter(b => b.timerState === 'Running')
      .map(b => b.id) || [];

    if (runningIds.length === 0) return;

    // Seed local elapsed from backend values for newly running tasks
    setLocalElapsed(prev => {
      const next = { ...prev };
      for (const b of blocks || []) {
        if (b.timerState === 'Running' && !(b.id in next)) {
          next[b.id] = b.elapsedSeconds || 0;
        }
      }
      return next;
    });

    const interval = setInterval(() => {
      setLocalElapsed(prev => {
        const next = { ...prev };
        for (const id of runningIds) {
          next[id] = (next[id] || 0) + 1;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [blocks]);

  // Clean up local elapsed for tasks that are no longer running
  useEffect(() => {
    if (!blocks) return;
    setLocalElapsed(prev => {
      const runningIds = new Set(
        blocks.filter(b => b.timerState === 'Running').map(b => b.id)
      );
      const next: Record<string, number> = {};
      for (const [id, val] of Object.entries(prev)) {
        if (runningIds.has(id)) next[id] = val;
      }
      return next;
    });
  }, [blocks]);

  // Map API data to UI format, merging local elapsed for running tasks
  const allTasks = useMemo(() => {
    if (!blocks) return [];
    return blocks.map(block => {
      const card = mapBlockToTaskCard(block);
      if (block.timerState === 'Running' && localElapsed[block.id] !== undefined) {
        card.elapsedSeconds = localElapsed[block.id];
      }
      return card;
    });
  }, [blocks, localElapsed]);

  // Split into active and completed
  const activeTasks = useMemo(() => allTasks.filter(t => !t.completed), [allTasks]);
  const completedTasks = useMemo(() => allTasks.filter(t => t.completed), [allTasks]);

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
    const total = allTasks.length;
    const completed = completedTasks.length;
    return { total, completed };
  }, [allTasks, completedTasks]);

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
    completeBlockMutation.mutate(taskId);
    setExpandedTaskId(null);
  };

  const handleTaskUndoComplete = (taskId: string) => {
    updateBlockMutation.mutate({
      id: taskId,
      data: { isCompleted: false },
    });
    setExpandedTaskId(null);
  };

  const handleTaskStart = (taskId: string) => {
    startBlockMutation.mutate(taskId);
  };

  const handleTaskPause = (taskId: string) => {
    pauseBlockMutation.mutate(taskId);
  };

  const handleTaskPress = (taskId: string) => {
    const isExpanding = expandedTaskId !== taskId;
    setExpandedTaskId(isExpanding ? taskId : null);

    // Scroll to show the expanded card (only for active tasks in the draggable list)
    if (isExpanding) {
      const taskIndex = activeTasks.findIndex(t => t.id === taskId);
      if (taskIndex >= 0 && taskIndex < activeTasks.length && flatListRef.current) {
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: taskIndex,
              animated: true,
              viewPosition: 0.3,
            });
          } catch {
            // Ignore scroll errors for edge cases
          }
        }, 100);
      }
    }
  };

  const handleDragEnd = ({ data }: { data: TaskCardData[] }) => {
    const updates = data.map((task, index) => ({
      id: task.id,
      sortOrder: index,
    }));

    updateSortOrderMutation.mutate(updates);
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
            onPause={() => handleTaskPause(item.id)}
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

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.indigo[500]} />
          <Text style={{ color: themeColors.textMuted, marginTop: 16 }}>Loading tasks...</Text>
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
            Failed to load tasks
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
        <View
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : themeColors.bg,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            borderBottomWidth: isDark ? 1 : 0,
            borderColor: themeColors.border,
            overflow: 'hidden',
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
                      className="text-2xl font-bold mt-0.5"
                      style={{ color: themeColors.text }}
                    >
                      {formatDateHeader.monthDay}
                    </Text>
                    <Text
                      className="text-xs mt-0.5"
                      style={{ color: themeColors.textMuted }}
                    >
                      {taskStats.total} tasks · {taskStats.completed} done
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <GestureDetector gesture={Gesture.Native()}>
                      <TouchableOpacity
                        accessibilityLabel="Open profile"
                        accessibilityRole="button"
                        onPress={() => router.push('/(auth)/profile')}
                      >
                        <View className="relative">
                          {user?.avatar_url ? (
                            <Image
                              source={{ uri: user.avatar_url }}
                              style={{ width: 32, height: 32, borderRadius: 16 }}
                            />
                          ) : (
                            <Avatar name={user?.name || 'User'} size="sm" color={colors.indigo[500]} />
                          )}
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
                      backgroundColor: day.isToday
                        ? colors.indigo[500]
                        : isDark ? themeColors.card : themeColors.bgSubtle,
                      borderWidth: day.isToday ? 0 : isDark ? 1 : 0,
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
                        color: day.isToday
                          ? colors.white
                          : themeColors.text,
                      }}
                    >
                      {day.num}
                    </Text>
                    {day.isToday && (
                      <Text
                        style={{
                          fontSize: 8,
                          fontWeight: '500',
                          color: 'rgba(255, 255, 255, 0.8)',
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

        {/* Email Verification Banner */}
        <View className="mt-4">
          <EmailVerificationBanner />
        </View>

        {/* Task List */}
        <DraggableFlatList
          ref={flatListRef}
          data={activeTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          onDragBegin={handleDragBegin}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
          activationDistance={10}
          ListFooterComponent={completedTasks.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setCompletedCollapsed(!completedCollapsed)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                }}
              >
                <Ionicons
                  name={completedCollapsed ? 'chevron-forward' : 'chevron-down'}
                  size={16}
                  color={themeColors.textMuted}
                />
                <Text style={{ color: themeColors.textMuted, fontSize: 13, fontWeight: '500', marginLeft: 4 }}>
                  Completed ({completedTasks.length})
                </Text>
              </TouchableOpacity>
              {!completedCollapsed && completedTasks.map(item => (
                <TaskCard
                  key={item.id}
                  task={item}
                  expanded={expandedTaskId === item.id}
                  onPress={() => handleTaskPress(item.id)}
                  onUndoComplete={() => handleTaskUndoComplete(item.id)}
                  onExpand={() => handleOpenDetail(item)}
                  style={{ marginBottom: 12 }}
                />
              ))}
            </View>
          ) : null}
        />

    </SafeAreaView>
  );
}
