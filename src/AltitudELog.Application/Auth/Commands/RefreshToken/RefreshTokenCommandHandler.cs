using AltitudELog.Application.Auth.Commands.Login;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Auth.Commands.RefreshToken;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ILogger<RefreshTokenCommandHandler> _logger;

    public RefreshTokenCommandHandler(
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator,
        ILogger<RefreshTokenCommandHandler> logger)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
        _logger = logger;
    }

    public async Task<AuthResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = TokenHasher.Hash(request.RefreshToken);
        var now = DateTime.UtcNow;

        var pilot = await _context.Pilots
            .FirstOrDefaultAsync(
                p => p.RefreshTokenHash == tokenHash || p.PreviousRefreshTokenHash == tokenHash,
                cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        if (pilot.PreviousRefreshTokenHash == tokenHash)
        {
            _logger.LogWarning(
                "Refresh token reuse detected for pilot {PilotId}; revoking the session", pilot.Id);

            RefreshTokenPolicy.RevokeSession(pilot);
            await _context.SaveChangesAsync(cancellationToken);

            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        if (pilot.RefreshTokenExpiresAtUtc is null || pilot.RefreshTokenExpiresAtUtc <= now)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        if (RefreshTokenPolicy.HasExceededAbsoluteLifetime(pilot, now))
        {
            _logger.LogInformation(
                "Session for pilot {PilotId} exceeded its absolute lifetime; re-authentication required",
                pilot.Id);

            RefreshTokenPolicy.RevokeSession(pilot);
            await _context.SaveChangesAsync(cancellationToken);

            throw new UnauthorizedAccessException("Session expired. Please sign in again.");
        }

        var (token, expiresAtUtc) = _jwtTokenGenerator.GenerateToken(pilot);
        var refreshToken = RefreshTokenPolicy.Rotate(pilot, now);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            _logger.LogWarning(
                "Concurrent refresh detected for pilot {PilotId}; this caller lost the race", pilot.Id);

            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        _logger.LogInformation("Pilot {PilotId} refreshed their access token", pilot.Id);

        return new AuthResponseDto(token, expiresAtUtc, pilot.Id, pilot.Rank.ToString(), refreshToken);
    }
}
