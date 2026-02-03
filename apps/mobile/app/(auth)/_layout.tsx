import { Stack } from 'expo-router';
import { useTheme } from '@tymblok/ui';

export default function AuthLayout() {
  const { theme } = useTheme();
  const bgColor = theme.colors.bg;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 250,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        contentStyle: { backgroundColor: bgColor },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen
        name="register"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="callback"
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="set-password"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="linked-accounts"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="sessions"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
