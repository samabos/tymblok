import * as vscode from 'vscode';
import type { ISecureStorage } from '@tymblok/ide-core';

/**
 * Adapts VS Code's SecretStorage to the ISecureStorage interface.
 */
export class VscodeSecureStorage implements ISecureStorage {
  constructor(private readonly secrets: vscode.SecretStorage) {}

  async get(key: string): Promise<string | undefined> {
    return this.secrets.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.secrets.store(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.secrets.delete(key);
  }
}
