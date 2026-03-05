import * as vscode from 'vscode';
import type { InboxItemDto } from '@tymblok/api-client';
import type { createIdeApiClient } from '@tymblok/ide-core';

/**
 * TreeView data provider for the Inbox panel.
 * Shows unscheduled, undismissed inbox items from all sources (GitHub PRs, Jira, manual, etc.)
 * Replaces the old PRsProvider — all sources funnel through the backend inbox.
 */
export class InboxProvider implements vscode.TreeDataProvider<InboxTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    InboxTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private items: InboxItemDto[] = [];

  constructor(private readonly api: ReturnType<typeof createIdeApiClient>) {}

  /** Fetch inbox from backend and refresh the tree */
  async refresh(): Promise<void> {
    try {
      const all = await this.api.inbox.list();
      this.items = all.filter((i) => !i.isDismissed && !i.isScheduled);
    } catch {
      this.items = [];
    }
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: InboxTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): InboxTreeItem[] {
    if (this.items.length === 0) {
      return [new InboxTreeItem(null)];
    }
    return this.items.map((item) => new InboxTreeItem(item));
  }
}

export class InboxTreeItem extends vscode.TreeItem {
  public readonly inboxItem: InboxItemDto | null;

  constructor(item: InboxItemDto | null) {
    super(item?.title ?? 'Inbox is empty', vscode.TreeItemCollapsibleState.None);
    this.inboxItem = item;

    if (!item) {
      this.iconPath = new vscode.ThemeIcon('info');
      this.contextValue = 'info';
      return;
    }

    this.description = `${item.source} · ${item.priority}`;
    this.tooltip = item.description
      ? `${item.title}\n${item.description}`
      : item.title;
    this.iconPath = new vscode.ThemeIcon(this.getSourceIcon(item.source));
    this.contextValue = item.externalUrl ? 'inbox_item_url' : 'inbox_item';
  }

  private getSourceIcon(source: string): string {
    switch (source) {
      case 'GitHub': return 'git-pull-request';
      case 'Jira': return 'issues';
      case 'GoogleCalendar': return 'calendar';
      default: return 'note';
    }
  }
}
