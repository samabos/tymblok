using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Infrastructure.Services;

public class AuthServiceSettings
{
    public int RefreshTokenExpiryDays { get; set; } = 7;
    public string AppBaseUrl { get; set; } = "http://localhost:8081";
}

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ITokenService _tokenService;
    private readonly IAuditService _auditService;
    private readonly IEmailService _emailService;
    private readonly IAuthRepository _repository;
    private readonly AuthServiceSettings _settings;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<ApplicationRole> roleManager,
        ITokenService tokenService,
        IAuditService auditService,
        IEmailService emailService,
        IAuthRepository repository,
        IOptions<AuthServiceSettings> settings)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _tokenService = tokenService;
        _auditService = auditService;
        _emailService = emailService;
        _repository = repository;
        _settings = settings.Value;
    }

    public async Task<AuthResult> RegisterAsync(string email, string password, string name, string? ipAddress = null, string? deviceType = null, string? deviceName = null, string? deviceOs = null)
    {
        // Check if email already exists
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser != null)
        {
            throw new AuthException("CONFLICT", "Email already exists");
        }

        // Create user
        var user = new ApplicationUser
        {
            Email = email,
            UserName = email, // Identity requires UserName
            Name = name,
            EmailConfirmed = false
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new AuthException("VALIDATION_ERROR", errors);
        }

        // Ensure default role exists
        if (!await _roleManager.RoleExistsAsync(RoleNames.ServiceUser))
        {
            await _roleManager.CreateAsync(new ApplicationRole(RoleNames.ServiceUser, "Default user role"));
        }

        // Assign default role
        await _userManager.AddToRoleAsync(user, RoleNames.ServiceUser);

        // Get user roles for token
        var roles = await _userManager.GetRolesAsync(user);

        // Generate tokens
        var tokens = _tokenService.GenerateTokens(user, roles);

        // Create refresh token
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = tokens.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpiryDays),
            CreatedByIp = ipAddress
        };

        await _repository.CreateRefreshTokenAsync(refreshToken);
        await _repository.SaveChangesAsync();

        // Create session for this login
        await CreateSessionAsync(user.Id, refreshToken.Id, deviceType, deviceName, deviceOs, ipAddress);

        // Audit log
        await _auditService.LogAuthEventAsync(
            AuditAction.Register,
            user.Id,
            email,
            ipAddress);

        // Send verification email (non-blocking)
        _ = Task.Run(async () =>
        {
            try
            {
                await SendEmailVerificationAsync(user.Id);
            }
            catch
            {
                // Log but don't fail registration
            }
        });

        return new AuthResult(tokens.AccessToken, tokens.RefreshToken, tokens.ExpiresIn, user);
    }

    public async Task<AuthResult> LoginAsync(string email, string password, string? ipAddress = null, string? deviceType = null, string? deviceName = null, string? deviceOs = null)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            await _auditService.LogAuthEventAsync(
                AuditAction.LoginFailed,
                null,
                email,
                ipAddress,
                errorMessage: "User not found");

            throw new AuthException("AUTH_INVALID_CREDENTIALS", "Invalid email or password");
        }

        // Check password using SignInManager (handles lockout, etc.)
        var signInResult = await _signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);

        if (signInResult.IsLockedOut)
        {
            await _auditService.LogAuthEventAsync(
                AuditAction.LoginFailed,
                user.Id,
                email,
                ipAddress,
                errorMessage: "Account locked out");

            throw new AuthException("AUTH_LOCKED_OUT", "Account is locked. Please try again later.");
        }

        if (!signInResult.Succeeded)
        {
            await _auditService.LogAuthEventAsync(
                AuditAction.LoginFailed,
                user.Id,
                email,
                ipAddress,
                errorMessage: "Invalid password");

            throw new AuthException("AUTH_INVALID_CREDENTIALS", "Invalid email or password");
        }

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        // Get user roles for token
        var roles = await _userManager.GetRolesAsync(user);

        // Generate tokens
        var tokens = _tokenService.GenerateTokens(user, roles);

        // Create refresh token
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = tokens.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpiryDays),
            CreatedByIp = ipAddress
        };

        await _repository.CreateRefreshTokenAsync(refreshToken);
        await _repository.SaveChangesAsync();

        // Create session for this login
        await CreateSessionAsync(user.Id, refreshToken.Id, deviceType, deviceName, deviceOs, ipAddress);

        // Audit successful login
        await _auditService.LogAuthEventAsync(
            AuditAction.Login,
            user.Id,
            email,
            ipAddress);

        return new AuthResult(tokens.AccessToken, tokens.RefreshToken, tokens.ExpiresIn, user);
    }

    public async Task<RefreshResult> RefreshTokenAsync(string token, string? ipAddress = null)
    {
        var refreshToken = await _repository.GetRefreshTokenAsync(token);

        if (refreshToken == null)
        {
            await _auditService.LogAuthEventAsync(
                AuditAction.TokenRefreshFailed,
                ipAddress: ipAddress,
                errorMessage: "Invalid refresh token");

            throw new AuthException("AUTH_TOKEN_INVALID", "Invalid refresh token");
        }

        if (!refreshToken.IsActive)
        {
            await _auditService.LogAuthEventAsync(
                AuditAction.TokenRefreshFailed,
                refreshToken.UserId,
                refreshToken.User?.Email,
                ipAddress,
                errorMessage: "Refresh token expired or revoked");

            throw new AuthException("AUTH_SESSION_EXPIRED", "Session expired, Please log in again.");
        }

        var user = refreshToken.User;
        if (user == null)
        {
            throw new AuthException("AUTH_USER_NOT_FOUND", "User not found");
        }

        // Get user roles for token
        var roles = await _userManager.GetRolesAsync(user);

        // Rotate refresh token
        var newTokens = _tokenService.GenerateTokens(user, roles);

        // Revoke old token
        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.RevokedByIp = ipAddress;
        refreshToken.ReplacedByToken = newTokens.RefreshToken;
        await _repository.UpdateRefreshTokenAsync(refreshToken);

        // Create new refresh token
        var newRefreshToken = new RefreshToken
        {
            UserId = refreshToken.UserId,
            Token = newTokens.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpiryDays),
            CreatedByIp = ipAddress
        };

        await _repository.CreateRefreshTokenAsync(newRefreshToken);
        await _repository.SaveChangesAsync();

        // Audit successful token refresh
        await _auditService.LogAuthEventAsync(
            AuditAction.TokenRefresh,
            refreshToken.UserId,
            refreshToken.User?.Email,
            ipAddress);

        return new RefreshResult(newTokens.AccessToken, newTokens.RefreshToken, newTokens.ExpiresIn);
    }

    public async Task RevokeTokenAsync(string token, string? ipAddress = null)
    {
        var refreshToken = await _repository.GetRefreshTokenAsync(token);

        if (refreshToken == null)
        {
            throw new AuthException("AUTH_TOKEN_INVALID", "Invalid refresh token");
        }

        if (!refreshToken.IsActive)
        {
            return; // Already revoked
        }

        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.RevokedByIp = ipAddress;
        await _repository.UpdateRefreshTokenAsync(refreshToken);
        await _repository.SaveChangesAsync();

        // Audit logout
        await _auditService.LogAuthEventAsync(
            AuditAction.Logout,
            refreshToken.UserId,
            refreshToken.User?.Email,
            ipAddress);
    }

    public async Task SendEmailVerificationAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new AuthException("USER_NOT_FOUND", "User not found");
        }

        if (user.EmailConfirmed)
        {
            return; // Already verified
        }

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = Uri.EscapeDataString(token);
        var verificationLink = $"{_settings.AppBaseUrl}/verify-email?userId={userId}&token={encodedToken}";

        await _emailService.SendEmailVerificationAsync(user.Email!, user.Name, verificationLink);
    }

    public async Task<bool> VerifyEmailAsync(Guid userId, string token)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return false;
        }

        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (result.Succeeded)
        {
            // Send welcome email
            await _emailService.SendWelcomeEmailAsync(user.Email!, user.Name);
            return true;
        }

        return false;
    }

    public async Task SendPasswordResetAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            // Don't reveal if email exists - silently return
            return;
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = Uri.EscapeDataString(token);
        var resetLink = $"{_settings.AppBaseUrl}/reset-password?email={Uri.EscapeDataString(email)}&token={encodedToken}";

        await _emailService.SendPasswordResetAsync(email, user.Name, resetLink);
    }

    public async Task<bool> ResetPasswordAsync(string email, string token, string newPassword)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            return false;
        }

        var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
        if (result.Succeeded)
        {
            // Send password changed notification
            await _emailService.SendPasswordChangedNotificationAsync(email, user.Name);
            return true;
        }

        return false;
    }

    public async Task<AuthResult> ExternalLoginAsync(
        string provider,
        string providerKey,
        string? email,
        string? name,
        string? avatarUrl,
        string? ipAddress = null,
        string? deviceType = null,
        string? deviceName = null,
        string? deviceOs = null)
    {
        // 1. Check if this external login already exists
        var existingUser = await _userManager.FindByLoginAsync(provider, providerKey);

        if (existingUser != null)
        {
            // User has logged in with this provider before
            var needsUpdate = false;

            // Mark email as verified if not already (OAuth provider has verified this email)
            if (!existingUser.EmailConfirmed)
            {
                existingUser.EmailConfirmed = true;
                needsUpdate = true;
            }

            // Sync avatar from OAuth provider if user has no avatar yet
            // User-uploaded avatars (base64 data URLs) take priority
            if (string.IsNullOrEmpty(existingUser.AvatarUrl) && !string.IsNullOrEmpty(avatarUrl))
            {
                existingUser.AvatarUrl = avatarUrl;
                needsUpdate = true;
            }

            if (needsUpdate)
            {
                await _userManager.UpdateAsync(existingUser);
            }

            return await CreateAuthResultForExternalLoginAsync(existingUser, ipAddress, deviceType, deviceName, deviceOs);
        }

        // 2. Check if a user with this email already exists
        ApplicationUser? user = null;
        if (!string.IsNullOrEmpty(email))
        {
            user = await _userManager.FindByEmailAsync(email);
        }

        if (user != null)
        {
            // Link this external login to existing account
            var loginInfo = new UserLoginInfo(provider, providerKey, provider);
            var addLoginResult = await _userManager.AddLoginAsync(user, loginInfo);

            if (!addLoginResult.Succeeded)
            {
                var errors = string.Join(", ", addLoginResult.Errors.Select(e => e.Description));
                throw new AuthException("EXTERNAL_LOGIN_FAILED", $"Failed to link account: {errors}");
            }

            // Mark email as verified - OAuth provider has verified this email
            // Also sync avatar from OAuth provider if user has no avatar yet
            var needsUpdate = false;

            if (!user.EmailConfirmed)
            {
                user.EmailConfirmed = true;
                needsUpdate = true;
            }

            // Sync avatar from OAuth provider if user has no avatar yet
            // User-uploaded avatars (base64 data URLs) take priority
            if (string.IsNullOrEmpty(user.AvatarUrl) && !string.IsNullOrEmpty(avatarUrl))
            {
                user.AvatarUrl = avatarUrl;
                needsUpdate = true;
            }

            if (needsUpdate)
            {
                await _userManager.UpdateAsync(user);
            }

            // Audit: linked external account
            await _auditService.LogAuthEventAsync(
                AuditAction.ExternalLoginLinked,
                user.Id,
                email,
                ipAddress);

            return await CreateAuthResultForExternalLoginAsync(user, ipAddress, deviceType, deviceName, deviceOs);
        }

        // 3. Create new user with external login
        user = new ApplicationUser
        {
            Email = email,
            UserName = email ?? $"{provider}_{providerKey}",
            Name = name ?? "User",
            AvatarUrl = avatarUrl,
            EmailConfirmed = true // OAuth emails are verified by provider
        };

        var createResult = await _userManager.CreateAsync(user);
        if (!createResult.Succeeded)
        {
            var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
            throw new AuthException("EXTERNAL_LOGIN_FAILED", $"Failed to create user: {errors}");
        }

        // Add external login
        var newLoginInfo = new UserLoginInfo(provider, providerKey, provider);
        await _userManager.AddLoginAsync(user, newLoginInfo);

        // Ensure default role exists and assign
        if (!await _roleManager.RoleExistsAsync(RoleNames.ServiceUser))
        {
            await _roleManager.CreateAsync(new ApplicationRole(RoleNames.ServiceUser, "Default user role"));
        }
        await _userManager.AddToRoleAsync(user, RoleNames.ServiceUser);

        // Audit: new user via external login
        await _auditService.LogAuthEventAsync(
            AuditAction.RegisterExternal,
            user.Id,
            email,
            ipAddress);

        return await CreateAuthResultForExternalLoginAsync(user, ipAddress, deviceType, deviceName, deviceOs);
    }

    private async Task<AuthResult> CreateAuthResultForExternalLoginAsync(
        ApplicationUser user,
        string? ipAddress,
        string? deviceType = null,
        string? deviceName = null,
        string? deviceOs = null)
    {
        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        // Get roles and generate tokens
        var roles = await _userManager.GetRolesAsync(user);
        var tokens = _tokenService.GenerateTokens(user, roles);

        // Create refresh token
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = tokens.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpiryDays),
            CreatedByIp = ipAddress
        };

        await _repository.CreateRefreshTokenAsync(refreshToken);
        await _repository.SaveChangesAsync();

        // Create session for this login
        await CreateSessionAsync(user.Id, refreshToken.Id, deviceType, deviceName, deviceOs, ipAddress);

        return new AuthResult(tokens.AccessToken, tokens.RefreshToken, tokens.ExpiresIn, user);
    }

    public async Task LinkExternalLoginAsync(
        Guid userId,
        string provider,
        string providerKey,
        string? email = null)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new AuthException("USER_NOT_FOUND", "User not found");
        }

        // Check if this provider is already linked to another account
        var existingUser = await _userManager.FindByLoginAsync(provider, providerKey);
        if (existingUser != null && existingUser.Id != userId)
        {
            throw new AuthException("PROVIDER_ALREADY_LINKED",
                "This external account is already linked to another user");
        }

        var loginInfo = new UserLoginInfo(provider, providerKey, provider);
        var result = await _userManager.AddLoginAsync(user, loginInfo);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new AuthException("LINK_FAILED", errors);
        }

        await _auditService.LogAuthEventAsync(
            AuditAction.ExternalLoginLinked,
            user.Id,
            user.Email,
            email);
    }

    public async Task UnlinkExternalLoginAsync(Guid userId, string provider)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new AuthException("USER_NOT_FOUND", "User not found");
        }

        var logins = await _userManager.GetLoginsAsync(user);
        var login = logins.FirstOrDefault(l => l.LoginProvider.Equals(provider, StringComparison.OrdinalIgnoreCase));

        if (login == null)
        {
            throw new AuthException("LOGIN_NOT_FOUND", "External login not found");
        }

        // Ensure user has another way to sign in
        var hasPassword = await _userManager.HasPasswordAsync(user);
        if (!hasPassword && logins.Count <= 1)
        {
            throw new AuthException("CANNOT_UNLINK",
                "Cannot remove the only sign-in method. Add a password first.");
        }

        var result = await _userManager.RemoveLoginAsync(user, login.LoginProvider, login.ProviderKey);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new AuthException("UNLINK_FAILED", errors);
        }

        await _auditService.LogAuthEventAsync(
            AuditAction.ExternalLoginUnlinked,
            user.Id,
            user.Email);
    }

    public async Task<IList<string>> GetLinkedProvidersAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return new List<string>();
        }

        var logins = await _userManager.GetLoginsAsync(user);
        return logins.Select(l => l.LoginProvider).ToList();
    }

    public async Task<bool> HasPasswordAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return false;
        }

        return await _userManager.HasPasswordAsync(user);
    }

    public async Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new AuthException("USER_NOT_FOUND", "User not found");
        }

        var hasPassword = await _userManager.HasPasswordAsync(user);
        if (!hasPassword)
        {
            throw new AuthException("NO_PASSWORD", "You don't have a password set. Use 'Set Password' instead.");
        }

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            if (result.Errors.Any(e => e.Code == "PasswordMismatch"))
            {
                throw new AuthException("INVALID_CURRENT_PASSWORD", "Current password is incorrect");
            }
            throw new AuthException("CHANGE_PASSWORD_FAILED", errors);
        }

        await _auditService.LogAuthEventAsync(
            AuditAction.PasswordChange,
            user.Id,
            user.Email);

        // Send password changed notification email
        if (user.Email != null && user.Name != null)
        {
            await _emailService.SendPasswordChangedNotificationAsync(user.Email, user.Name);
        }
    }

    public async Task SetPasswordAsync(Guid userId, string password)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new AuthException("USER_NOT_FOUND", "User not found");
        }

        var hasPassword = await _userManager.HasPasswordAsync(user);
        if (hasPassword)
        {
            throw new AuthException("ALREADY_HAS_PASSWORD", "You already have a password set. Use 'Change Password' instead.");
        }

        var result = await _userManager.AddPasswordAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new AuthException("SET_PASSWORD_FAILED", errors);
        }

        await _auditService.LogAuthEventAsync(
            AuditAction.PasswordSet,
            user.Id,
            user.Email);

        // Send password set confirmation email
        if (user.Email != null && user.Name != null)
        {
            await _emailService.SendPasswordChangedNotificationAsync(user.Email, user.Name);
        }
    }

    // Session management

    public async Task<IList<UserSession>> GetSessionsAsync(Guid userId)
    {
        return await _repository.GetActiveSessionsAsync(userId);
    }

    public async Task RevokeSessionAsync(Guid userId, Guid sessionId)
    {
        var session = await _repository.GetSessionByIdAsync(sessionId);
        if (session == null || session.UserId != userId)
        {
            throw new AuthException("SESSION_NOT_FOUND", "Session not found");
        }

        session.IsActive = false;
        session.RevokedAt = DateTime.UtcNow;

        // Also revoke the associated refresh token
        if (session.RefreshToken != null && session.RefreshToken.IsActive)
        {
            session.RefreshToken.RevokedAt = DateTime.UtcNow;
            await _repository.UpdateRefreshTokenAsync(session.RefreshToken);
        }

        await _repository.UpdateSessionAsync(session);
        await _repository.SaveChangesAsync();

        await _auditService.LogAuthEventAsync(
            AuditAction.SessionRevoked,
            userId,
            ipAddress: session.IpAddress);
    }

    public async Task RevokeAllSessionsAsync(Guid userId, Guid? exceptSessionId = null)
    {
        var sessions = await _repository.GetActiveSessionsAsync(userId);

        foreach (var session in sessions)
        {
            if (exceptSessionId.HasValue && session.Id == exceptSessionId.Value)
            {
                continue; // Skip current session
            }

            session.IsActive = false;
            session.RevokedAt = DateTime.UtcNow;

            // Also revoke the associated refresh token
            if (session.RefreshToken != null && session.RefreshToken.IsActive)
            {
                session.RefreshToken.RevokedAt = DateTime.UtcNow;
                await _repository.UpdateRefreshTokenAsync(session.RefreshToken);
            }

            await _repository.UpdateSessionAsync(session);
        }

        await _repository.SaveChangesAsync();

        await _auditService.LogAuthEventAsync(
            AuditAction.AllSessionsRevoked,
            userId);
    }

    public async Task<UserSession> CreateSessionAsync(
        Guid userId,
        Guid refreshTokenId,
        string? deviceType,
        string? deviceName,
        string? deviceOs,
        string? ipAddress)
    {
        var session = new UserSession
        {
            UserId = userId,
            RefreshTokenId = refreshTokenId,
            DeviceType = deviceType,
            DeviceName = deviceName,
            DeviceOs = deviceOs,
            IpAddress = ipAddress,
            IsActive = true,
            IsCurrent = true,
            LastActiveAt = DateTime.UtcNow
        };

        await _repository.CreateSessionAsync(session);
        await _repository.SaveChangesAsync();

        return session;
    }
}
