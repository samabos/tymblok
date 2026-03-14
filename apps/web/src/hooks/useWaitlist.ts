import { useState } from 'react';
import { subscribeToWaitlist } from '@/lib/api';

type WaitlistState = 'idle' | 'loading' | 'success' | 'error';

export function useWaitlist() {
  const [state, setState] = useState<WaitlistState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  async function subscribe(email: string, source?: string) {
    setState('loading');
    setError(null);

    try {
      const result = await subscribeToWaitlist({ email, source });
      setAlreadySubscribed(result.data.alreadySubscribed);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setState('error');
    }
  }

  function reset() {
    setState('idle');
    setError(null);
    setAlreadySubscribed(false);
  }

  return { state, error, alreadySubscribed, subscribe, reset };
}
