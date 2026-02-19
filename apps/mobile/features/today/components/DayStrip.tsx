import { View, Text, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useTheme } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import type { DayInfo } from '../hooks/useDayNavigation';

interface DayStripProps {
  days: DayInfo[];
  isDark: boolean;
  onNavigateDay: (offset: number) => void;
  style?: Animated.AnimateStyle<Record<string, unknown>>;
}

function getDayStyle(offset: number) {
  const absOffset = Math.abs(offset);
  if (absOffset === 0) return { size: 48, fontSize: 16, opacity: 1 };
  if (absOffset === 1) return { size: 40, fontSize: 14, opacity: 0.8 };
  if (absOffset === 2) return { size: 32, fontSize: 12, opacity: 0.6 };
  return { size: 28, fontSize: 12, opacity: 0.4 };
}

export function DayStrip({ days, isDark, onNavigateDay, style }: DayStripProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd(event => {
      const SWIPE_THRESHOLD = 50;
      if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(onNavigateDay)(1);
      } else if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(onNavigateDay)(-1);
      }
    });

  return (
    <Animated.View style={style}>
      <GestureDetector gesture={swipeGesture}>
        <Animated.View className="flex-row items-center justify-center gap-1.5 px-5 pb-4">
          {days.map((day, i) => {
            const dayStyle = getDayStyle(day.offset);
            return (
              <TouchableOpacity
                key={i}
                onPress={() => onNavigateDay(day.offset)}
                accessibilityLabel={`${day.isToday ? 'Today, ' : ''}Day ${day.num}`}
                accessibilityRole="button"
                style={{
                  width: dayStyle.size,
                  height: dayStyle.size,
                  borderRadius: dayStyle.size / 2,
                  backgroundColor: day.isToday
                    ? colors.indigo[500]
                    : isDark
                      ? themeColors.card
                      : themeColors.bgSubtle,
                  borderWidth: day.isToday ? 0 : isDark ? 1 : 0,
                  borderColor: themeColors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: dayStyle.opacity,
                  shadowColor: day.isToday ? colors.indigo[500] : 'transparent',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: day.isToday ? 0.3 : 0,
                  shadowRadius: 8,
                  elevation: day.isToday ? 4 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: dayStyle.fontSize,
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
  );
}
