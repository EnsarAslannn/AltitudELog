using System.Diagnostics;
using AltitudELog.Application.Auth.Jobs;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Security;
using Hangfire;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Auth.Commands.ForgotPassword;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand>
{
    // Floor on total handler duration. Both branches now do comparable work — a lookup, and at
    // most one small enqueue INSERT — so this only has to absorb that difference. It used to be
    // asked to hide an inline SMTP round trip as well, which it could not: a floor bounds the
    // fast path from below but leaves the slow path unbounded above, so the matching-email branch
    // stayed measurably slower and still leaked which addresses are registered. Token issuing and
    // delivery moved to SendPasswordResetEmailJob for exactly that reason.
    private static readonly TimeSpan MinimumDuration = TimeSpan.FromMilliseconds(300);

    private readonly IApplicationDbContext _context;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<ForgotPasswordCommandHandler> _logger;

    public ForgotPasswordCommandHandler(
        IApplicationDbContext context,
        IBackgroundJobClient backgroundJobClient,
        ILogger<ForgotPasswordCommandHandler> logger)
    {
        _context = context;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    public async Task Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var stopwatch = Stopwatch.StartNew();

        // Emails are stored normalised (see CredentialNormalizer). Matching the raw input would
        // silently no-op for a differently-cased address — and since this endpoint answers 204
        // either way by design, the user would never learn why no mail arrived.
        var email = CredentialNormalizer.NormalizeEmail(request.Email);

        // Only the id is needed, and selecting it keeps both branches' database work alike.
        var pilotId = await _context.Pilots
            .Where(p => p.Email == email)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (pilotId is null)
        {
            _logger.LogInformation("Password reset requested for unregistered email {Email}", request.Email);
        }
        else
        {
            // CancellationToken.None: once enqueued the job is Hangfire's to run, and the caller
            // disconnecting must not cancel a reset they asked for.
            _backgroundJobClient.Enqueue<SendPasswordResetEmailJob>(
                job => job.ExecuteAsync(pilotId.Value, CancellationToken.None));
        }

        var remaining = MinimumDuration - stopwatch.Elapsed;
        if (remaining > TimeSpan.Zero)
        {
            await Task.Delay(remaining, cancellationToken);
        }
    }
}
