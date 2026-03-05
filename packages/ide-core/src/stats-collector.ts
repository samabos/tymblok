import type { ActivityEvent } from './types';

/**
 * Collects raw IDE activity events and maintains an in-memory session.
 * IDE-agnostic — receives events from the IDE adapter layer.
 */
export class StatsCollector {
  private activeSeconds = 0;
  private filesEdited = new Set<string>();
  private linesAdded = 0;
  private linesRemoved = 0;
  private languages: Record<string, number> = {};
  private commits = 0;
  private sessionStartedAt: string;
  private isActive = false;
  private lastEventTime = 0;
  private activeLanguage: string | null = null;
  private languageTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly idleThresholdMs: number = 5 * 60 * 1000) {
    this.sessionStartedAt = new Date().toISOString();
    this.startLanguageTracking();
  }

  /** Process an activity event from the IDE layer */
  handleEvent(event: ActivityEvent): void {
    this.lastEventTime = event.timestamp;

    switch (event.type) {
      case 'file_edit':
        this.isActive = true;
        if (event.language) {
          // Track unique file edits by language (anonymized — no file paths stored)
          this.filesEdited.add(`${event.language}:${this.filesEdited.size}`);
          this.activeLanguage = event.language;
        }
        break;

      case 'file_save':
        this.linesAdded += event.linesAdded || 0;
        this.linesRemoved += event.linesRemoved || 0;
        break;

      case 'commit':
        this.commits++;
        break;

      case 'editor_focus':
        this.isActive = true;
        break;

      case 'editor_blur':
        this.isActive = false;
        this.activeLanguage = null;
        break;
    }
  }

  /** Take a snapshot of the current session and reset counters */
  snapshot(): {
    startedAt: string;
    endedAt: string;
    activeSeconds: number;
    filesEdited: number;
    linesAdded: number;
    linesRemoved: number;
    languages: Record<string, number>;
    commits: number;
  } {
    const result = {
      startedAt: this.sessionStartedAt,
      endedAt: new Date().toISOString(),
      activeSeconds: this.activeSeconds,
      filesEdited: this.filesEdited.size,
      linesAdded: this.linesAdded,
      linesRemoved: this.linesRemoved,
      languages: { ...this.languages },
      commits: this.commits,
    };

    this.reset();
    return result;
  }

  /** Check if there's any data worth sending */
  hasData(): boolean {
    return this.activeSeconds > 0 || this.filesEdited.size > 0 || this.commits > 0;
  }

  /** Check if user is idle (no events for idleThresholdMs) */
  isIdle(): boolean {
    return this.lastEventTime > 0 && Date.now() - this.lastEventTime > this.idleThresholdMs;
  }

  /** Cleanup */
  dispose(): void {
    if (this.languageTimer) {
      clearInterval(this.languageTimer);
      this.languageTimer = null;
    }
  }

  private reset(): void {
    this.activeSeconds = 0;
    this.filesEdited = new Set();
    this.linesAdded = 0;
    this.linesRemoved = 0;
    this.languages = {};
    this.commits = 0;
    this.sessionStartedAt = new Date().toISOString();
  }

  /** Track active seconds and language time every second */
  private startLanguageTracking(): void {
    this.languageTimer = setInterval(() => {
      if (this.isActive && !this.isIdle()) {
        this.activeSeconds++;
        if (this.activeLanguage) {
          this.languages[this.activeLanguage] =
            (this.languages[this.activeLanguage] || 0) + 1;
        }
      }
    }, 1000);
  }
}
