import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { RecurrenceType } from '@tymblok/api-client';

export interface RecurrenceConfig {
  isRecurring: boolean;
  recurrenceType: RecurrenceType | null;
  recurrenceInterval: number;
  recurrenceEndDate: string | null;
}

interface RecurrencePickerProps {
  value: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
}

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const [showModal, setShowModal] = useState(false);

  const getRecurrenceLabel = () => {
    if (!value.isRecurring || !value.recurrenceType) {
      return 'Does not repeat';
    }

    const intervalText = value.recurrenceInterval > 1 ? ` (every ${value.recurrenceInterval})` : '';

    switch (value.recurrenceType) {
      case RecurrenceType.Daily:
        return `Daily${intervalText}`;
      case RecurrenceType.Weekly:
        return `Weekly${intervalText}`;
      case RecurrenceType.Monthly:
        return `Monthly${intervalText}`;
      default:
        return 'Does not repeat';
    }
  };

  const handleSelectType = (type: RecurrenceType | null) => {
    if (type === null) {
      onChange({
        isRecurring: false,
        recurrenceType: null,
        recurrenceInterval: 1,
        recurrenceEndDate: null,
      });
    } else {
      onChange({
        ...value,
        isRecurring: true,
        recurrenceType: type,
      });
    }
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: themeColors.input,
          borderRadius: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="repeat-outline" size={20} color={themeColors.textMuted} />
          <Text style={{ fontSize: 16, color: themeColors.text }}>{getRecurrenceLabel()}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View
            style={{
              backgroundColor: themeColors.bg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 40,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: themeColors.border,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: themeColors.text }}>
                Repeat
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <ScrollView style={{ maxHeight: 400 }}>
              <RecurrenceOption
                label="Does not repeat"
                selected={!value.isRecurring}
                onPress={() => handleSelectType(null)}
                themeColors={themeColors}
              />
              <RecurrenceOption
                label="Daily"
                selected={value.isRecurring && value.recurrenceType === RecurrenceType.Daily}
                onPress={() => handleSelectType(RecurrenceType.Daily)}
                themeColors={themeColors}
              />
              <RecurrenceOption
                label="Weekly"
                selected={value.isRecurring && value.recurrenceType === RecurrenceType.Weekly}
                onPress={() => handleSelectType(RecurrenceType.Weekly)}
                themeColors={themeColors}
              />
              <RecurrenceOption
                label="Monthly"
                selected={value.isRecurring && value.recurrenceType === RecurrenceType.Monthly}
                onPress={() => handleSelectType(RecurrenceType.Monthly)}
                themeColors={themeColors}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

interface RecurrenceOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  themeColors: Record<string, string>;
}

function RecurrenceOption({ label, selected, onPress, themeColors }: RecurrenceOptionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: selected ? colors.indigo[500] + '10' : 'transparent',
      }}
    >
      <Text
        style={{
          fontSize: 16,
          color: selected ? colors.indigo[500] : themeColors.text,
          fontWeight: selected ? '600' : '400',
        }}
      >
        {label}
      </Text>
      {selected && <Ionicons name="checkmark" size={24} color={colors.indigo[500]} />}
    </TouchableOpacity>
  );
}
