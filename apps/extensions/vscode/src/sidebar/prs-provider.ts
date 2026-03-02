import * as vscode from 'vscode';
import type { GitHubPR } from '@tymblok/ide-core';

/**
 * TreeView data provider for GitHub PRs where the user is a requested reviewer.
 */
export class PRsProvider implements vscode.TreeDataProvider<PRTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    PRTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private prs: GitHubPR[] = [];

  /** Update the PR list and refresh the tree */
  update(prs: GitHubPR[]): void {
    this.prs = prs;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PRTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): PRTreeItem[] {
    if (this.prs.length === 0) {
      return [new PRTreeItem('No PRs to review', '', '', 'info')];
    }

    return this.prs.map(
      (pr) =>
        new PRTreeItem(
          pr.title,
          `${pr.owner}/${pr.repo}#${pr.number}`,
          pr.url,
          pr.isDraft ? 'draft' : 'open',
          pr.author,
        ),
    );
  }
}

class PRTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly repoRef: string,
    public readonly url: string,
    public readonly state: 'open' | 'draft' | 'info',
    public readonly author?: string,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);

    if (state === 'info') {
      this.iconPath = new vscode.ThemeIcon('info');
      return;
    }

    this.iconPath = new vscode.ThemeIcon(
      state === 'draft' ? 'git-pull-request-draft' : 'git-pull-request',
    );
    this.description = `${repoRef}${author ? ` by ${author}` : ''}`;
    this.tooltip = `${label}\n${repoRef}\n${url}`;

    // Click opens PR in browser
    if (url) {
      this.command = {
        command: 'vscode.open',
        title: 'Open PR',
        arguments: [vscode.Uri.parse(url)],
      };
    }
  }
}
