import { Stack } from 'expo-router';
import { useTheme } from '@tymblok/ui';

export default function InboxGroupLayout() {
  const { theme } = useTheme();
  const bgColor = theme.colors.bg;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        contentStyle: { backgroundColor: bgColor },
      }}
    />
  );
}
