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

        var email = CredentialNormalizer.NormalizeEmail(request.Email);

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
