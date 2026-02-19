type Listener = (data: unknown) => void;

class SyncEventEmitter {
  private listeners: Map<string, Set<Listener>> = new Map();

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  emit(event: string, data?: unknown) {
    this.listeners.get(event)?.forEach(fn => fn(data));
  }
}

export const syncEventEmitter = new SyncEventEmitter();
