using AltitudELog.Application.Auth.Commands.Login;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Auth.Commands.RefreshToken;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(7);

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
                p => p.RefreshTokenHash == tokenHash && p.RefreshTokenExpiresAtUtc > now,
                cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        var (token, expiresAtUtc) = _jwtTokenGenerator.GenerateToken(pilot);

        // Rotate on every use: the presented refresh token is invalidated the moment a new
        // one is issued, so a stolen-and-replayed copy stops working as soon as the
        // legitimate client refreshes.
        var refreshToken = OpaqueTokenGenerator.Generate();
        pilot.RefreshTokenHash = TokenHasher.Hash(refreshToken);
        pilot.RefreshTokenExpiresAtUtc = now.Add(RefreshTokenLifetime);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pilot {PilotId} refreshed their access token", pilot.Id);

        return new AuthResponseDto(token, expiresAtUtc, pilot.Id, pilot.Rank.ToString(), refreshToken);
    }
}
