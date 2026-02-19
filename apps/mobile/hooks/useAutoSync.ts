import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSyncAllIntegrations } from '../services/apiHooks';
import { useAuthStore } from '../stores/authStore';
import { syncEventEmitter } from '../utils/syncEventEmitter';

const SYNC_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export function useAutoSync() {
  const { isAuthenticated } = useAuthStore();
  const syncAllMutation = useSyncAllIntegrations();
  const lastSyncRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isPendingRef = useRef(false);

  const trySync = useCallback(() => {
    if (!isAuthenticated) return;
    if (isPendingRef.current) return;

    const now = Date.now();
    if (now - lastSyncRef.current < SYNC_THROTTLE_MS) return;

    lastSyncRef.current = now;
    isPendingRef.current = true;

    syncAllMutation.mutate(undefined, {
      onSuccess: data => {
        isPendingRef.current = false;
        if (data.totalItemsSynced > 0) {
          syncEventEmitter.emit('syncComplete', data);
        }
      },
      onError: () => {
        isPendingRef.current = false;
        // Reset timestamp so we can retry sooner
        lastSyncRef.current = 0;
      },
    });
  }, [isAuthenticated, syncAllMutation]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      // App came to foreground
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        trySync();
      }
      appStateRef.current = nextState;
    });

    // Sync once on mount (app just opened)
    trySync();

    return () => subscription.remove();
  }, [trySync]);
}
