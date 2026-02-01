import { useState } from 'react';
import { router } from 'expo-router';
import { ForgotPasswordScreen } from '@tymblok/ui';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string>();

  const handleSubmit = async (email: string) => {
    setError(undefined);
    try {
      // TODO: Call API to send reset email
      // await authService.forgotPassword(email);
      console.log('[ForgotPassword] Sending reset email to:', email);
      // The ForgotPasswordScreen handles the success state internally
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
      throw err; // Re-throw so the screen knows it failed
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ForgotPasswordScreen
      onSubmit={handleSubmit}
      onBack={handleBack}
      error={error}
    />
  );
}
