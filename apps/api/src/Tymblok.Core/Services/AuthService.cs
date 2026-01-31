using Tymblok.Core.Entities;
using Tymblok.Core.Exceptions;
using Tymblok.Core.Interfaces;

namespace Tymblok.Core.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _repository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IAuditService _auditService;
    private readonly int _refreshTokenExpiryDays;

    public AuthService(
        IAuthRepository repository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IAuditService auditService,
        int refreshTokenExpiryDays = 7)
    {
        _repository = repository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _auditService = auditService;
        _refreshTokenExpiryDays = refreshTokenExpiryDays;
    }

    public async Task<AuthResult> RegisterAsync(string email, string password, string name, string? ipAddress = null)
    {
        // Check if email already exists
        var existingUser = await _repository.GetUserByEmailAsync(email);
        if (existingUser != null)
        {
            throw new AuthException("CONFLICT", "Email already exists");
        }

        // Create user
        var user = new User
        {
            Email = email,
            PasswordHash = _passwordHasher.Hash(password),
            Name = name
        };

        await _repository.CreateUserAsync(user);

        // Generate tokens
        var tokens = _tokenService.GenerateTokens(user);

        // Create refresh token
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = tokens.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpiryDays),
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

        return new AuthResult(tokens.AccessToken, tokens.RefreshToken, tokens.ExpiresIn, user);
    }

    public async Task<AuthResult> LoginAsync(string email, string password, string? ipAddress = null)
    {
        var user = await _repository.GetUserByEmailAsync(email);
        if (user == null || !_passwordHasher.Verify(password, user.PasswordHash))
        {
            // Audit failed login attempt
            await _auditService.LogAuthEventAsync(
                AuditAction.LoginFailed,
                user?.Id,
                email,
                ipAddress,
                errorMessage: "Invalid email or password");

            throw new AuthException("AUTH_INVALID_CREDENTIALS", "Invalid email or password");
        }

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _repository.UpdateUserAsync(user);

        // Generate tokens
        var tokens = _tokenService.GenerateTokens(user);

        // Create refresh token
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = tokens.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpiryDays),
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

        // Rotate refresh token
        var newTokens = _tokenService.GenerateTokens(refreshToken.User);

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
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpiryDays),
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
}
