import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@tymblok/ui';
import { spacing, borderRadius, typography, colors } from '@tymblok/theme';

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertConfig {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface AlertContextValue {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string
  ) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
}

const ICON_MAP: Record<AlertType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { name: 'checkmark-circle', color: colors.status.done },
  error: { name: 'alert-circle', color: colors.status.urgent },
  warning: { name: 'warning', color: colors.priority.medium },
  info: { name: 'information-circle', color: colors.indigo[500] },
  confirm: { name: 'help-circle', color: colors.indigo[500] },
};

function inferType(title: string, buttons?: AlertButton[]): AlertType {
  const t = title.toLowerCase();
  if (t.includes('success') || t.includes('added') || t.includes('saved') || t.includes('complete')) return 'success';
  if (t.includes('error') || t.includes('failed')) return 'error';
  if (t.includes('warning') || t.includes('permission')) return 'warning';
  if (buttons && buttons.length > 1) return 'confirm';
  return 'info';
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const show = useCallback((cfg: AlertConfig) => {
    setConfig(cfg);
  }, []);

  const hide = useCallback((callback?: () => void) => {
    setConfig(null);
    callback?.();
  }, []);

  const alert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      const type = inferType(title, buttons);
      show({ title, message, type, buttons: buttons ?? [{ text: 'OK', style: 'default' }] });
    },
    [show]
  );

  const success = useCallback(
    (title: string, message?: string) => {
      show({ title, message, type: 'success', buttons: [{ text: 'OK', style: 'default' }] });
    },
    [show]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      show({ title, message, type: 'error', buttons: [{ text: 'OK', style: 'default' }] });
    },
    [show]
  );

  const confirm = useCallback(
    (title: string, message: string, onConfirm: () => void, confirmText = 'Confirm') => {
      show({
        title,
        message,
        type: 'confirm',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: confirmText, style: 'default', onPress: onConfirm },
        ],
      });
    },
    [show]
  );

  return (
    <AlertContext.Provider value={{ alert, success, error, confirm }}>
      <View style={styles.root}>
        {children}
        {config && <AlertOverlay config={config} onDismiss={hide} />}
      </View>
    </AlertContext.Provider>
  );
}

function AlertOverlay({
  config,
  onDismiss,
}: {
  config: AlertConfig;
  onDismiss: (cb?: () => void) => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const type = config.type ?? 'info';
  const icon = ICON_MAP[type];
  const buttons = config.buttons ?? [{ text: 'OK', style: 'default' }];

  const handlePress = (btn: AlertButton) => {
    onDismiss(btn.onPress);
  };

  const handleBackdrop = () => {
    if (buttons.length <= 1) onDismiss();
  };

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleBackdrop}
      />

      {/* Card */}
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[styles.iconCircle, { backgroundColor: icon.color + '18' }]}>
          <Ionicons name={icon.name} size={32} color={icon.color} />
        </View>

        <Text style={[styles.title, { color: c.text }]}>{config.title}</Text>

        {config.message ? (
          <Text style={[styles.message, { color: c.textMuted }]}>{config.message}</Text>
        ) : null}

        <View style={styles.buttonRow}>
          {buttons.map((btn, i) => {
            const isCancel = btn.style === 'cancel';
            const isDestructive = btn.style === 'destructive';

            return (
              <TouchableOpacity
                key={i}
                onPress={() => handlePress(btn)}
                activeOpacity={0.8}
                style={[
                  styles.button,
                  buttons.length === 1 && styles.buttonFull,
                  {
                    backgroundColor: isCancel
                      ? c.input
                      : isDestructive
                        ? colors.status.urgent
                        : colors.indigo[500],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: isCancel ? c.textMuted : colors.white },
                  ]}
                >
                  {btn.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[5],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
    marginTop: spacing[2],
  },
  button: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  buttonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
});
