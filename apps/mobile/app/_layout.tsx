import '@expo/metro-runtime';
import '../global.css';
import '../nativewind-setup';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@tymblok/ui';
import { verifyInstallation } from 'nativewind';

const queryClient = new QueryClient();

function RootNavigator() {
  const { theme, isDark } = useTheme();
  const bgColor = theme.colors.bg;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          contentStyle: { backgroundColor: bgColor },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="(tabs)"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: bgColor },
          }}
        />
        <Stack.Screen
          name="integrations"
          options={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: bgColor },
          }}
        />
        <Stack.Screen
          name="add-task"
          options={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: bgColor },
          }}
        />
        <Stack.Screen
          name="task/[id]"
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="change-password"
          options={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: bgColor },
          }}
        />
        <Stack.Screen
          name="linked-accounts"
          options={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: bgColor },
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  // Debug: verify NativeWind installation
  if (__DEV__) {
    verifyInstallation();
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultMode="dark">
        <RootNavigator />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
