import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { LoadingScreen } from '../components/LoadingScreen';
import { BiometricLockScreen } from '../components/BiometricLockScreen';

type AppState = 'loading' | 'biometric_pending' | 'biometric_failed' | 'authenticated' | 'unauthenticated';

function useAppState() {
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();
  const { isEnabled, authenticate, biometricType } = useBiometricAuth();
  const [biometricPassed, setBiometricPassed] = useState(false);
  const [biometricFailed, setBiometricFailed] = useState(false);

  console.log('[useAppState] isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'isEnabled:', isEnabled);

  useEffect(() => {
    console.log('[useAppState] Setting loading to false after timeout');
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [setLoading]);

  const performBiometricAuth = useCallback(async () => {
    setBiometricFailed(false);
    const success = await authenticate('Unlock Tymblok');
    if (success) {
      setBiometricPassed(true);
    } else {
      setBiometricFailed(true);
    }
  }, [authenticate]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isEnabled && !biometricPassed && !biometricFailed) {
      performBiometricAuth();
    }
  }, [isLoading, isAuthenticated, isEnabled, biometricPassed, biometricFailed, performBiometricAuth]);

  const getState = (): AppState => {
    if (isLoading) return 'loading';
    if (!isAuthenticated) return 'unauthenticated';
    if (isEnabled && biometricFailed) return 'biometric_failed';
    if (isEnabled && !biometricPassed) return 'biometric_pending';
    return 'authenticated';
  };

  return {
    state: getState(),
    biometricType,
    retryBiometric: performBiometricAuth,
  };
}

export default function Index() {
  const { state, biometricType, retryBiometric } = useAppState();

  console.log('[Index] Current state:', state, 'Platform:', Platform.OS);

  switch (state) {
    case 'loading':
      console.log('[Index] Rendering LoadingScreen');
      return <LoadingScreen />;
    case 'biometric_pending':
      console.log('[Index] Rendering LoadingScreen with biometric message');
      return <LoadingScreen message="Verifying identity..." />;
    case 'biometric_failed':
      console.log('[Index] Rendering BiometricLockScreen');
      return <BiometricLockScreen biometricType={biometricType} onRetry={retryBiometric} />;
    case 'authenticated':
      console.log('[Index] Redirecting to /(tabs)/today');
      return <Redirect href="/(tabs)/today" />;
    case 'unauthenticated':
      console.log('[Index] Redirecting to /(auth)/login');
      return <Redirect href="/(auth)/login" />;
  }
}
