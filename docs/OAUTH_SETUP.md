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
   - **Authorized JavaScript origins**:
     - Development (ngrok): `https://your-subdomain.ngrok-free.app`
     - Production: `https://api.yourdomain.com`
   - **Authorized redirect URIs** (IMPORTANT: use `/signin-google`):
     - Development (ngrok): `https://your-subdomain.ngrok-free.app/signin-google`
     - Production: `https://api.yourdomain.com/signin-google`
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

> **Note**: ASP.NET Core's Google OAuth middleware uses `/signin-google` as the callback path by default, NOT `/api/auth/external/callback`. The internal app callback is separate from the provider callback.

---

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps > New OAuth App**
3. Fill in:
   - Application name: `Tymblok`
   - Homepage URL: `https://yourdomain.com` (or ngrok URL for dev)
   - **Authorization callback URL** (IMPORTANT: use `/signin-github`):
     - Development (ngrok): `https://your-subdomain.ngrok-free.app/signin-github`
     - Production: `https://api.yourdomain.com/signin-github`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it

---

## Development Setup with ngrok

For testing OAuth on physical mobile devices, you need a publicly accessible URL. Google and GitHub OAuth don't allow local IP addresses like `192.168.x.x`.

### 1. Install ngrok

```bash
# Using npm
npm install -g ngrok

# Or download from https://ngrok.com/download
```

### 2. Authenticate ngrok (free account required)

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 3. Start ngrok tunnel

```bash
# Start tunnel to your API port
ngrok http 5000
```

You'll get a URL like: `https://abc123.ngrok-free.app`

### 4. Update Google/GitHub OAuth Settings

Add to your OAuth credentials:

- **Authorized JavaScript origins**: `https://abc123.ngrok-free.app`
- **Authorized redirect URIs**: `https://abc123.ngrok-free.app/signin-google`

### 5. Update Mobile App

Update `apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app
```

> **Note**: ngrok URLs change each time you restart (unless you have a paid plan). You'll need to update OAuth settings accordingly.

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
5. Provider redirects to: /signin-google (or /signin-github)
6. ASP.NET middleware processes response
7. Middleware redirects to: GET /api/auth/external/callback
8. API creates/links user account
9. API redirects to: {WebCallbackUrl}#access_token=...&refresh_token=...
10. Frontend extracts tokens from URL fragment
```

### Mobile Application Flow (Expo)

```
1. User taps "Sign in with Google/GitHub"
2. App creates redirect URL using Linking.createURL('auth/callback')
3. App opens browser to: GET /api/auth/external/{provider}?mobile=true&redirectUrl={encodedRedirectUrl}
4. API redirects to Google/GitHub consent screen
5. User approves access
6. Provider redirects to: /signin-google (or /signin-github)
7. ASP.NET middleware processes response
8. Middleware redirects to: GET /api/auth/external/callback?redirectUrl=...
9. API creates/links user account
10. API redirects to: {redirectUrl}?accessToken=...&refreshToken=...
11. Browser returns control to app with URL
12. App parses tokens from result.url and stores them
```

> **Note**: For Expo Go, the redirect URL is `exp://...`. For standalone builds, it uses the configured scheme `tymblok://...`.

---

## API Endpoints

| Method | Endpoint                             | Description                                       |
| ------ | ------------------------------------ | ------------------------------------------------- |
| GET    | `/api/auth/external/{provider}`      | Start OAuth flow (provider: `google` or `github`) |
| GET    | `/api/auth/external/callback`        | Internal OAuth callback (handled automatically)   |
| GET    | `/api/auth/external/providers`       | List linked providers (requires auth)             |
| DELETE | `/api/auth/external/link/{provider}` | Unlink provider (requires auth)                   |
| GET    | `/api/auth/has-password`             | Check if user has password set (requires auth)    |

### Query Parameters for `/api/auth/external/{provider}`

| Parameter     | Type   | Default | Description                                     |
| ------------- | ------ | ------- | ----------------------------------------------- |
| `mobile`      | bool   | `false` | Set to `true` for mobile deep link callback     |
| `returnUrl`   | string | `/`     | URL to redirect after auth (web only)           |
| `redirectUrl` | string | `null`  | Custom redirect URL for mobile (e.g., Expo URL) |

---

## Account Linking Behavior

| Scenario                       | Behavior                          |
| ------------------------------ | --------------------------------- |
| New OAuth user, new email      | Creates new account               |
| New OAuth user, existing email | Links OAuth to existing account   |
| Existing OAuth user            | Logs in to linked account         |
| Unlink only sign-in method     | Blocked (must add password first) |

---

## Production Setup

### 1. Configure Forwarded Headers

The API is configured to handle forwarded headers from reverse proxies (nginx, load balancers, etc.). This is required for OAuth to work correctly behind a proxy.

The middleware is already configured in `WebApplicationExtensions.cs`:

```csharp
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor |
                       ForwardedHeaders.XForwardedProto |
                       ForwardedHeaders.XForwardedHost
});
```

### 2. Configure Your Reverse Proxy

Ensure your reverse proxy (nginx, Azure App Service, etc.) forwards the correct headers:

**nginx example:**

```nginx
location / {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
}
```

### 3. OAuth Redirect URIs for Production

Add these to your OAuth provider settings:

**Google Cloud Console:**

- Authorized JavaScript origins: `https://api.yourdomain.com`
- Authorized redirect URIs: `https://api.yourdomain.com/signin-google`

**GitHub Developer Settings:**

- Authorization callback URL: `https://api.yourdomain.com/signin-github`

### 4. Mobile App Configuration

For production mobile builds, ensure the URL scheme is configured in `app.json`:

```json
{
  "expo": {
    "scheme": "tymblok"
  }
}
```

---

## Testing Locally

### Option 1: Using ngrok (Recommended for Mobile)

1. Start your API: `dotnet run`
2. Start ngrok: `ngrok http 5000`
3. Update OAuth settings with ngrok URL
4. Update mobile `.env` with ngrok URL
5. Test on physical device

### Option 2: Using localhost (Web Only)

1. Trust dev certificates:
   ```bash
   dotnet dev-certs https --trust
   ```
2. Run API:
   ```bash
   dotnet run --urls "https://localhost:5001"
   ```
3. Add to OAuth settings:
   - Authorized redirect URI: `https://localhost:5001/signin-google`
4. Test in browser

### Swagger UI

Available at `https://localhost:5001/swagger` (or your ngrok URL)

---

## Troubleshooting

### "redirect_uri_mismatch" Error

**Cause**: The redirect URI sent to Google/GitHub doesn't match what's registered.

**Solution**:

1. Check the exact URL in the error message
2. The redirect URI for Google OAuth is `/signin-google`, NOT `/api/auth/external/callback`
3. Ensure the protocol matches (`https://` not `http://`)
4. Check for trailing slashes
5. Verify the domain matches exactly

### "invalid_client" Error

- Verify Client ID and Client Secret are correct
- Check if OAuth app is still active in provider dashboard

### Browser Stays Open After Mobile OAuth

**Cause**: The app isn't receiving the deep link redirect.

**Solutions**:

1. Ensure `WebBrowser.maybeCompleteAuthSession()` is called at the top of your screen
2. Use `Linking.createURL()` to generate the redirect URL
3. Pass the redirect URL to the backend via `redirectUrl` query parameter
4. For Expo Go, the URL will be `exp://...`, not `tymblok://...`

### OAuth Works Locally but Not with ngrok

**Cause**: Backend sees `http://` instead of `https://` due to proxy.

**Solution**: Ensure forwarded headers middleware is configured (already done in this project).

### Tokens Not Received

- Check browser console/logs for errors
- Verify `WebCallbackUrl` is set correctly
- For mobile, ensure app handles the deep link scheme
- Check the `result.url` returned by `openAuthSessionAsync`

### OAuth Not Working in Tests

- OAuth providers are only configured when credentials are present
- Tests run without OAuth credentials by default
- This is expected behavior

---

## Security Considerations

1. **Never commit secrets** - Use environment variables or user secrets
2. **HTTPS only** - OAuth requires secure connections in production
3. **Validate redirect URLs** - Only allow known callback URLs
4. **Token storage** - Store tokens securely:
   - Mobile: Use SecureStore (expo-secure-store)
   - Web: Use httpOnly cookies or secure storage
5. **Audit logging** - All OAuth events are logged for security review
6. **Short-lived tokens** - Access tokens expire in 15 minutes
7. **Token rotation** - Refresh tokens are rotated on each use

---

## Quick Reference

| Environment | Google Redirect URI                                   | GitHub Redirect URI                                   |
| ----------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Local (web) | `https://localhost:5001/signin-google`                | `https://localhost:5001/signin-github`                |
| ngrok (dev) | `https://your-subdomain.ngrok-free.app/signin-google` | `https://your-subdomain.ngrok-free.app/signin-github` |
| Production  | `https://api.yourdomain.com/signin-google`            | `https://api.yourdomain.com/signin-github`            |

---

_Last updated: February 2026_
