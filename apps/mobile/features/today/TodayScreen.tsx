import { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
import { useTheme, TaskCard, Avatar, AddTaskModal, type TaskCardData } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { useAuthStore } from '../../stores/authStore';
import { EmailVerificationBanner } from '../../components/EmailVerificationBanner';
import { useFocusEffect } from 'expo-router';
import {
  useBlocks,
  useUpdateBlock,
  useCompleteBlock,
  useStartBlock,
  usePauseBlock,
  useUpdateBlocksSortOrder,
  useCarryOver,
  useCreateBlock,
  useCategories,
} from '../../services/apiHooks';
import { Ionicons } from '@expo/vector-icons';
import { useBlockTimer } from './hooks/useBlockTimer';
import { useDayNavigation } from './hooks/useDayNavigation';
import { DayStrip } from './components/DayStrip';

export default function TodayScreen() {
  const { theme, isDark } = useTheme();
  const themeColors = theme.colors;
  const { user } = useAuthStore();

  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [completedCollapsed, setCompletedCollapsed] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flatListRef = useRef<any>(null);
  const expandAnimation = useSharedValue(0);

  // Day navigation
  const { currentDate, currentDateStr, formatDateHeader, daysCenteredOnToday, navigateDay } = useDayNavigation();

  // Carry over uncompleted past blocks before fetching today's blocks
  const [carryOverDone, setCarryOverDone] = useState(false);
  const carryOverMutation = useCarryOver();
  const carryOverCalledRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!carryOverCalledRef.current) {
        carryOverCalledRef.current = true;
        carryOverMutation.mutate(undefined, {
          onSuccess: () => setCarryOverDone(true),
          onError: () => setCarryOverDone(true), // Don't block UI on failure
        });
      }
      return () => {
        carryOverCalledRef.current = false;
        setCarryOverDone(false);
      };
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Fetch blocks from API only after carryOver completes (prevents race condition)
  const { data: blocks, isLoading, error, refetch } = useBlocks(
    { date: currentDateStr },
    { enabled: carryOverDone },
  );
  const updateBlockMutation = useUpdateBlock();
  const completeBlockMutation = useCompleteBlock();
  const startBlockMutation = useStartBlock();
  const pauseBlockMutation = usePauseBlock();
  const updateSortOrderMutation = useUpdateBlocksSortOrder();
  const createBlockMutation = useCreateBlock();
  const { data: categories } = useCategories();

  // Timer and task mapping
  const { allTasks, activeTasks, completedTasks } = useBlockTimer(blocks);

  const taskStats = useMemo(
    () => ({
      total: allTasks.length,
      completed: completedTasks.length,
    }),
    [allTasks, completedTasks]
  );

  // Header gestures
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

  const headerTapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(toggleHeader)();
  });

  const headerPanGesture = Gesture.Pan().onEnd(event => {
    const SWIPE_THRESHOLD = 30;
    if (event.translationY > SWIPE_THRESHOLD) runOnJS(expandHeader)();
    else if (event.translationY < -SWIPE_THRESHOLD) runOnJS(collapseHeader)();
  });

  const headerGesture = Gesture.Race(headerPanGesture, headerTapGesture);

  const daySelectorStyle = useAnimatedStyle(() => ({
    height: interpolate(expandAnimation.value, [0, 1], [0, 60]),
    opacity: expandAnimation.value,
    overflow: 'hidden',
  }));

  // Task actions
  const handleTaskComplete = (taskId: string) => {
    completeBlockMutation.mutate(taskId);
    setExpandedTaskId(null);
  };

  const handleTaskUndoComplete = (taskId: string) => {
    updateBlockMutation.mutate({ id: taskId, data: { isCompleted: false } });
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

    if (isExpanding) {
      const taskIndex = activeTasks.findIndex(t => t.id === taskId);
      if (taskIndex >= 0 && flatListRef.current) {
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: taskIndex,
              animated: true,
              viewPosition: 0.3,
            });
          } catch {
            /* Ignore scroll errors */
          }
        }, 100);
      }
    }
  };

  const handleDragEnd = ({ data }: { data: TaskCardData[] }) => {
    updateSortOrderMutation.mutate(data.map((task, index) => ({ id: task.id, sortOrder: index })));
  };

  const handleDragBegin = () => {
    setExpandedTaskId(null);
  };

  const handleAddBlock = (task: {
    title: string;
    startTime: string;
    duration: number;
    category: string;
    categoryId?: string;
  }) => {
    const categoryId = task.categoryId || categories?.[0]?.id;
    if (!categoryId) return;

    createBlockMutation.mutate({
      title: task.title,
      categoryId,
      date: currentDateStr,
      startTime: task.startTime,
      durationMinutes: task.duration,
    });
  };

  const handleOpenDetail = (task: TaskCardData) => {
    setExpandedTaskId(null);
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
    ({ item, drag, isActive }: RenderItemParams<TaskCardData>) => (
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
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expandedTaskId]
  );

  if (!carryOverDone || isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.indigo[500]} />
          <Text style={{ color: themeColors.textMuted, marginTop: 16 }}>Loading tasks...</Text>
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
            Failed to load tasks
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
        <GestureDetector gesture={headerGesture}>
          <Animated.View
            accessibilityLabel={`${formatDateHeader.weekday}, ${formatDateHeader.monthDay}. ${taskStats.total} tasks, ${taskStats.completed} done. Tap to ${headerExpanded ? 'collapse' : 'expand'} day selector`}
            accessibilityRole="button"
          >
            <View className="px-5 pt-6 pb-3">
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="text-xs font-medium" style={{ color: themeColors.textMuted }}>
                    {formatDateHeader.weekday}
                  </Text>
                  <Text className="text-2xl font-bold mt-0.5" style={{ color: themeColors.text }}>
                    {formatDateHeader.monthDay}
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: themeColors.textMuted }}>
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
                          <Avatar
                            name={user?.name || 'User'}
                            size="sm"
                            color={colors.indigo[500]}
                          />
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

        {/* Day Selector */}
        <DayStrip
          days={daysCenteredOnToday}
          isDark={isDark}
          onNavigateDay={navigateDay}
          style={daySelectorStyle}
        />
      </View>

      {/* Email Verification Banner */}
      <View className="mt-4">
        <EmailVerificationBanner />
      </View>

      {/* Task List */}
      <DraggableFlatList
        ref={flatListRef}
        data={activeTasks}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        onDragBegin={handleDragBegin}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        activationDistance={10}
        ListFooterComponent={
          <View style={{ marginTop: 8, marginBottom: 100 }}>
            {/* Add Block Card */}
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
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
                marginBottom: 12,
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={22}
                color={themeColors.textMuted}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: themeColors.textMuted, fontSize: 14, fontWeight: '500' }}>
                Add a block
              </Text>
            </TouchableOpacity>

            {/* Completed Section */}
            {completedTasks.length > 0 && (
              <>
                <TouchableOpacity
                  onPress={() => setCompletedCollapsed(!completedCollapsed)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
                >
                  <Ionicons
                    name={completedCollapsed ? 'chevron-forward' : 'chevron-down'}
                    size={16}
                    color={themeColors.textMuted}
                  />
                  <Text
                    style={{
                      color: themeColors.textMuted,
                      fontSize: 13,
                      fontWeight: '500',
                      marginLeft: 4,
                    }}
                  >
                    Completed ({completedTasks.length})
                  </Text>
                </TouchableOpacity>
                {!completedCollapsed &&
                  completedTasks.map(item => (
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
              </>
            )}
          </View>
        }
      />

      {/* Add Block Modal */}
      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddBlock}
        initialDate={currentDate}
        apiCategories={categories?.filter(c => c.isSystem).map(c => ({ id: c.id, name: c.name, color: c.color }))}
      />
    </SafeAreaView>
  );
}
