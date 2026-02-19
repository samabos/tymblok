import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, layout, typography } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  centerElement?: React.ReactNode;
  transparent?: boolean;
  style?: ViewStyle;
}

export function Header({
  title,
  subtitle,
  leftElement,
  rightElement,
  centerElement,
  transparent = false,
  style,
}: HeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const themeColors = theme.colors;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing[2],
          backgroundColor: transparent ? 'transparent' : themeColors.bg,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {/* Left section */}
        <View style={styles.leftSection}>{leftElement}</View>

        {/* Center section */}
        <View style={styles.centerSection}>
          {centerElement || (
            <>
              {title && (
                <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text style={[styles.subtitle, { color: themeColors.textMuted }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Right section */}
        <View style={styles.rightSection}>{rightElement}</View>
      </View>
    </View>
  );
}

// Collapsible header variant for Today screen
export interface CollapsibleHeaderProps {
  title: string;
  date?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export function CollapsibleHeader({
  title,
  date,
  leftElement,
  rightElement,
  style,
}: CollapsibleHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const themeColors = theme.colors;

  return (
    <View
      style={[
        styles.collapsibleContainer,
        {
          paddingTop: insets.top + spacing[2],
          backgroundColor: themeColors.bg,
        },
        style,
      ]}
    >
      <View style={styles.collapsibleContent}>
        <View style={styles.titleRow}>
          {leftElement && <View style={styles.leftIcon}>{leftElement}</View>}
          <View style={styles.titleContainer}>
            <Text style={[styles.collapsibleTitle, { color: themeColors.text }]}>{title}</Text>
            {date && <Text style={[styles.date, { color: themeColors.textMuted }]}>{date}</Text>}
          </View>
        </View>
        {rightElement && <View style={styles.rightActions}>{rightElement}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: layout.headerPaddingHorizontal,
    paddingBottom: spacing[2],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.headerHeight - spacing[4],
  },
  leftSection: {
    minWidth: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    marginTop: spacing[0.5],
    textAlign: 'center',
  },

  // Collapsible header styles
  collapsibleContainer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing[3],
  },
  collapsibleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: spacing[3],
  },
  titleContainer: {
    justifyContent: 'center',
  },
  collapsibleTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  date: {
    fontSize: typography.sizes.sm,
    marginTop: spacing[0.5],
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
});
