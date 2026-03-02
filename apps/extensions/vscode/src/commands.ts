import * as vscode from 'vscode';
import type { AuthManager, TimerManager, GitHubService } from '@tymblok/ide-core';
import type { LoginPanel } from './webview/login-panel';
import type { BlocksProvider, BlockTreeItem } from './sidebar/blocks-provider';
import type { PRsProvider } from './sidebar/prs-provider';
import type { StatusBar } from './status-bar';

interface CommandsDeps {
  authManager: AuthManager;
  timer: TimerManager;
  githubService: GitHubService;
  loginPanel: LoginPanel;
  blocksProvider: BlocksProvider;
  prsProvider: PRsProvider;
  statusBar: StatusBar;
}

/**
 * Registers all Tymblok command palette commands.
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  deps: CommandsDeps,
): void {
  const {
    authManager,
    timer,
    githubService,
    loginPanel,
    blocksProvider,
    prsProvider,
    statusBar,
  } = deps;

  // Login
  context.subscriptions.push(
    vscode.commands.registerCommand('tymblok.login', () => {
      loginPanel.show();
    }),
  );

  // Logout
  context.subscriptions.push(
    vscode.commands.registerCommand('tymblok.logout', async () => {
      await authManager.logout();
      vscode.window.showInformationMessage('Tymblok: Logged out');
      blocksProvider.refresh();
    }),
  );

  // Set active block (from sidebar click)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'tymblok.setActiveBlock',
      (item: BlockTreeItem) => {
        if (!item.blockId || item.state === 'info') return;
        const elapsed = 0; // Will be updated on next tick
        timer.setActiveBlock(
          item.blockId,
          item.label as string,
          item.state === 'completed'
            ? 'completed'
            : item.state === 'running'
              ? 'running'
              : item.state === 'paused'
                ? 'paused'
                : 'not_started',
          elapsed,
        );
      },
    ),
  );

  // Start block
  context.subscriptions.push(
    vscode.commands.registerCommand('tymblok.startBlock', async () => {
      try {
        const info = timer.getInfo();
        if (info.state === 'paused') {
          await timer.resume();
        } else {
          await timer.start();
        }
      } catch {
        vscode.window.showErrorMessage('Tymblok: Failed to start block');
      }
    }),
  );

  // Pause block
  context.subscriptions.push(
    vscode.commands.registerCommand('tymblok.pauseBlock', async () => {
      try {
        await timer.pause();
      } catch {
        vscode.window.showErrorMessage('Tymblok: Failed to pause block');
      }
    }),
  );

  // Complete block
  context.subscriptions.push(
    vscode.commands.registerCommand('tymblok.completeBlock', async () => {
      try {
        await timer.complete();
        await blocksProvider.refresh();
        const progress = blocksProvider.getProgress();
        statusBar.updateProgress(progress.completed, progress.total);
        vscode.window.showInformationMessage('Tymblok: Block completed!');
      } catch {
        vscode.window.showErrorMessage('Tymblok: Failed to complete block');
      }
    }),
  );

  // Sync GitHub PRs
  context.subscriptions.push(
    vscode.commands.registerCommand('tymblok.syncPRs', async () => {
      if (!authManager.isAuthenticated()) {
        vscode.window.showWarningMessage('Tymblok: Please login first');
        return;
      }

      try {
        vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: 'Syncing PRs...' },
          async () => {
            const prs = await githubService.getReviewRequests();
            prsProvider.update(prs);
            vscode.window.showInformationMessage(
              `Tymblok: Found ${prs.length} PR${prs.length !== 1 ? 's' : ''} to review`,
            );
          },
        );
      } catch {
        vscode.window.showErrorMessage('Tymblok: Failed to sync PRs');
      }
    }),
  );

  // Refresh blocks
  context.subscriptions.push(
    vscode.commands.registerCommand('tymblok.refreshBlocks', async () => {
      await blocksProvider.refresh();
      const progress = blocksProvider.getProgress();
      statusBar.updateProgress(progress.completed, progress.total);
    }),
  );

  // Quick pick menu (status bar click)
  context.subscriptions.push(
    vscode.commands.registerCommand('tymblok.quickPick', async () => {
      const info = timer.getInfo();
      const items: vscode.QuickPickItem[] = [];

      if (!authManager.isAuthenticated()) {
        items.push({ label: '$(sign-in) Login', description: 'Sign in to Tymblok' });
      } else {
        if (info.blockId) {
          if (info.state === 'running') {
            items.push({ label: '$(debug-pause) Pause', description: info.blockTitle || '' });
          } else if (info.state === 'paused' || info.state === 'not_started') {
            items.push({ label: '$(play) Start', description: info.blockTitle || '' });
          }
          if (info.state !== 'completed') {
            items.push({ label: '$(check) Complete', description: info.blockTitle || '' });
          }
        }
        items.push({ label: '$(refresh) Refresh Blocks' });
        items.push({ label: '$(git-pull-request) Sync PRs' });
        items.push({ label: '$(sign-out) Logout' });
      }

      const pick = await vscode.window.showQuickPick(items, {
        placeHolder: 'Tymblok Actions',
      });

      if (!pick) return;

      if (pick.label.includes('Login')) {
        vscode.commands.executeCommand('tymblok.login');
      } else if (pick.label.includes('Start')) {
        vscode.commands.executeCommand('tymblok.startBlock');
      } else if (pick.label.includes('Pause')) {
        vscode.commands.executeCommand('tymblok.pauseBlock');
      } else if (pick.label.includes('Complete')) {
        vscode.commands.executeCommand('tymblok.completeBlock');
      } else if (pick.label.includes('Refresh')) {
        vscode.commands.executeCommand('tymblok.refreshBlocks');
      } else if (pick.label.includes('Sync')) {
        vscode.commands.executeCommand('tymblok.syncPRs');
      } else if (pick.label.includes('Logout')) {
        vscode.commands.executeCommand('tymblok.logout');
      }
    }),
  );
}
