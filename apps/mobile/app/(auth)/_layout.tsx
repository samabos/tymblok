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
    </Stack>
  );
}
