import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { useAuthStore } from '../../stores/authStore';

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const themeColors = theme.colors;
  const { isAuthenticated, isLoading } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  // Don't render tabs while checking auth or if not authenticated
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.indigo[400],
        tabBarInactiveTintColor: themeColors.textFaint,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
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
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="file-tray-outline" color={color} focused={focused} badge={5} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarButton: () => <AddButton />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/add-task');
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

function AddButton() {
  const handlePress = () => {
    router.push('/add-task');
  };

  return (
    <View className="flex-1 items-center justify-center" style={{ marginTop: -10 }}>
      <TouchableOpacity
        onPress={handlePress}
        className="w-12 h-12 rounded-2xl items-center justify-center"
        style={{
          backgroundColor: colors.indigo[500],
          shadowColor: colors.indigo[500],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>
      <Text
        className="text-[10px] font-medium mt-1"
        style={{ color: colors.indigo[400] }}
      >
        Add
      </Text>
    </View>
  );
}
