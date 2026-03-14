import * as vscode from 'vscode';
import type { TimerManager, TimerInfo } from '@tymblok/ide-core';
import type { createIdeApiClient } from '@tymblok/ide-core';

interface BlockDto {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isCompleted: boolean;
  elapsedSeconds?: number;
  timerState?: string;
  category?: { name: string; color: string } | null;
  externalUrl?: string | null;
}

/**
 * TreeView data provider for today's time blocks.
 * Shows block list with status icons and inline actions.
 */
export class BlocksProvider
  implements vscode.TreeDataProvider<BlockTreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    BlockTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private blocks: BlockDto[] = [];
  private activeBlockId: string | null = null;

  constructor(
    private readonly api: ReturnType<typeof createIdeApiClient>,
    private readonly timer: TimerManager,
  ) {
    // Refresh tree when timer state changes
    this.timer.onUpdate((info: TimerInfo) => {
      this.activeBlockId = info.blockId;
      this._onDidChangeTreeData.fire();
    });
  }

  /** Refresh blocks from the API */
  async refresh(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const blocks = await this.api.blocks.list({ date: today });
      this.blocks = blocks as unknown as BlockDto[];
    } catch {
      this.blocks = [];
    }
    this._onDidChangeTreeData.fire();
  }

  /** Get completed/total counts for status bar */
  getProgress(): { completed: number; total: number } {
    return {
      completed: this.blocks.filter((b) => b.isCompleted).length,
      total: this.blocks.length,
    };
  }

  getTreeItem(element: BlockTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): BlockTreeItem[] {
    if (this.blocks.length === 0) {
      return [
        new BlockTreeItem(
          'No blocks for today',
          '',
          vscode.TreeItemCollapsibleState.None,
          'info',
        ),
      ];
    }

    return this.blocks.map((block) => {
      const isActive = block.id === this.activeBlockId;
      const state = block.isCompleted
        ? 'completed'
        : block.timerState === 'Running'
          ? 'running'
          : block.timerState === 'Paused'
            ? 'paused'
            : 'not_started';

      const time = this.formatTimeRange(block.startTime, block.endTime);
      const item = new BlockTreeItem(
        block.title,
        block.id,
        vscode.TreeItemCollapsibleState.None,
        state,
        time,
        isActive,
        block.category,
        block.externalUrl ?? undefined,
      );

      // context value drives inline buttons + context menu "when" clauses
      item.contextValue = block.externalUrl ? `${state}_url` : state;

      return item;
    });
  }

  private formatTimeRange(start: string, end: string): string {
    const fmt = (timeStr: string) => {
      // API returns TimeOnly as "HH:mm:ss" — not a full ISO datetime
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parts[1];
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${m} ${ampm}`;
      }
      return timeStr;
    };
    return `${fmt(start)} – ${fmt(end)}`;
  }
}

class BlockTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly blockId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly state:
      | 'not_started'
      | 'running'
      | 'paused'
      | 'completed'
      | 'info',
    public readonly timeRange?: string,
    public readonly isActive?: boolean,
    public readonly category?: { name: string; color: string } | null,
    public readonly externalUrl?: string,
  ) {
    super(label, collapsibleState);

    if (state === 'info') {
      this.iconPath = new vscode.ThemeIcon('info');
      return;
    }

    // Status icon
    this.iconPath = new vscode.ThemeIcon(this.getIcon());

    // Description shows time range
    if (timeRange) {
      this.description = timeRange;
    }

    // Tooltip
    this.tooltip = `${label}${category ? ` (${category.name})` : ''}\n${timeRange || ''}`;

    // Click opens quick pick with actions for this block
    this.command = {
      command: 'tymblok.blockActions',
      title: 'Block Actions',
      arguments: [this],
    };
  }

  private getIcon(): string {
    switch (this.state) {
      case 'running':
        return 'play-circle';
      case 'paused':
        return 'debug-pause';
      case 'completed':
        return 'pass-filled';
      default:
        return 'circle-outline';
    }
  }
}

export { BlockTreeItem };
