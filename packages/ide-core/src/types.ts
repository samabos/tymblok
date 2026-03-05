/** IDE layer must implement this for secure token storage */
export interface ISecureStorage {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

/** IDE layer must implement this to provide GitHub tokens */
export interface IGitHubTokenProvider {
  getToken(scopes: string[]): Promise<string | undefined>;
}

/** IDE layer must implement this to provide local file persistence */
export interface ILocalStorage {
  read(key: string): Promise<string | undefined>;
  write(key: string, data: string): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Events the IDE layer fires into the stats collector */
export interface ActivityEvent {
  type: 'file_edit' | 'file_save' | 'commit' | 'editor_focus' | 'editor_blur';
  timestamp: number;
  language?: string;
  linesAdded?: number;
  linesRemoved?: number;
}

/** Aggregated coding session sent to the backend */
export interface CodingSession {
  startedAt: string;
  endedAt: string;
  activeSeconds: number;
  filesEdited: number;
  linesAdded: number;
  linesRemoved: number;
  languages: Record<string, number>;
  commits: number;
  blockId?: string;
  source: string;
}

/** Auth tokens from the Tymblok API */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** Auth state change event */
export type AuthState = 'authenticated' | 'unauthenticated' | 'refreshing';

/** Timer state for a block */
export type BlockTimerState = 'not_started' | 'running' | 'paused' | 'completed';

/** Listener callback type */
export type Listener<T> = (value: T) => void;

/** Disposable subscription */
export interface Disposable {
  dispose(): void;
}

/** GitHub PR data from the VS Code auth */
export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  repo: string;
  owner: string;
  author: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
  reviewRequested: boolean;
}

/** Config for the ide-core layer */
export interface IdeCoreConfig {
  apiBaseUrl: string;
  secureStorage: ISecureStorage;
  localStorage: ILocalStorage;
  githubTokenProvider?: IGitHubTokenProvider;
  source: string; // "vscode", "jetbrains", etc.
  idleTimeoutMs?: number; // default: 5 min
  syncIntervalMs?: number; // default: 5 min
  statsEnabled?: boolean; // default: true (user consent)
}
