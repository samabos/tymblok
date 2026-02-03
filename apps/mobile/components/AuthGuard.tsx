import { ReactNode } from 'react';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { LoadingScreen } from './LoadingScreen';

interface AuthGuardProps {
  children: ReactNode;
  requireEmailVerified?: boolean;
  loadingMessage?: string;
}

/**
 * Component wrapper that protects routes requiring authentication.
 * Shows a loading screen while checking auth, then either:
 * - Renders children if authenticated and email verified
 * - Redirects to login if not authenticated
 * - Redirects to email verification pending if email not verified
 *
 * @example
 * ```tsx
 * export default function ProtectedScreen() {
 *   return (
 *     <AuthGuard>
 *       <View>Protected content</View>
 *     </AuthGuard>
 *   );
 * }
 * ```
 */
export function AuthGuard({
  children,
  requireEmailVerified = true,
  loadingMessage = 'Loading...',
}: AuthGuardProps) {
  const { isReady } = useProtectedRoute({ requireEmailVerified });

  if (!isReady) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return <>{children}</>;
}
