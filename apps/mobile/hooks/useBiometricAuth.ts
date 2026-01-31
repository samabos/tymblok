import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export function useBiometricAuth() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);

  useEffect(() => {
    checkBiometricAvailability();
    loadBiometricPreference();
  }, []);

  const checkBiometricAvailability = async () => {
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
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    setIsEnabled(enabled === 'true');
  };

  const enableBiometric = async () => {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    setIsEnabled(true);
  };

  const disableBiometric = async () => {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
    setIsEnabled(false);
  };

  const authenticate = useCallback(async (promptMessage?: string): Promise<boolean> => {
    if (!isAvailable) {
      return true; // Skip if biometrics not available
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Verify your identity',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  }, [isAvailable]);

  return {
    isAvailable,
    isEnabled,
    biometricType,
    authenticate,
    enableBiometric,
    disableBiometric,
  };
}
