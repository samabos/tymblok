import * as vscode from 'vscode';
import type { IGitHubTokenProvider } from '@tymblok/ide-core';

/**
 * Adapts VS Code's built-in GitHub authentication to the IGitHubTokenProvider interface.
 * Uses the user's existing VS Code GitHub login — has org access without separate OAuth.
 */
export class VscodeGitHubTokenProvider implements IGitHubTokenProvider {
  async getToken(scopes: string[]): Promise<string | undefined> {
    try {
      const session = await vscode.authentication.getSession('github', scopes, {
        createIfNone: true,
      });
      return session?.accessToken;
    } catch {
      return undefined;
    }
  }

  /** Prompt user to login to GitHub if not already authenticated */
  async loginIfNeeded(scopes: string[]): Promise<string | undefined> {
    try {
      const session = await vscode.authentication.getSession('github', scopes, {
        createIfNone: true,
      });
      return session?.accessToken;
    } catch {
      return undefined;
    }
  }
}
