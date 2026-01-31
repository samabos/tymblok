import { View, Text, TouchableOpacity, Switch } from 'react-native';

interface SettingsRowProps {
  label: string;
  onPress?: () => void;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  showSwitch?: boolean;
  subtitle?: string;
  disabled?: boolean;
}

export function SettingsRow({
  label,
  onPress,
  value,
  onValueChange,
  showSwitch = false,
  subtitle,
  disabled = false,
}: SettingsRowProps) {
  const content = (
    <View className="flex-row items-center justify-between p-4">
      <View className="flex-1">
        <Text className={`${disabled ? 'text-gray-400' : 'text-gray-900'}`}>{label}</Text>
        {subtitle && <Text className="text-gray-500 text-sm mt-1">{subtitle}</Text>}
      </View>
      {showSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: '#d1d5db', true: '#7c3aed' }}
          thumbColor={value ? '#ffffff' : '#f4f4f5'}
        />
      ) : onPress ? (
        <Text testID="chevron-icon" className="text-gray-400 text-lg">›</Text>
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
