import type { BlockTimerState, Listener, Disposable } from './types';
import type { createIdeApiClient } from './api-client';

export interface TimerInfo {
  blockId: string | null;
  blockTitle: string | null;
  state: BlockTimerState;
  elapsedSeconds: number;
}

/**
 * Manages the active block timer.
 * Tracks which block is active, syncs start/pause/complete with the API,
 * and emits tick events for UI updates.
 */
export class TimerManager {
  private activeBlockId: string | null = null;
  private activeBlockTitle: string | null = null;
  private timerState: BlockTimerState = 'not_started';
  private elapsedSeconds = 0;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private lastActivityTime = Date.now();
  private listeners: Set<Listener<TimerInfo>> = new Set();

  constructor(
    private readonly api: ReturnType<typeof createIdeApiClient>,
    private readonly idleTimeoutMs: number = 5 * 60 * 1000,
  ) {}

  /** Set the active block (user selects from sidebar) */
  setActiveBlock(blockId: string, title: string, state: BlockTimerState, elapsed: number): void {
    this.activeBlockId = blockId;
    this.activeBlockTitle = title;
    this.timerState = state;
    this.elapsedSeconds = elapsed;

    if (state === 'running') {
      this.startTicking();
    } else {
      this.stopTicking();
    }
    this.emit();
  }

  /** Clear the active block */
  clearActiveBlock(): void {
    this.stopTicking();
    this.activeBlockId = null;
    this.activeBlockTitle = null;
    this.timerState = 'not_started';
    this.elapsedSeconds = 0;
    this.emit();
  }

  /** Start the active block's timer */
  async start(): Promise<void> {
    if (!this.activeBlockId) return;
    try {
      await this.api.blocks.start(this.activeBlockId);
      this.timerState = 'running';
      this.startTicking();
      this.emit();
    } catch (err) {
      throw err;
    }
  }

  /** Pause the active block's timer */
  async pause(): Promise<void> {
    if (!this.activeBlockId) return;
    try {
      await this.api.blocks.pause(this.activeBlockId);
      this.timerState = 'paused';
      this.stopTicking();
      this.emit();
    } catch (err) {
      throw err;
    }
  }

  /** Resume the active block's timer */
  async resume(): Promise<void> {
    if (!this.activeBlockId) return;
    try {
      await this.api.blocks.resume(this.activeBlockId);
      this.timerState = 'running';
      this.startTicking();
      this.emit();
    } catch (err) {
      throw err;
    }
  }

  /** Complete the active block */
  async complete(): Promise<void> {
    if (!this.activeBlockId) return;
    try {
      await this.api.blocks.complete(this.activeBlockId);
      this.timerState = 'completed';
      this.stopTicking();
      this.emit();
    } catch (err) {
      throw err;
    }
  }

  /** Record user activity (resets idle timer) */
  recordActivity(): void {
    this.lastActivityTime = Date.now();
  }

  /** Get current timer info */
  getInfo(): TimerInfo {
    return {
      blockId: this.activeBlockId,
      blockTitle: this.activeBlockTitle,
      state: this.timerState,
      elapsedSeconds: this.elapsedSeconds,
    };
  }

  /** Subscribe to timer updates */
  onUpdate(listener: Listener<TimerInfo>): Disposable {
    this.listeners.add(listener);
    return {
      dispose: () => this.listeners.delete(listener),
    };
  }

  /** Cleanup on extension deactivate */
  dispose(): void {
    this.stopTicking();
    this.listeners.clear();
  }

  private startTicking(): void {
    this.stopTicking();
    this.lastActivityTime = Date.now();
    this.tickInterval = setInterval(() => {
      // Check idle timeout
      if (Date.now() - this.lastActivityTime > this.idleTimeoutMs) {
        this.handleIdleTimeout();
        return;
      }
      this.elapsedSeconds++;
      this.emit();
    }, 1000);
  }

  private stopTicking(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private async handleIdleTimeout(): Promise<void> {
    if (this.timerState === 'running' && this.activeBlockId) {
      try {
        await this.pause();
      } catch {
        // Silently handle — timer paused locally regardless
        this.timerState = 'paused';
        this.stopTicking();
        this.emit();
      }
    }
  }

  private emit(): void {
    const info = this.getInfo();
    this.listeners.forEach((l) => l(info));
  }
}
