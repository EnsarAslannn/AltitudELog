using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Security;
using AltitudELog.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Auth.Commands.ResetPassword;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ResetPasswordCommandHandler> _logger;
    private readonly PasswordHasher<Pilot> _passwordHasher = new();

    public ResetPasswordCommandHandler(IApplicationDbContext context, ILogger<ResetPasswordCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = TokenHasher.Hash(request.Token);
        var now = DateTime.UtcNow;

        var pilot = await _context.Pilots
            .FirstOrDefaultAsync(
                p => p.PasswordResetTokenHash == tokenHash && p.PasswordResetTokenExpiresAtUtc > now,
                cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid or expired password reset token.");

        pilot.PasswordHash = _passwordHasher.HashPassword(pilot, request.NewPassword);
        pilot.PasswordResetTokenHash = null;
        pilot.PasswordResetTokenExpiresAtUtc = null;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pilot {PilotId} reset their password", pilot.Id);
    }
}
