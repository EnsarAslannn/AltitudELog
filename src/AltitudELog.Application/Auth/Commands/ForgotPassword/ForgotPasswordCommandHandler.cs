using System.Security.Cryptography;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Auth.Commands.ForgotPassword;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand>
{
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(1);

    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<ForgotPasswordCommandHandler> _logger;

    public ForgotPasswordCommandHandler(
        IApplicationDbContext context, IEmailService emailService, ILogger<ForgotPasswordCommandHandler> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var pilot = await _context.Pilots
            .FirstOrDefaultAsync(p => p.Email == request.Email, cancellationToken);

        // Always generate + hash a token, whether or not the email matches a pilot, so the
        // CPU-bound cost of this path doesn't itself leak which emails are registered via
        // response timing (the response shape/return value already doesn't leak it).
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToBase64String(tokenBytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
        var tokenHash = TokenHasher.Hash(token);

        if (pilot is null)
        {
            _logger.LogInformation("Password reset requested for unregistered email {Email}", request.Email);
            return;
        }

        pilot.PasswordResetTokenHash = tokenHash;
        pilot.PasswordResetTokenExpiresAtUtc = DateTime.UtcNow.Add(TokenLifetime);
        await _context.SaveChangesAsync(cancellationToken);

        try
        {
            await _emailService.SendPasswordResetEmailAsync(pilot.Email!, token, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send password reset email to {Email}; token was still generated.", pilot.Email);
        }
    }
}
