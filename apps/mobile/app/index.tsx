import { useEffect, useState, useCallback } from 'react';
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

  useEffect(() => {
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

  switch (state) {
    case 'loading':
      return <LoadingScreen />;
    case 'biometric_pending':
      return <LoadingScreen message="Verifying identity..." />;
    case 'biometric_failed':
      return <BiometricLockScreen biometricType={biometricType} onRetry={retryBiometric} />;
    case 'authenticated':
      return <Redirect href="/(tabs)/today" />;
    case 'unauthenticated':
      return <Redirect href="/(auth)/login" />;
  }
}
