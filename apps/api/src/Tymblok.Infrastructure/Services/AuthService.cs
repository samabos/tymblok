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

    public async Task<AuthResult> RegisterAsync(string email, string password, string name, string? ipAddress = null)
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

    public async Task<AuthResult> LoginAsync(string email, string password, string? ipAddress = null)
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

            throw new AuthException("AUTH_REFRESH_EXPIRED", "Refresh token has expired or been revoked");
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
}
