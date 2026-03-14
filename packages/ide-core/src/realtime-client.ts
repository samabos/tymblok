import * as signalR from '@microsoft/signalr';

type Handler = (payload: unknown) => void;

/**
 * SignalR client for real-time block state sync across devices.
 * Connects to /hubs/tymblok and fires 'BlockUpdated' when any client
 * changes a block's timer state.
 */
export class RealtimeClient {
  private connection: signalR.HubConnection | null = null;
  private readonly listeners = new Map<string, Set<Handler>>();

  constructor(
    private readonly apiUrl: string,
    private readonly getToken: () => Promise<string>,
  ) {}

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.apiUrl}/hubs/tymblok`, {
        accessTokenFactory: this.getToken,
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('BlockUpdated', (payload) => this.emit('BlockUpdated', payload));

    await this.connection.start();
  }

  async disconnect(): Promise<void> {
    await this.connection?.stop();
    this.connection = null;
  }

  /** Subscribe to a hub event. Returns an unsubscribe function. */
  on(event: string, handler: Handler): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  private emit(event: string, payload: unknown) {
    this.listeners.get(event)?.forEach((h) => h(payload));
  }
}
