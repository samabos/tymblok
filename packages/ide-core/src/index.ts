// Types
export type {
  ISecureStorage,
  IGitHubTokenProvider,
  ILocalStorage,
  ActivityEvent,
  CodingSession,
  AuthTokens,
  AuthState,
  BlockTimerState,
  Listener,
  Disposable,
  GitHubPR,
  IdeCoreConfig,
} from './types';

// Core modules
export { AuthManager } from './auth-manager';
export { createIdeApiClient } from './api-client';
export { TimerManager, type TimerInfo } from './timer-manager';
export { StatsCollector } from './stats-collector';
export { StatsAggregator } from './stats-aggregator';
export { GitHubService } from './github-service';
export { RealtimeClient } from './realtime-client';
