import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { useAuthStore } from '../../stores/authStore';
import { useInboxItems } from '../../services/apiHooks';

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const themeColors = theme.colors;
  const { isAuthenticated, isLoading, user } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  // Redirect to email verification if email not verified
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !user.email_verified) {
      router.replace('/(auth)/email-verification-pending');
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch inbox items to show badge count (undismissed items)
  const { data: inboxItems } = useInboxItems();
  const inboxBadgeCount = inboxItems?.filter(item => !item.isDismissed).length ?? 0;

  // Don't render tabs while checking auth, if not authenticated, or email not verified
  if (isLoading || !isAuthenticated || (user && !user.email_verified)) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.indigo[500],
        tabBarInactiveTintColor: themeColors.textFaint,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: isDark ? 0 : 1,
          borderTopColor: themeColors.border,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="file-tray-outline"
              color={color}
              focused={focused}
              badge={inboxBadgeCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar-outline" color={color} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () => {
            // Navigate with reset param to trigger date reset
            router.setParams({ reset: Date.now().toString() });
          },
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="bar-chart-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="settings-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  badge?: number;
}

function TabIcon({ name, color, focused: _focused, badge }: TabIconProps) {
  return (
    <View className="items-center justify-center">
      <View className="relative">
        <Ionicons name={name} size={24} color={color} />
        {badge !== undefined && badge > 0 && (
          <View
            className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.status.urgent }}
          >
            <Text className="text-white text-[9px] font-bold">{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
