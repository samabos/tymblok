import type { AxiosInstance } from 'axios';
import type { CodingSession, ILocalStorage, Listener, Disposable } from './types';
import type { StatsCollector } from './stats-collector';
import type { TimerManager } from './timer-manager';

const UNSENT_SESSIONS_KEY = 'tymblok_unsent_sessions';

/**
 * Aggregates stats from StatsCollector into CodingSessions and syncs to the backend.
 *
 * Sync triggers:
 * - Periodic (every syncIntervalMs, default 5 min)
 * - On block complete
 * - On block switch
 * - On idle timeout
 * - On extension deactivate (flush)
 *
 * Resilience:
 * - Unsent sessions persisted to local storage
 * - Retried on next sync cycle
 */
export class StatsAggregator {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<Listener<CodingSession>> = new Set();

  constructor(
    private readonly collector: StatsCollector,
    private readonly timer: TimerManager,
    private readonly axios: AxiosInstance,
    private readonly localStorage: ILocalStorage,
    private readonly source: string,
    private readonly syncIntervalMs: number = 5 * 60 * 1000,
  ) {}

  /** Start periodic sync */
  start(): void {
    // Retry any unsent sessions from previous activation
    this.retryUnsent();

    this.syncInterval = setInterval(() => {
      this.sync();
    }, this.syncIntervalMs);

    // Listen for block completion to finalize session
    this.timer.onUpdate((info) => {
      if (info.state === 'completed') {
        this.sync();
      }
    });
  }

  /** Flush current session data and send to backend */
  async sync(): Promise<void> {
    if (!this.collector.hasData()) return;

    const snapshot = this.collector.snapshot();
    const timerInfo = this.timer.getInfo();

    const session: CodingSession = {
      ...snapshot,
      blockId: timerInfo.blockId || undefined,
      source: this.source,
    };

    await this.sendSession(session);
  }

  /** Flush everything on extension deactivate */
  async flush(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.collector.hasData()) {
      await this.sync();
    }
  }

  /** Subscribe to sent sessions (for UI updates) */
  onSessionSent(listener: Listener<CodingSession>): Disposable {
    this.listeners.add(listener);
    return {
      dispose: () => this.listeners.delete(listener),
    };
  }

  /** Cleanup */
  dispose(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.listeners.clear();
  }

  private async sendSession(session: CodingSession): Promise<void> {
    try {
      await this.axios.post('/coding-sessions', session);
      this.listeners.forEach((l) => l(session));
    } catch {
      // Network failure — persist for retry
      await this.persistUnsent(session);
    }
  }

  private async retryUnsent(): Promise<void> {
    try {
      const stored = await this.localStorage.read(UNSENT_SESSIONS_KEY);
      if (!stored) return;

      const sessions: CodingSession[] = JSON.parse(stored);
      if (sessions.length === 0) return;

      const remaining: CodingSession[] = [];
      for (const session of sessions) {
        try {
          await this.axios.post('/coding-sessions', session);
          this.listeners.forEach((l) => l(session));
        } catch {
          remaining.push(session);
        }
      }

      if (remaining.length > 0) {
        await this.localStorage.write(UNSENT_SESSIONS_KEY, JSON.stringify(remaining));
      } else {
        await this.localStorage.delete(UNSENT_SESSIONS_KEY);
      }
    } catch {
      // Silently ignore corrupt storage
    }
  }

  private async persistUnsent(session: CodingSession): Promise<void> {
    try {
      const stored = await this.localStorage.read(UNSENT_SESSIONS_KEY);
      const sessions: CodingSession[] = stored ? JSON.parse(stored) : [];
      sessions.push(session);
      // Cap at 100 unsent sessions to avoid unbounded growth
      const trimmed = sessions.slice(-100);
      await this.localStorage.write(UNSENT_SESSIONS_KEY, JSON.stringify(trimmed));
    } catch {
      // Silently ignore
    }
  }
}
