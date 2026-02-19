import React from 'react';
import { View, Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, layout, typography, springConfig } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type TabKey = 'today' | 'inbox' | 'add' | 'stats' | 'settings';

export interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number;
}

export interface BottomNavProps {
  tabs: TabItem[];
  activeTab: TabKey;
  onTabPress: (key: TabKey) => void;
  onAddPress?: () => void;
  style?: ViewStyle;
}

export function BottomNav({ tabs, activeTab, onTabPress, onAddPress, style }: BottomNavProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const themeColors = theme.colors;

  const paddingBottom = Math.max(insets.bottom, spacing[4]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
          paddingBottom,
        },
        style,
      ]}
    >
      {tabs.map(tab => {
        if (tab.key === 'add') {
          return (
            <AddButton
              key={tab.key}
              icon={tab.icon}
              onPress={onAddPress || (() => onTabPress('add'))}
            />
          );
        }

        return (
          <TabButton
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onPress={() => onTabPress(tab.key)}
            themeColors={themeColors}
          />
        );
      })}
    </View>
  );
}

interface TabButtonProps {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  themeColors: any;
}

function TabButton({ tab, isActive, onPress, themeColors }: TabButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, springConfig.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig.snappy);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const iconColor = isActive ? colors.indigo[500] : themeColors.textFaint;
  const labelColor = isActive ? colors.indigo[500] : themeColors.textFaint;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabButton, animatedStyle]}
    >
      <View style={styles.iconContainer}>
        {React.isValidElement(tab.icon) &&
          React.cloneElement(tab.icon as React.ReactElement, {
            color: iconColor,
          })}
        {isActive && tab.activeIcon
          ? React.isValidElement(tab.activeIcon) &&
            React.cloneElement(tab.activeIcon as React.ReactElement, {
              color: iconColor,
            })
          : null}
        {tab.badge !== undefined && tab.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, { color: labelColor }, isActive && styles.labelActive]}>
        {tab.label}
      </Text>
    </AnimatedPressable>
  );
}

interface AddButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
}

function AddButton({ icon, onPress }: AddButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, springConfig.bouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig.bouncy);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.addButton, animatedStyle]}
    >
      <View style={styles.addButtonInner}>
        {React.isValidElement(icon) &&
          React.cloneElement(icon as React.ReactElement, {
            color: colors.white,
          })}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: spacing[2],
    borderTopWidth: 1,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    minWidth: 56,
  },
  iconContainer: {
    position: 'relative',
    width: layout.bottomNavIconSize,
    height: layout.bottomNavIconSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginTop: spacing[0.5],
  },
  labelActive: {
    fontWeight: typography.weights.semibold,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.status.urgent,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    marginTop: -spacing[3],
  },
  addButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.indigo[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.indigo[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
