import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

// Helper functions for web compatibility
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
};

export function useBiometricAuth() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);

  useEffect(() => {
    // Biometrics not available on web
    if (Platform.OS === 'web') {
      setIsAvailable(false);
      setIsEnabled(false);
      return;
    }
    checkBiometricAvailability();
    loadBiometricPreference();
  }, []);

  const checkBiometricAvailability = async () => {
    if (Platform.OS === 'web') {
      setIsAvailable(false);
      return;
    }
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsAvailable(compatible && enrolled);

    if (compatible && enrolled) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Fingerprint');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('Iris');
      }
    }
  };

  const loadBiometricPreference = async () => {
    const enabled = await getStorageItem(BIOMETRIC_ENABLED_KEY);
    setIsEnabled(enabled === 'true');
  };

  const enableBiometric = async () => {
    await setStorageItem(BIOMETRIC_ENABLED_KEY, 'true');
    setIsEnabled(true);
  };

  const disableBiometric = async () => {
    await setStorageItem(BIOMETRIC_ENABLED_KEY, 'false');
    setIsEnabled(false);
  };

  const authenticate = useCallback(async (promptMessage?: string): Promise<boolean> => {
    // Always pass on web since there's no biometric support
    if (Platform.OS === 'web' || !isAvailable) {
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Verify your identity',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  }, [isAvailable]);

  /**
   * Authenticate for sensitive actions (only if biometric is enabled by user).
   * Returns true if auth passed or biometric is not enabled.
   * @param actionName - Description of the action requiring authentication
   */
  const authenticateForSensitiveAction = useCallback(async (actionName: string): Promise<boolean> => {
    // Skip if biometric is not enabled or not available
    if (!isEnabled || !isAvailable || Platform.OS === 'web') {
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Authenticate to ${actionName}`,
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  }, [isAvailable, isEnabled]);

  return {
    isAvailable,
    isEnabled,
    biometricType,
    authenticate,
    authenticateForSensitiveAction,
    enableBiometric,
    disableBiometric,
  };
}
