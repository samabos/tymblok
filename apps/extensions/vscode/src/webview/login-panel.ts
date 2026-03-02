import * as vscode from 'vscode';
import type { AuthManager } from '@tymblok/ide-core';

/**
 * Webview panel for email/password login.
 * Shows a simple form when the user isn't authenticated.
 */
export class LoginPanel {
  private panel: vscode.WebviewPanel | null = null;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly authManager: AuthManager,
  ) {}

  /** Show the login webview */
  show(): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'tymblokLogin',
      'Tymblok Login',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: false,
      },
    );

    this.panel.webview.html = this.getHtml();

    this.panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'login') {
        const success = await this.authManager.login(
          message.email,
          message.password,
        );
        this.panel?.webview.postMessage({
          command: 'loginResult',
          success,
          error: success ? undefined : 'Invalid email or password',
        });
        if (success) {
          this.panel?.dispose();
        }
      }
    });

    this.panel.onDidDispose(() => {
      this.panel = null;
    });
  }

  dispose(): void {
    this.panel?.dispose();
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tymblok Login</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 24px;
      max-width: 400px;
      margin: 0 auto;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    h2 {
      text-align: center;
      margin-bottom: 24px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      margin-bottom: 4px;
      font-size: 13px;
    }
    input {
      width: 100%;
      padding: 8px;
      box-sizing: border-box;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      font-size: 14px;
    }
    input:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }
    button {
      width: 100%;
      padding: 10px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      margin-top: 8px;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .error {
      color: var(--vscode-errorForeground);
      font-size: 13px;
      margin-top: 8px;
      text-align: center;
    }
  </style>
</head>
<body>
  <h2>Tymblok</h2>
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" placeholder="you@example.com" />
  </div>
  <div class="form-group">
    <label for="password">Password</label>
    <input type="password" id="password" placeholder="Password" />
  </div>
  <button id="loginBtn">Sign In</button>
  <div id="error" class="error"></div>
  <script>
    const vscode = acquireVsCodeApi();
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const errorEl = document.getElementById('error');

    loginBtn.addEventListener('click', () => {
      errorEl.textContent = '';
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing in...';
      vscode.postMessage({
        command: 'login',
        email: emailInput.value,
        password: passwordInput.value,
      });
    });

    // Allow Enter key to submit
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loginBtn.click();
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.command === 'loginResult') {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
        if (!msg.success) {
          errorEl.textContent = msg.error || 'Login failed';
        }
      }
    });
  </script>
</body>
</html>`;
  }
}
