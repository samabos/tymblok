import * as vscode from 'vscode';
import type { StatsCollector } from '@tymblok/ide-core';
import type { TimerManager } from '@tymblok/ide-core';

/**
 * Adapts VS Code editor events into ActivityEvents for the StatsCollector.
 * Only collects aggregate numbers — no file paths, code content, or project names.
 */
export class ActivityTracker {
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly collector: StatsCollector,
    private readonly timer: TimerManager,
  ) {}

  /** Start listening to VS Code editor events */
  activate(): void {
    // Track file edits (text changes in editor)
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.uri.scheme !== 'file') return;
        const language = e.document.languageId;
        this.collector.handleEvent({
          type: 'file_edit',
          timestamp: Date.now(),
          language,
        });
        this.timer.recordActivity();
      }),
    );

    // Track file saves — use git diff for accurate line counts
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(async (doc) => {
        if (doc.uri.scheme !== 'file') return;
        const stats = await this.getLineDiff(doc.uri);
        this.collector.handleEvent({
          type: 'file_save',
          timestamp: Date.now(),
          linesAdded: stats.added,
          linesRemoved: stats.removed,
        });
      }),
    );

    // Track editor focus changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.collector.handleEvent({
            type: 'editor_focus',
            timestamp: Date.now(),
            language: editor.document.languageId,
          });
          this.timer.recordActivity();
        }
      }),
    );

    // Track window focus/blur for idle detection
    this.disposables.push(
      vscode.window.onDidChangeWindowState((state) => {
        this.collector.handleEvent({
          type: state.focused ? 'editor_focus' : 'editor_blur',
          timestamp: Date.now(),
        });
        if (state.focused) {
          this.timer.recordActivity();
        }
      }),
    );

    // Track git commits via file system watcher on .git/HEAD
    const gitWatcher = vscode.workspace.createFileSystemWatcher('**/.git/refs/heads/*');
    this.disposables.push(
      gitWatcher.onDidChange(() => {
        this.collector.handleEvent({
          type: 'commit',
          timestamp: Date.now(),
        });
      }),
    );
    this.disposables.push(gitWatcher);
  }

  /** Cleanup all event listeners */
  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }

  /** Get line diff stats for a file using git diff --stat */
  private async getLineDiff(
    _uri: vscode.Uri,
  ): Promise<{ added: number; removed: number }> {
    try {
      const gitExt = vscode.extensions.getExtension('vscode.git');
      if (!gitExt?.isActive) return { added: 0, removed: 0 };

      const git = gitExt.exports.getAPI(1);
      if (!git.repositories.length) return { added: 0, removed: 0 };

      const repo = git.repositories[0];
      const diff = await repo.diff(true);
      // Count lines starting with + or - (excluding headers)
      const lines = diff.split('\n');
      let added = 0;
      let removed = 0;
      for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) added++;
        if (line.startsWith('-') && !line.startsWith('---')) removed++;
      }
      return { added, removed };
    } catch {
      return { added: 0, removed: 0 };
    }
  }
}
