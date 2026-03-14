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

                _ = Task.Run(() => _emailService.SendWaitlistConfirmationAsync(normalizedEmail, name, ct), ct);

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

        // Fire-and-forget confirmation email
        _ = Task.Run(() => _emailService.SendWaitlistConfirmationAsync(normalizedEmail, name, ct), ct);

        return (subscriber, false);
    }
}
