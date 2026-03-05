import * as vscode from 'vscode';
import type { AuthManager, TimerManager, GitHubService, createIdeApiClient } from '@tymblok/ide-core';
import type { LoginPanel } from './webview/login-panel';
import type { BlocksProvider, BlockTreeItem } from './sidebar/blocks-provider';
import type { InboxProvider, InboxTreeItem } from './sidebar/inbox-provider';
import type { StatusBar } from './status-bar';

interface CommandsDeps {
  authManager: AuthManager;
  timer: TimerManager;
  githubService: GitHubService;
  api: ReturnType<typeof createIdeApiClient>;
  loginPanel: LoginPanel;
  blocksProvider: BlocksProvider;
  inboxProvider: InboxProvider;
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
    api,
    loginPanel,
    blocksProvider,
    inboxProvider,
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

  // Set active block (used internally by inline sidebar buttons)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'tymblok.setActiveBlock',
      (item: BlockTreeItem) => {
        if (!item.blockId || item.state === 'info') return;
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
          0,
        );
      },
    ),
  );

  // Block actions quick pick — triggered by clicking a block in the sidebar
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'tymblok.blockActions',
      async (item: BlockTreeItem) => {
        if (!item?.blockId || item.state === 'info') return;

        // Set as active block so start/pause/complete act on it
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
          0,
        );

        const actions: vscode.QuickPickItem[] = [];

        if (item.state === 'not_started' || item.state === 'paused') {
          actions.push({ label: '$(play) Start', description: 'Start timer' });
        }
        if (item.state === 'running') {
          actions.push({ label: '$(debug-pause) Pause', description: 'Pause timer' });
        }
        if (item.state !== 'completed') {
          actions.push({ label: '$(check) Complete', description: 'Mark as complete' });
        }
        if (item.externalUrl) {
          actions.push({ label: '$(link-external) Open in Browser', description: item.externalUrl });
        }

        if (actions.length === 0) return;

        const pick = await vscode.window.showQuickPick(actions, {
          placeHolder: item.label as string,
        });

        if (!pick) return;

        if (pick.label.includes('Start')) {
          vscode.commands.executeCommand('tymblok.startBlock');
        } else if (pick.label.includes('Pause')) {
          vscode.commands.executeCommand('tymblok.pauseBlock');
        } else if (pick.label.includes('Complete')) {
          vscode.commands.executeCommand('tymblok.completeBlock');
        } else if (pick.label.includes('Open in Browser')) {
          vscode.env.openExternal(vscode.Uri.parse(item.externalUrl!));
        }
      },
    ),
  );

  // Open block external URL — available via right-click context menu
  context.subscriptions.push(
    vscode.commands.registerCommand('tymblok.openBlockUrl', (item: BlockTreeItem) => {
      if (item?.externalUrl) {
        vscode.env.openExternal(vscode.Uri.parse(item.externalUrl));
      }
    }),
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

  // Sync — fetch GitHub PRs, push to backend inbox, refresh inbox panel
  context.subscriptions.push(
    vscode.commands.registerCommand('tymblok.sync', async () => {
      if (!authManager.isAuthenticated()) {
        vscode.window.showWarningMessage('Tymblok: Please login first');
        return;
      }

      vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Tymblok: Syncing...' },
        async () => {
          try {
            const prs = await githubService.getReviewRequests();
            if (prs.length > 0) {
              await githubService.syncToBackend(prs, api.axios);
            }
            await inboxProvider.refresh();
            vscode.window.showInformationMessage(
              prs.length > 0
                ? `Tymblok: Inbox synced (${prs.length} PR${prs.length !== 1 ? 's' : ''} from GitHub)`
                : 'Tymblok: Inbox synced',
            );
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Tymblok: Sync failed — ${msg}`);
          }
        },
      );
    }),
  );

  // Schedule inbox item to Today
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'tymblok.scheduleToToday',
      async (item: InboxTreeItem) => {
        if (!item?.inboxItem) return;
        const inboxItem = item.inboxItem;

        try {
          const today = new Date().toISOString().split('T')[0];

          // Duplicate check — same as mobile
          const todayBlocks = await api.blocks.list({ date: today });
          const duplicate = todayBlocks.find(
            (b) =>
              (inboxItem.externalId && b.externalId === inboxItem.externalId) ||
              b.title.toLowerCase() === inboxItem.title.toLowerCase(),
          );

          if (duplicate) {
            const answer = await vscode.window.showWarningMessage(
              `"${inboxItem.title}" is already on today's schedule. Add anyway?`,
              'Add Anyway',
              'Cancel',
            );
            if (answer !== 'Add Anyway') return;
          }

          const categories = await api.categories.list();
          if (!categories.length) {
            vscode.window.showErrorMessage(
              'Tymblok: No categories found. Create one in the mobile app first.',
            );
            return;
          }

          const now = new Date();
          const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const sourceMap: Record<string, string> = {
            GitHub: 'GitHub',
            GoogleCalendar: 'GoogleCalendar',
          };

          await api.blocks.create({
            title: inboxItem.title,
            subtitle: inboxItem.description ?? undefined,
            categoryId: categories[0].id,
            date: today,
            startTime,
            durationMinutes: 60,
            isUrgent: inboxItem.priority === 'Critical' || inboxItem.priority === 'High',
            externalId: inboxItem.externalId ?? undefined,
            externalUrl: inboxItem.externalUrl ?? undefined,
            externalSource: sourceMap[inboxItem.source] ?? undefined,
          });

          await blocksProvider.refresh();
          const progress = blocksProvider.getProgress();
          statusBar.updateProgress(progress.completed, progress.total);

          vscode.window.showInformationMessage(
            `Tymblok: "${inboxItem.title}" added to today`,
          );
        } catch {
          vscode.window.showErrorMessage('Tymblok: Failed to schedule item');
        }
      },
    ),
  );

  // Dismiss inbox item
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'tymblok.dismissInboxItem',
      async (item: InboxTreeItem) => {
        if (!item?.inboxItem) return;
        try {
          await api.inbox.dismiss(item.inboxItem.id);
          await inboxProvider.refresh();
        } catch {
          vscode.window.showErrorMessage('Tymblok: Failed to dismiss item');
        }
      },
    ),
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
        items.push({ label: '$(sync) Sync' });
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
      } else if (pick.label.includes('Sync')) {
        vscode.commands.executeCommand('tymblok.sync');
      } else if (pick.label.includes('Logout')) {
        vscode.commands.executeCommand('tymblok.logout');
      }
    }),
  );
}
