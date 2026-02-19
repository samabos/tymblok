import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface DayInfo {
  label: string;
  num: number;
  isToday: boolean;
  offset: number;
}

export function useDayNavigation() {
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Reset to today whenever the tab is pressed
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

  const currentDateStr = useMemo(() => currentDate.toISOString().split('T')[0], [currentDate]);

  const formatDateHeader = useMemo(() => {
    const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return { weekday, monthDay };
  }, [currentDate]);

  const daysCenteredOnToday = useMemo(() => {
    const days: DayInfo[] = [];
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

  const navigateDay = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset);
    setCurrentDate(newDate);
  };

  return {
    currentDate,
    currentDateStr,
    formatDateHeader,
    daysCenteredOnToday,
    navigateDay,
  };
}
