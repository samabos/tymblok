import * as vscode from 'vscode';
import type { TimerManager, TimerInfo } from '@tymblok/ide-core';
import type { Disposable } from '@tymblok/ide-core';

/**
 * Status bar item showing the active block name + timer.
 * Format: $(clock) Deep Work — 23:45 ▶  |  3/7 blocks done
 * Click: opens the quick-pick command menu
 */
export class StatusBar {
  private item: vscode.StatusBarItem;
  private timerSub: Disposable | null = null;

  constructor(private readonly timer: TimerManager) {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.item.command = 'tymblok.quickPick';
    this.item.tooltip = 'Tymblok — Click for actions';
  }

  /** Start rendering the status bar */
  activate(): void {
    this.timerSub = this.timer.onUpdate((info) => {
      this.render(info);
    });
    // Initial render
    this.render(this.timer.getInfo());
    this.item.show();
  }

  /** Update block progress count (e.g., "3/7 done") */
  updateProgress(completed: number, total: number): void {
    this.lastCompleted = completed;
    this.lastTotal = total;
    this.render(this.timer.getInfo());
  }

  private lastCompleted = 0;
  private lastTotal = 0;

  private render(info: TimerInfo): void {
    if (!info.blockId) {
      if (this.lastTotal > 0) {
        this.item.text = `$(clock) Tymblok  |  ${this.lastCompleted}/${this.lastTotal} done`;
      } else {
        this.item.text = '$(clock) Tymblok';
      }
      return;
    }

    const title = info.blockTitle || 'Block';
    const time = this.formatTime(info.elapsedSeconds);
    const stateIcon = this.getStateIcon(info.state);
    const progress =
      this.lastTotal > 0
        ? `  |  ${this.lastCompleted}/${this.lastTotal} done`
        : '';

    this.item.text = `$(clock) ${title} — ${time} ${stateIcon}${progress}`;
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  private getStateIcon(
    state: 'not_started' | 'running' | 'paused' | 'completed',
  ): string {
    switch (state) {
      case 'running':
        return '$(debug-pause)';
      case 'paused':
        return '$(play)';
      case 'completed':
        return '$(check)';
      default:
        return '$(play)';
    }
  }

  dispose(): void {
    this.timerSub?.dispose();
    this.item.dispose();
  }
}
