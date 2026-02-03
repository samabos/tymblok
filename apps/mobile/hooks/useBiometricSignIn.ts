import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

const BIOMETRIC_SIGNIN_ENABLED_KEY = 'biometric_signin_enabled';
const BIOMETRIC_ENABLED_USER_ID_KEY = 'biometric_enabled_user_id'; // Track which user enabled biometric
const REMEMBERED_USER_KEY = 'remembered_user';
const REMEMBERED_REFRESH_TOKEN_KEY = 'remembered_refresh_token';

interface RememberedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

// Helper functions for storage
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

const removeStorageItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
};

export function useBiometricSignIn() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [enabledUserId, setEnabledUserId] = useState<string | null>(null); // Track which user enabled biometric
  const [rememberedUser, setRememberedUser] = useState<RememberedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricType, setBiometricType] = useState<string | null>(null);

  const { user, tokens, setAuth } = useAuthStore();

  // Check biometric availability and load preferences
  useEffect(() => {
    const init = async () => {
      // Check biometric availability
      if (Platform.OS !== 'web') {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsAvailable(compatible && enrolled);

        if (compatible && enrolled) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('Face ID');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('Fingerprint');
          } else {
            setBiometricType('Biometrics');
          }
        }
      }

      // Load preferences
      const enabled = await getStorageItem(BIOMETRIC_SIGNIN_ENABLED_KEY);
      setIsEnabled(enabled === 'true');

      // Load the user ID that enabled biometric (for security check)
      const storedUserId = await getStorageItem(BIOMETRIC_ENABLED_USER_ID_KEY);
      setEnabledUserId(storedUserId);

      const userJson = await getStorageItem(REMEMBERED_USER_KEY);
      if (userJson) {
        try {
          setRememberedUser(JSON.parse(userJson));
        } catch {
          // Invalid JSON, clear it
          await removeStorageItem(REMEMBERED_USER_KEY);
        }
      }

      setIsLoading(false);
    };

    init();
  }, []);

  /**
   * Enable biometric sign-in for the current user.
   * Stores user info and refresh token for later use.
   */
  const enableBiometricSignIn = useCallback(async (): Promise<boolean> => {
    if (!user || !tokens?.refresh_token) {
      return false;
    }

    // Verify biometrics first
    if (Platform.OS !== 'web' && isAvailable) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify to enable biometric sign-in',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return false;
      }
    }

    // Store user info
    const rememberedUserData: RememberedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
    };

    await setStorageItem(REMEMBERED_USER_KEY, JSON.stringify(rememberedUserData));
    await setStorageItem(REMEMBERED_REFRESH_TOKEN_KEY, tokens.refresh_token);
    await setStorageItem(BIOMETRIC_SIGNIN_ENABLED_KEY, 'true');
    await setStorageItem(BIOMETRIC_ENABLED_USER_ID_KEY, user.id); // Track which user enabled biometric

    setRememberedUser(rememberedUserData);
    setIsEnabled(true);
    setEnabledUserId(user.id);

    return true;
  }, [user, tokens, isAvailable]);

  /**
   * Disable biometric sign-in and clear stored data.
   */
  const disableBiometricSignIn = useCallback(async (): Promise<void> => {
    await removeStorageItem(BIOMETRIC_SIGNIN_ENABLED_KEY);
    await removeStorageItem(BIOMETRIC_ENABLED_USER_ID_KEY);
    await removeStorageItem(REMEMBERED_USER_KEY);
    await removeStorageItem(REMEMBERED_REFRESH_TOKEN_KEY);

    setIsEnabled(false);
    setEnabledUserId(null);
    setRememberedUser(null);
  }, []);

  /**
   * Clear remembered user without disabling the feature preference.
   * Call this on explicit logout or when session expires.
   */
  const forgetUser = useCallback(async (): Promise<void> => {
    await removeStorageItem(REMEMBERED_USER_KEY);
    await removeStorageItem(REMEMBERED_REFRESH_TOKEN_KEY);
    setRememberedUser(null);
  }, []);

  /**
   * Attempt to sign in using biometrics.
   * Returns true if successful, false otherwise.
   */
  const signInWithBiometrics = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isEnabled || !rememberedUser) {
      return { success: false, error: 'Biometric sign-in not enabled' };
    }

    // Get stored refresh token
    const refreshToken = await getStorageItem(REMEMBERED_REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      // Clear invalid state
      await disableBiometricSignIn();
      return { success: false, error: 'No stored credentials' };
    }

    // Verify biometrics
    if (Platform.OS !== 'web' && isAvailable) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Sign in as ${rememberedUser.name}`,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return { success: false, error: 'Biometric authentication failed' };
      }
    }

    // Use refresh token to get new session
    try {
      const response = await authService.refresh({ refreshToken });

      // Update stored refresh token
      await setStorageItem(REMEMBERED_REFRESH_TOKEN_KEY, response.refreshToken);

      // Set auth state - we need to fetch user data since refresh doesn't return it
      // For now, use remembered user data and let the app refresh it
      setAuth(
        {
          id: rememberedUser.id,
          email: rememberedUser.email,
          name: rememberedUser.name,
          avatar_url: rememberedUser.avatarUrl,
          email_verified: true, // Assume verified since they were signed in before
          has_password: true,
          timezone: 'UTC',
          working_hours_start: '09:00',
          working_hours_end: '17:00',
          lunch_start: '12:00',
          lunch_duration_minutes: 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          access_token: response.accessToken,
          refresh_token: response.refreshToken,
          expires_in: response.expiresIn,
          token_type: 'Bearer',
        }
      );

      return { success: true };
    } catch (err) {
      // Refresh token is invalid, clear credentials but preserve preference
      // User can re-enable after manual login
      await forgetUser();
      const message = err instanceof Error ? err.message : 'Session expired';
      return { success: false, error: message };
    }
  }, [isEnabled, rememberedUser, isAvailable, disableBiometricSignIn, forgetUser, setAuth]);

  /**
   * Update stored credentials after manual login.
   * Call this after successful login when biometric was previously enabled.
   * Does NOT require biometric verification since user just authenticated.
   * Can pass credentials directly (recommended) or use current store values.
   *
   * SECURITY: Only restores credentials for the SAME user who enabled biometric.
   * If a different user logs in, they must enable biometric themselves.
   */
  const updateStoredCredentials = useCallback(async (
    credentials?: {
      user: { id: string; email: string; name: string; avatar_url: string | null };
      refreshToken: string;
    }
  ): Promise<boolean> => {
    if (!isEnabled) {
      return false;
    }

    const userData = credentials?.user || user;
    const refreshToken = credentials?.refreshToken || tokens?.refresh_token;

    if (!userData || !refreshToken) {
      return false;
    }

    // SECURITY CHECK: Only auto-restore for the same user who enabled biometric
    // If different user, they must explicitly enable biometric sign-in themselves
    if (enabledUserId && enabledUserId !== userData.id) {
      console.log('[BiometricSignIn] Different user logged in, not auto-restoring credentials');
      return false;
    }

    // Store updated user info and token
    const rememberedUserData: RememberedUser = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      avatarUrl: userData.avatar_url,
    };

    await setStorageItem(REMEMBERED_USER_KEY, JSON.stringify(rememberedUserData));
    await setStorageItem(REMEMBERED_REFRESH_TOKEN_KEY, refreshToken);

    setRememberedUser(rememberedUserData);
    return true;
  }, [isEnabled, enabledUserId, user, tokens]);

  /**
   * Check if biometric sign-in can be used right now.
   */
  const canUseBiometricSignIn = isAvailable && isEnabled && rememberedUser !== null;

  return {
    // State
    isAvailable,
    isEnabled,
    isLoading,
    rememberedUser,
    biometricType,
    canUseBiometricSignIn,

    // Actions
    enableBiometricSignIn,
    disableBiometricSignIn,
    signInWithBiometrics,
    forgetUser,
    updateStoredCredentials,
  };
}
