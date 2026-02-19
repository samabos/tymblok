import { useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/authStore';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { LoadingScreen } from '../components/LoadingScreen';
import { BiometricLockScreen } from '../components/BiometricLockScreen';
import { OnboardingScreen } from '../components/OnboardingScreen';

const ONBOARDING_KEY = 'tymblok-onboarding-completed';

type AppState =
  | 'loading'
  | 'onboarding'
  | 'biometric_pending'
  | 'biometric_failed'
  | 'authenticated'
  | 'unauthenticated';

function useAppState() {
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();
  const { isEnabled, authenticate, biometricType } = useBiometricAuth();
  const [biometricPassed, setBiometricPassed] = useState(false);
  const [biometricFailed, setBiometricFailed] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Check if onboarding has been completed
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value: string | null) => {
      setOnboardingCompleted(value === 'true');
    });
  }, []);

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
  }, [
    isLoading,
    isAuthenticated,
    isEnabled,
    biometricPassed,
    biometricFailed,
    performBiometricAuth,
  ]);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingCompleted(true);
  }, []);

  const getState = (): AppState => {
    if (isLoading || onboardingCompleted === null) return 'loading';
    if (!onboardingCompleted) return 'onboarding';
    if (!isAuthenticated) return 'unauthenticated';
    if (isEnabled && biometricFailed) return 'biometric_failed';
    if (isEnabled && !biometricPassed) return 'biometric_pending';
    return 'authenticated';
  };

  return {
    state: getState(),
    biometricType,
    retryBiometric: performBiometricAuth,
    completeOnboarding,
  };
}

export default function Index() {
  const { state, biometricType, retryBiometric, completeOnboarding } = useAppState();

  useEffect(() => {
    if (state === 'authenticated') {
      router.replace('/(tabs)/today');
    } else if (state === 'unauthenticated') {
      router.replace('/(auth)/login');
    }
  }, [state]);

  switch (state) {
    case 'loading':
      return <LoadingScreen />;
    case 'onboarding':
      return <OnboardingScreen onComplete={completeOnboarding} />;
    case 'biometric_pending':
      return <LoadingScreen message="Verifying identity..." />;
    case 'biometric_failed':
      return <BiometricLockScreen biometricType={biometricType} onRetry={retryBiometric} />;
    case 'authenticated':
    case 'unauthenticated':
      return <LoadingScreen />;
  }
}
