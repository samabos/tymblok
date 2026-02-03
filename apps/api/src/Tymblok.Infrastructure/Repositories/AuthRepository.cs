using Microsoft.EntityFrameworkCore;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure.Repositories;

/// <summary>
/// Repository for auth-related data access.
/// Note: User management is handled by Identity's UserManager.
/// This repository handles RefreshToken and UserSession operations.
/// </summary>
public class AuthRepository : IAuthRepository
{
    private readonly TymblokDbContext _context;

    public AuthRepository(TymblokDbContext context)
    {
        _context = context;
    }

    // RefreshToken operations

    public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
    {
        return await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token);
    }

    public async Task<RefreshToken> CreateRefreshTokenAsync(RefreshToken refreshToken)
    {
        _context.RefreshTokens.Add(refreshToken);
        return refreshToken;
    }

    public Task UpdateRefreshTokenAsync(RefreshToken refreshToken)
    {
        _context.RefreshTokens.Update(refreshToken);
        return Task.CompletedTask;
    }

    // Session operations

    public async Task<IList<UserSession>> GetActiveSessionsAsync(Guid userId)
    {
        return await _context.UserSessions
            .Include(s => s.RefreshToken)
            .Where(s => s.UserId == userId && s.IsActive && s.RevokedAt == null)
            .OrderByDescending(s => s.LastActiveAt)
            .ToListAsync();
    }

    public async Task<UserSession?> GetSessionByIdAsync(Guid sessionId)
    {
        return await _context.UserSessions
            .Include(s => s.RefreshToken)
            .FirstOrDefaultAsync(s => s.Id == sessionId);
    }

    public async Task<UserSession> CreateSessionAsync(UserSession session)
    {
        _context.UserSessions.Add(session);
        return session;
    }

    public Task UpdateSessionAsync(UserSession session)
    {
        _context.UserSessions.Update(session);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
