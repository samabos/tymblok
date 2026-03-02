import * as vscode from 'vscode';
import {
  AuthManager,
  createIdeApiClient,
  TimerManager,
  StatsCollector,
  StatsAggregator,
  GitHubService,
} from '@tymblok/ide-core';
import { VscodeSecureStorage } from './auth-provider';
import { VscodeLocalStorage } from './local-storage';
import { VscodeGitHubTokenProvider } from './github-provider';
import { StatusBar } from './status-bar';
import { ActivityTracker } from './activity-tracker';
import { BlocksProvider } from './sidebar/blocks-provider';
import { PRsProvider } from './sidebar/prs-provider';
import { LoginPanel } from './webview/login-panel';
import { registerCommands } from './commands';

let statsAggregator: StatsAggregator | null = null;
let statsCollector: StatsCollector | null = null;
let activityTracker: ActivityTracker | null = null;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  // Read config
  const config = vscode.workspace.getConfiguration('tymblok');
  const apiUrl = config.get<string>(
    'apiUrl',
    'https://tymblok-api.azurewebsites.net',
  );
  const statsEnabled = config.get<boolean>('statsEnabled', true);
  const idleTimeout = config.get<number>('idleTimeout', 300) * 1000;

  // Create platform adapters
  const secureStorage = new VscodeSecureStorage(context.secrets);
  const localStorage = new VscodeLocalStorage(context);
  const githubTokenProvider = new VscodeGitHubTokenProvider();

  // Initialize core modules
  const authManager = new AuthManager(apiUrl, secureStorage);
  await authManager.initialize();

  const api = createIdeApiClient(apiUrl, authManager);
  const timer = new TimerManager(api, idleTimeout);
  const githubService = new GitHubService(githubTokenProvider);

  // Stats collection (opt-in)
  if (statsEnabled) {
    statsCollector = new StatsCollector(idleTimeout);
    statsAggregator = new StatsAggregator(
      statsCollector,
      timer,
      api.axios,
      localStorage,
      'vscode',
    );

    activityTracker = new ActivityTracker(statsCollector, timer);
    activityTracker.activate();
    statsAggregator.start();

    context.subscriptions.push({ dispose: () => activityTracker?.dispose() });
    context.subscriptions.push({ dispose: () => statsCollector?.dispose() });
    context.subscriptions.push({ dispose: () => statsAggregator?.dispose() });
  }

  // UI components
  const statusBar = new StatusBar(timer);
  statusBar.activate();
  context.subscriptions.push(statusBar);

  const blocksProvider = new BlocksProvider(api, timer);
  const prsProvider = new PRsProvider();

  // Register tree views
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('tymblok.blocks', blocksProvider),
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('tymblok.prs', prsProvider),
  );

  // Login panel
  const loginPanel = new LoginPanel(context.extensionUri, authManager);
  context.subscriptions.push(loginPanel);

  // Register commands
  registerCommands(context, {
    authManager,
    timer,
    githubService,
    loginPanel,
    blocksProvider,
    prsProvider,
    statusBar,
  });

  // React to auth state changes
  context.subscriptions.push(
    authManager.onStateChange(async (state) => {
      if (state === 'authenticated') {
        await blocksProvider.refresh();
        const progress = blocksProvider.getProgress();
        statusBar.updateProgress(progress.completed, progress.total);
      }
    }),
  );

  // Auto-refresh blocks if authenticated
  if (authManager.isAuthenticated()) {
    await blocksProvider.refresh();
    const progress = blocksProvider.getProgress();
    statusBar.updateProgress(progress.completed, progress.total);
  }

  // Cleanup timer on deactivate
  context.subscriptions.push({ dispose: () => timer.dispose() });
}

export async function deactivate(): Promise<void> {
  // Flush any unsent coding stats before shutdown
  if (statsAggregator) {
    await statsAggregator.flush();
  }
}
