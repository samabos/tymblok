import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { Ionicons } from '@expo/vector-icons';

export interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
}

export function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  showSwitch,
  value,
  onValueChange,
  disabled,
}: SettingsRowProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const content = (
    <View className="p-4 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3 flex-1">
        <View
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: themeColors.input }}
        >
          <Ionicons name={icon} size={18} color={themeColors.textMuted} />
        </View>
        <View className="flex-1">
          <Text
            className="font-medium"
            style={{ color: disabled ? themeColors.textFaint : themeColors.text }}
          >
            {label}
          </Text>
          {sublabel && (
            <Text className="text-sm" style={{ color: themeColors.textMuted }}>
              {sublabel}
            </Text>
          )}
        </View>
      </View>
      {showSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: themeColors.input, true: colors.indigo[500] }}
          thumbColor={colors.white}
        />
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={18} color={themeColors.textFaint} />
      ) : null}
    </View>
  );

  if (onPress && !showSwitch) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
