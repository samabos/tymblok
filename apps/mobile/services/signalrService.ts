import {
  HubConnectionBuilder,
  HubConnectionState,
  type HubConnection,
} from '@microsoft/signalr';
import type { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://tymblok-api.azurewebsites.net'
    : 'http://localhost:5000');

class SignalRService {
  private connection: HubConnection | null = null;
  private queryClient: QueryClient | null = null;

  setQueryClient(qc: QueryClient) {
    this.queryClient = qc;
  }

  async connect(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/tymblok`, {
        // accessTokenFactory is called on each connect/reconnect — always reads latest token
        accessTokenFactory: async () =>
          useAuthStore.getState().tokens?.access_token ?? '',
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('BlockUpdated', () => {
      this.queryClient?.invalidateQueries({ queryKey: ['blocks'] });
    });

    try {
      await this.connection.start();
    } catch (e) {
      console.warn('[SignalR] connection failed:', e);
    }
  }

  async disconnect(): Promise<void> {
    await this.connection?.stop();
    this.connection = null;
  }
}

export const signalrService = new SignalRService();
