import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { ILocalStorage } from '@tymblok/ide-core';

/**
 * Adapts VS Code's globalStorageUri to the ILocalStorage interface.
 * Used for persisting unsent coding sessions.
 */
export class VscodeLocalStorage implements ILocalStorage {
  private readonly storagePath: string;

  constructor(context: vscode.ExtensionContext) {
    this.storagePath = context.globalStorageUri.fsPath;
  }

  async get(_key: string): Promise<string | undefined> {
    return this.read(_key);
  }

  async read(key: string): Promise<string | undefined> {
    try {
      const filePath = path.join(this.storagePath, `${key}.json`);
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return undefined;
    }
  }

  async write(key: string, data: string): Promise<void> {
    await fs.mkdir(this.storagePath, { recursive: true });
    const filePath = path.join(this.storagePath, `${key}.json`);
    await fs.writeFile(filePath, data, 'utf-8');
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = path.join(this.storagePath, `${key}.json`);
      await fs.unlink(filePath);
    } catch {
      // File doesn't exist — that's fine
    }
  }
}
