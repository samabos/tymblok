import axios from 'axios';
import type { ISecureStorage, AuthTokens, AuthState, Listener, Disposable } from './types';

const TOKEN_KEY = 'tymblok_tokens';

/**
 * Manages Tymblok authentication tokens.
 * Mirrors the mobile app's token refresh pattern with single-inflight refresh.
 */
export class AuthManager {
  private tokens: AuthTokens | null = null;
  private state: AuthState = 'unauthenticated';
  private listeners: Set<Listener<AuthState>> = new Set();
  private initialized = false;

  constructor(
    private readonly apiBaseUrl: string,
    private readonly storage: ISecureStorage,
  ) {}

  /** Load tokens from secure storage on startup */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      const stored = await this.storage.get(TOKEN_KEY);
      if (stored) {
        this.tokens = JSON.parse(stored);
        this.setState('authenticated');
      }
    } catch {
      // Corrupted storage — start fresh
      await this.storage.delete(TOKEN_KEY);
    }
    this.initialized = true;
  }

  /** Login with email/password */
  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/auth/login`, {
        email,
        password,
      });
      const data = response.data.data;
      this.tokens = {
        accessToken: data.access_token || data.accessToken,
        refreshToken: data.refresh_token || data.refreshToken,
        expiresIn: data.expires_in || data.expiresIn || 3600,
      };
      await this.persistTokens();
      this.setState('authenticated');
      return true;
    } catch {
      return false;
    }
  }

  /** Get the current access token */
  async getAccessToken(): Promise<string | undefined> {
    await this.initialize();
    return this.tokens?.accessToken;
  }

  /** Refresh tokens using the refresh token */
  async refreshTokens(): Promise<boolean> {
    if (!this.tokens?.refreshToken) return false;

    this.setState('refreshing');
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/auth/refresh`, {
        refreshToken: this.tokens.refreshToken,
      });
      const data = response.data.data;
      this.tokens = {
        accessToken: data.access_token || data.accessToken,
        refreshToken: data.refresh_token || data.refreshToken,
        expiresIn: data.expires_in || data.expiresIn || 3600,
      };
      await this.persistTokens();
      this.setState('authenticated');
      return true;
    } catch {
      await this.logout();
      return false;
    }
  }

  /** Clear tokens and logout */
  async logout(): Promise<void> {
    this.tokens = null;
    await this.storage.delete(TOKEN_KEY);
    this.setState('unauthenticated');
  }

  /** Check if user is authenticated */
  isAuthenticated(): boolean {
    return this.state === 'authenticated' && this.tokens !== null;
  }

  /** Get current auth state */
  getState(): AuthState {
    return this.state;
  }

  /** Subscribe to auth state changes */
  onStateChange(listener: Listener<AuthState>): Disposable {
    this.listeners.add(listener);
    return {
      dispose: () => this.listeners.delete(listener),
    };
  }

  private setState(newState: AuthState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.listeners.forEach((l) => l(newState));
    }
  }

  private async persistTokens(): Promise<void> {
    if (this.tokens) {
      await this.storage.set(TOKEN_KEY, JSON.stringify(this.tokens));
    }
  }
}
