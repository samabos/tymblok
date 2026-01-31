import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography, layout } from '@tymblok/theme';
import { useTheme } from '../../context/ThemeContext';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

export function Avatar({ name, imageUrl, size = 'md', style }: AvatarProps) {
  const { isDark, theme } = useTheme();
  const themeColors = theme.colors;

  const initials = getInitials(name);
  const sizeStyles = getSizeStyles(size);
  const backgroundColor = getBackgroundColor(name);

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.base, sizeStyles.container, style]}
      />
    );
  }

  return (
    <View style={[styles.base, sizeStyles.container, { backgroundColor }, style]}>
      <Text style={[styles.text, sizeStyles.text, { color: colors.white }]}>
        {initials}
      </Text>
    </View>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getBackgroundColor(name: string): string {
  // Generate a consistent color based on the name
  const colorOptions = [
    colors.indigo[500],
    colors.purple[500],
    colors.taskType.github,
    colors.taskType.jira,
    colors.taskType.focus,
    colors.status.live,
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorOptions.length;
  return colorOptions[index];
}

function getSizeStyles(size: AvatarSize) {
  const sizes = {
    sm: {
      container: {
        width: layout.avatarSizeSm,
        height: layout.avatarSizeSm,
        borderRadius: layout.avatarSizeSm / 2,
      } as ViewStyle,
      text: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.semibold,
      },
    },
    md: {
      container: {
        width: layout.avatarSizeMd,
        height: layout.avatarSizeMd,
        borderRadius: layout.avatarSizeMd / 2,
      } as ViewStyle,
      text: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.semibold,
      },
    },
    lg: {
      container: {
        width: layout.avatarSizeLg,
        height: layout.avatarSizeLg,
        borderRadius: layout.avatarSizeLg / 2,
      } as ViewStyle,
      text: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.semibold,
      },
    },
    xl: {
      container: {
        width: layout.avatarSizeXl,
        height: layout.avatarSizeXl,
        borderRadius: layout.avatarSizeXl / 2,
      } as ViewStyle,
      text: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.semibold,
      },
    },
  };

  return sizes[size];
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    textAlign: 'center',
  },
});
