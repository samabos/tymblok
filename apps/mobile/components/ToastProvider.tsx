import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Toast, type ToastData } from '@tymblok/ui';
import { syncEventEmitter } from '../utils/syncEventEmitter';
import type { SyncAllResponse } from '@tymblok/api-client';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, duration?: number) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Listen for sync events
  useEffect(() => {
    const unsubscribe = syncEventEmitter.on('syncComplete', (data: SyncAllResponse) => {
      if (data.totalItemsSynced > 0) {
        const itemWord = data.totalItemsSynced === 1 ? 'item' : 'items';
        addToast(`${data.totalItemsSynced} new ${itemWord} synced`);
      }
    });
    return unsubscribe;
  }, [addToast]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {children}
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </View>
  );
}
