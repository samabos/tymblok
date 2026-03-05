import '@expo/metro-runtime';
import '../global.css';
import '../nativewind-setup';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme, PortalProvider } from '@tymblok/ui';
import { verifyInstallation } from 'nativewind';
import { ToastProvider } from '../components/ToastProvider';
import { AlertProvider } from '../components/AlertProvider';
import { useAutoSync } from '../hooks/useAutoSync';
import { useAuthStore } from '../stores/authStore';
import { signalrService } from '../services/signalrService';

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

// Wire SignalR to the shared QueryClient (singleton, safe to call at module level)
signalrService.setQueryClient(queryClient);

function RootNavigator() {
  const { theme, isDark } = useTheme();
  const bgColor = theme.colors.bg;
  const { isAuthenticated } = useAuthStore();

  // Connect/disconnect SignalR with auth state
  useEffect(() => {
    if (isAuthenticated) {
      signalrService.connect();
    } else {
      signalrService.disconnect();
    }
    return () => { signalrService.disconnect(); };
  }, [isAuthenticated]);

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
