import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

describe('useBiometricAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useBiometricAuth());

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(false);
      expect(result.current.isEnabled).toBe(false);
      expect(result.current.biometricType).toBeNull();
    });
  });

  it('should detect Face ID when available', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useBiometricAuth());

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(true);
      expect(result.current.biometricType).toBe('Face ID');
    });
  });

  it('should detect Fingerprint when available', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useBiometricAuth());

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(true);
      expect(result.current.biometricType).toBe('Fingerprint');
    });
  });

  it('should load enabled state from SecureStore', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('true');

    const { result } = renderHook(() => useBiometricAuth());

    await waitFor(() => {
      expect(result.current.isEnabled).toBe(true);
    });
  });

  it('should enable biometric and save to SecureStore', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('false');

    const { result } = renderHook(() => useBiometricAuth());

    await waitFor(() => {
      expect(result.current.isEnabled).toBe(false);
    });

    await act(async () => {
      await result.current.enableBiometric();
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('biometric_enabled', 'true');
    expect(result.current.isEnabled).toBe(true);
  });

  it('should disable biometric and save to SecureStore', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('true');

    const { result } = renderHook(() => useBiometricAuth());

    await waitFor(() => {
      expect(result.current.isEnabled).toBe(true);
    });

    await act(async () => {
      await result.current.disableBiometric();
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('biometric_enabled', 'false');
    expect(result.current.isEnabled).toBe(false);
  });

  it('should authenticate successfully', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useBiometricAuth());

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(true);
    });

    let authResult: boolean | undefined;
    await act(async () => {
      authResult = await result.current.authenticate('Test prompt');
    });

    expect(authResult).toBe(true);
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
      promptMessage: 'Test prompt',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
  });

  it('should return true when biometrics not available', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useBiometricAuth());

    await waitFor(() => {
      expect(result.current.isAvailable).toBe(false);
    });

    let authResult: boolean | undefined;
    await act(async () => {
      authResult = await result.current.authenticate();
    });

    expect(authResult).toBe(true);
    expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
  });
});
