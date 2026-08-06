using System.Security.Cryptography;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Security;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Auth.Jobs;

/// <summary>
/// Issues and delivers a password-reset token out of band.
///
/// This runs in the background rather than inline because an SMTP round trip has no upper bound,
/// and ForgotPasswordCommandHandler's whole anti-enumeration design rests on both branches taking
/// the same time. A floor cannot fix that: the matching-email branch was reliably *slower* than
/// the floor, so the timing still told an attacker which addresses are registered.
///
/// The job takes only a pilot id — the token is generated here rather than passed in, because
/// Hangfire persists job arguments and renders them in the /hangfire dashboard, and a live
/// password-reset token has no business sitting there in plaintext.
/// </summary>
[AutomaticRetry(Attempts = 3)]
public class SendPasswordResetEmailJob
{
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(1);

    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<SendPasswordResetEmailJob> _logger;

    public SendPasswordResetEmailJob(
        IApplicationDbContext context,
        IEmailService emailService,
        ILogger<SendPasswordResetEmailJob> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid pilotId, CancellationToken cancellationToken)
    {
        var pilot = await _context.Pilots.FirstOrDefaultAsync(p => p.Id == pilotId, cancellationToken);

        if (pilot?.Email is null)
        {
            _logger.LogWarning("Password reset job skipped: pilot {PilotId} not found or has no email", pilotId);
            return;
        }

        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToBase64String(tokenBytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');

        pilot.PasswordResetTokenHash = TokenHasher.Hash(token);
        pilot.PasswordResetTokenExpiresAtUtc = DateTime.UtcNow.Add(TokenLifetime);
        await _context.SaveChangesAsync(cancellationToken);

        await _emailService.SendPasswordResetEmailAsync(pilot.Email, token, cancellationToken);

        _logger.LogInformation("Password reset email sent for pilot {PilotId}", pilotId);
    }
}
