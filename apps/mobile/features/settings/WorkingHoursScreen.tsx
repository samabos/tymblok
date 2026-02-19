import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../stores/authStore';
import { useUpdateSettings } from '../../services/apiHooks';
import { useTheme, Card } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeDisplay } from '../../utils/formatTime';
import { useAlert } from '../../components/AlertProvider';

const LUNCH_DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
];

type TimeField = 'workStart' | 'workEnd' | 'lunchStart';

export default function WorkingHoursScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const { error: showError } = useAlert();
  const { mutateAsync: updateSettings, isPending } = useUpdateSettings();

  const [workStart, setWorkStart] = useState(user?.working_hours_start ?? '09:00');
  const [workEnd, setWorkEnd] = useState(user?.working_hours_end ?? '18:00');
  const [lunchStart, setLunchStart] = useState(user?.lunch_start ?? '12:00');
  const [lunchDuration, setLunchDuration] = useState(user?.lunch_duration_minutes ?? 60);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeField, setActiveField] = useState<TimeField>('workStart');

  const hasChanges =
    workStart !== (user?.working_hours_start ?? '09:00') ||
    workEnd !== (user?.working_hours_end ?? '18:00') ||
    lunchStart !== (user?.lunch_start ?? '12:00') ||
    lunchDuration !== (user?.lunch_duration_minutes ?? 60);

  const openPicker = (field: TimeField) => {
    setActiveField(field);
    setPickerVisible(true);
  };

  const getActiveValue = (): string => {
    switch (activeField) {
      case 'workStart':
        return workStart;
      case 'workEnd':
        return workEnd;
      case 'lunchStart':
        return lunchStart;
    }
  };

  const setActiveValue = (time: string) => {
    switch (activeField) {
      case 'workStart':
        setWorkStart(time);
        break;
      case 'workEnd':
        setWorkEnd(time);
        break;
      case 'lunchStart':
        setLunchStart(time);
        break;
    }
  };

  const timeToDate = (time: string): Date => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const handlePickerChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') setPickerVisible(false);
    if (selectedDate) {
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      setActiveValue(`${hours}:${minutes}`);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings({
        workingHoursStart: workStart,
        workingHoursEnd: workEnd,
        lunchStart: lunchStart,
        lunchDurationMinutes: lunchDuration,
      });
      updateUser({
        working_hours_start: workStart,
        working_hours_end: workEnd,
        lunch_start: lunchStart,
        lunch_duration_minutes: lunchDuration,
      });
      router.back();
    } catch {
      showError('Error', 'Failed to save working hours. Please try again.');
    }
  };

  const timeRows: {
    label: string;
    sublabel: string;
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    field: TimeField;
  }[] = [
    {
      label: 'Work Start',
      sublabel: 'When your work day begins',
      icon: 'sunny-outline',
      value: workStart,
      field: 'workStart',
    },
    {
      label: 'Work End',
      sublabel: 'When your work day ends',
      icon: 'moon-outline',
      value: workEnd,
      field: 'workEnd',
    },
    {
      label: 'Lunch Start',
      sublabel: 'When your lunch break starts',
      icon: 'restaurant-outline',
      value: lunchStart,
      field: 'lunchStart',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold" style={{ color: themeColors.text }}>
            Working Hours
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: themeColors.textMuted }}>
            Set your daily work schedule
          </Text>
        </View>
      </View>

      <View className="flex-1 px-5 pt-4">
        {/* Time Settings */}
        <Card variant="default" padding="none">
          {timeRows.map((row, index) => (
            <View key={row.field}>
              {index > 0 && <View style={{ borderTopWidth: 1, borderColor: themeColors.border }} />}
              <TouchableOpacity
                className="p-4 flex-row items-center justify-between"
                onPress={() => openPicker(row.field)}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: themeColors.input }}
                  >
                    <Ionicons name={row.icon} size={18} color={themeColors.textMuted} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium" style={{ color: themeColors.text }}>
                      {row.label}
                    </Text>
                    <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                      {row.sublabel}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="font-medium" style={{ color: colors.indigo[500] }}>
                    {formatTimeDisplay(row.value)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={themeColors.textFaint} />
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </Card>

        {/* Lunch Duration */}
        <View className="mt-4">
          <Card variant="default" padding="none">
            <View className="p-4">
              <View className="flex-row items-center gap-3 mb-3">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: themeColors.input }}
                >
                  <Ionicons name="time-outline" size={18} color={themeColors.textMuted} />
                </View>
                <View>
                  <Text className="font-medium" style={{ color: themeColors.text }}>
                    Lunch Duration
                  </Text>
                  <Text className="text-sm" style={{ color: themeColors.textMuted }}>
                    How long is your lunch break
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-2">
                {LUNCH_DURATION_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setLunchDuration(option.value)}
                    className="flex-1 py-2.5 rounded-xl items-center"
                    style={{
                      backgroundColor:
                        lunchDuration === option.value ? colors.indigo[500] : themeColors.input,
                    }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color:
                          lunchDuration === option.value ? colors.white : themeColors.textMuted,
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        </View>

        {/* Save Button */}
        {hasChanges && (
          <TouchableOpacity
            className="mt-6 p-4 rounded-2xl items-center"
            style={{ backgroundColor: colors.indigo[500], opacity: isPending ? 0.6 : 1 }}
            onPress={handleSave}
            disabled={isPending}
          >
            <Text className="font-semibold" style={{ color: colors.white }}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Time Picker */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={pickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerVisible(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
            activeOpacity={1}
            onPress={() => setPickerVisible(false)}
          />
          <View
            style={{
              backgroundColor: themeColors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 40,
            }}
          >
            <View className="flex-row justify-between items-center px-5 pt-4 pb-2">
              <Text className="text-lg font-semibold" style={{ color: themeColors.text }}>
                Select Time
              </Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Text className="font-semibold text-base" style={{ color: colors.indigo[500] }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={timeToDate(getActiveValue())}
              mode="time"
              is24Hour={false}
              minuteInterval={5}
              display="spinner"
              onChange={handlePickerChange}
              themeVariant={themeColors.bg === '#0f172a' || themeColors.bg === '#1e293b' ? 'dark' : 'light'}
            />
          </View>
        </Modal>
      ) : (
        pickerVisible && (
          <DateTimePicker
            value={timeToDate(getActiveValue())}
            mode="time"
            is24Hour={false}
            minuteInterval={5}
            display="default"
            onChange={handlePickerChange}
          />
        )
      )}
    </SafeAreaView>
  );
}
