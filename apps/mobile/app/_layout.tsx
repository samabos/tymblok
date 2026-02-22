import '@expo/metro-runtime';
import '../global.css';
import '../nativewind-setup';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme, PortalProvider } from '@tymblok/ui';
import { verifyInstallation } from 'nativewind';
import { ToastProvider } from '../components/ToastProvider';
import { AlertProvider } from '../components/AlertProvider';
import { useAutoSync } from '../hooks/useAutoSync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry network errors (server unreachable) or auth errors
        if (error && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status === 0 || status === 401 || status === 403) return false;
        }
        // Retry server errors up to 2 times
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});

function RootNavigator() {
  const { theme, isDark } = useTheme();
  const bgColor = theme.colors.bg;

  // Auto-sync integrations on app foreground
  useAutoSync();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bgColor }}>
      <PortalProvider>
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
            name="integrations"
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
            name="reset-password"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="verify-email"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name="(settings)" />
          <Stack.Screen name="(inbox)" />
        </Stack>
      </PortalProvider>
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
        <AlertProvider>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </AlertProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
