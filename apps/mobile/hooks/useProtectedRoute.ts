import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

interface UseProtectedRouteOptions {
  /**
   * If true (default), requires email to be verified.
   * Set to false for routes that should be accessible without email verification.
   */
  requireEmailVerified?: boolean;
}

/**
 * Hook to protect routes that require authentication.
 * Redirects to login if user is not authenticated.
 * Redirects to email verification pending if email is not verified (by default).
 *
 * @param options - Optional configuration
 * @param options.requireEmailVerified - If true (default), also requires email to be verified
 * @returns Object with isReady flag and user data
 *
 * @example
 * ```tsx
 * export default function ProtectedScreen() {
 *   const { isReady, user } = useProtectedRoute();
 *
 *   if (!isReady) {
 *     return <LoadingScreen />;
 *   }
 *
 *   return <View>Protected content for {user?.name}</View>;
 * }
 * ```
 */
export function useProtectedRoute(options?: UseProtectedRouteOptions) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { requireEmailVerified = true } = options || {};

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  // Redirect to email verification pending if email not verified
  useEffect(() => {
    if (!isLoading && isAuthenticated && requireEmailVerified && user && !user.email_verified) {
      router.replace('/(auth)/email-verification-pending');
    }
  }, [isAuthenticated, isLoading, requireEmailVerified, user]);

  // Check email verification if required
  const emailVerified = !requireEmailVerified || user?.email_verified;
  const isReady = !isLoading && isAuthenticated && emailVerified;

  return {
    isReady,
    isLoading,
    isAuthenticated,
    user,
  };
}
