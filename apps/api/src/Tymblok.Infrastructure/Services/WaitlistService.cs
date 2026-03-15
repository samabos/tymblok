using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Tymblok.Core.Entities;
using Tymblok.Core.Interfaces;
using Tymblok.Infrastructure.Data;

namespace Tymblok.Infrastructure.Services;

public class WaitlistService : IWaitlistService
{
    private readonly TymblokDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<WaitlistService> _logger;

    public WaitlistService(
        TymblokDbContext context,
        IEmailService emailService,
        ILogger<WaitlistService> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<(WaitlistSubscriber Subscriber, bool AlreadySubscribed)> SubscribeAsync(
        string email, string? name, string? source, CancellationToken ct = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var existing = await _context.WaitlistSubscribers
            .FirstOrDefaultAsync(w => w.Email == normalizedEmail, ct);

        if (existing is not null)
        {
            if (existing.UnsubscribedAt is not null)
            {
                // Resubscribe
                existing.UnsubscribedAt = null;
                existing.SubscribedAt = DateTime.UtcNow;
                existing.Source = source;
                await _context.SaveChangesAsync(ct);

                _logger.LogInformation("Waitlist resubscribe: {Email}", normalizedEmail);

                await SendConfirmationEmailAsync(normalizedEmail, name);

                return (existing, false);
            }

            _logger.LogInformation("Waitlist duplicate (idempotent): {Email}", normalizedEmail);
            return (existing, true);
        }

        var subscriber = new WaitlistSubscriber
        {
            Email = normalizedEmail,
            Name = name?.Trim(),
            Source = source,
            SubscribedAt = DateTime.UtcNow,
        };

        _context.WaitlistSubscribers.Add(subscriber);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("New waitlist subscriber: {Email}", normalizedEmail);

        await SendConfirmationEmailAsync(normalizedEmail, name);

        return (subscriber, false);
    }

    private async Task SendConfirmationEmailAsync(string email, string? name)
    {
        try
        {
            await _emailService.SendWaitlistConfirmationAsync(email, name);
        }
        catch (Exception ex)
        {
            // Log but don't fail the subscription if email fails
            _logger.LogError(ex, "Failed to send waitlist confirmation email to {Email}", email);
        }
    }
}
