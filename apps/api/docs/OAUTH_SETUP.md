# OAuth Setup Guide (Google & GitHub)

This guide explains how to configure Google and GitHub OAuth for Tymblok API.

## Overview

Tymblok supports external authentication via:
- **Google** - Sign in with Google account
- **GitHub** - Sign in with GitHub account

Users can:
- Register/login using OAuth providers
- Link OAuth to existing email/password accounts
- Use multiple OAuth providers on the same account

---

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API** (or Google Identity API)

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services > OAuth consent screen**
2. Select **External** user type (or Internal for organization-only)
3. Fill in required fields:
   - App name: `Tymblok`
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Save and continue

### 3. Create OAuth Credentials

1. Navigate to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application**
4. Configure:
   - Name: `Tymblok API`
   - Authorized redirect URIs:
     - Development: `https://localhost:5001/api/auth/external/callback`
     - Production: `https://api.yourdomain.com/api/auth/external/callback`
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

---

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps > New OAuth App**
3. Fill in:
   - Application name: `Tymblok`
   - Homepage URL: `https://yourdomain.com` (or `http://localhost:8081` for dev)
   - Authorization callback URL:
     - Development: `https://localhost:5001/api/auth/external/callback`
     - Production: `https://api.yourdomain.com/api/auth/external/callback`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it

---

## API Configuration

### Option 1: appsettings.json (Development)

```json
{
  "OAuth": {
    "Google": {
      "ClientId": "your-google-client-id.apps.googleusercontent.com",
      "ClientSecret": "your-google-client-secret"
    },
    "GitHub": {
      "ClientId": "your-github-client-id",
      "ClientSecret": "your-github-client-secret"
    },
    "MobileCallbackScheme": "tymblok",
    "WebCallbackUrl": "http://localhost:8081/auth/callback"
  }
}
```

### Option 2: Environment Variables (Production)

```bash
OAuth__Google__ClientId=your-google-client-id.apps.googleusercontent.com
OAuth__Google__ClientSecret=your-google-client-secret
OAuth__GitHub__ClientId=your-github-client-id
OAuth__GitHub__ClientSecret=your-github-client-secret
OAuth__MobileCallbackScheme=tymblok
OAuth__WebCallbackUrl=https://app.yourdomain.com/auth/callback
```

### Option 3: User Secrets (Development)

```bash
cd apps/api/src/Tymblok.Api
dotnet user-secrets set "OAuth:Google:ClientId" "your-client-id"
dotnet user-secrets set "OAuth:Google:ClientSecret" "your-client-secret"
dotnet user-secrets set "OAuth:GitHub:ClientId" "your-client-id"
dotnet user-secrets set "OAuth:GitHub:ClientSecret" "your-client-secret"
```

---

## OAuth Flow

### Web Application Flow

```
1. User clicks "Sign in with Google/GitHub"
2. Frontend redirects to: GET /api/auth/external/{provider}?mobile=false
3. API redirects to Google/GitHub consent screen
4. User approves access
5. Provider redirects to: GET /api/auth/external/callback
6. API creates/links user account
7. API redirects to: {WebCallbackUrl}#access_token=...&refresh_token=...
8. Frontend extracts tokens from URL fragment
```

### Mobile Application Flow

```
1. User taps "Sign in with Google/GitHub"
2. App opens browser to: GET /api/auth/external/{provider}?mobile=true
3. API redirects to Google/GitHub consent screen
4. User approves access
5. Provider redirects to: GET /api/auth/external/callback
6. API creates/links user account
7. API redirects to: tymblok://auth/callback?accessToken=...&refreshToken=...
8. App intercepts deep link and stores tokens
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/external/{provider}` | Start OAuth flow (provider: `google` or `github`) |
| GET | `/api/auth/external/callback` | OAuth callback (handled automatically) |
| GET | `/api/auth/external/providers` | List linked providers (requires auth) |
| DELETE | `/api/auth/external/link/{provider}` | Unlink provider (requires auth) |
| GET | `/api/auth/has-password` | Check if user has password set (requires auth) |

### Query Parameters for `/api/auth/external/{provider}`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mobile` | bool | `false` | Set to `true` for mobile deep link callback |
| `returnUrl` | string | `/` | URL to redirect after auth (web only) |

---

## Account Linking Behavior

| Scenario | Behavior |
|----------|----------|
| New OAuth user, new email | Creates new account |
| New OAuth user, existing email | Links OAuth to existing account |
| Existing OAuth user | Logs in to linked account |
| Unlink only sign-in method | Blocked (must add password first) |

---

## Testing Locally

1. **HTTPS Required**: OAuth providers require HTTPS. Use:
   ```bash
   dotnet dev-certs https --trust
   dotnet run --urls "https://localhost:5001"
   ```

2. **Test the flow**:
   - Open browser to `https://localhost:5001/api/auth/external/google`
   - Complete Google sign-in
   - Check redirect with tokens

3. **Swagger UI**: Available at `https://localhost:5001/swagger`

---

## Troubleshooting

### "redirect_uri_mismatch" Error
- Ensure the callback URL in provider settings exactly matches:
  `https://localhost:5001/api/auth/external/callback`
- Check for trailing slashes

### "invalid_client" Error
- Verify Client ID and Client Secret are correct
- Check if OAuth app is still active in provider dashboard

### Tokens not received
- Check browser console for errors
- Verify `WebCallbackUrl` is set correctly
- For mobile, ensure app handles the deep link scheme

### OAuth not working in tests
- OAuth providers are only configured when credentials are present
- Tests run without OAuth credentials by default
- This is expected behavior

---

## Security Considerations

1. **Never commit secrets** - Use environment variables or user secrets
2. **HTTPS only** - OAuth requires secure connections
3. **Validate redirect URLs** - Only allow known callback URLs
4. **Token storage** - Store tokens securely (SecureStore on mobile, httpOnly cookies on web)
5. **Audit logging** - All OAuth events are logged for security review
