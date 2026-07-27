using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Security;
using AltitudELog.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    // Matches ForgotPasswordCommandHandler's hardcoded-lifetime convention rather than
    // reading from config. A stolen refresh token's exposure window is bounded by this.
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(7);

    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ILogger<LoginCommandHandler> _logger;
    private readonly PasswordHasher<Pilot> _passwordHasher = new();

    // Verifying against this dummy hash when no pilot matches keeps Handle's cost roughly
    // constant whether or not the username exists, so response timing doesn't reveal it.
    private static readonly string DummyPasswordHash = new PasswordHasher<Pilot>()
        .HashPassword(new Pilot(), Guid.NewGuid().ToString());

    public LoginCommandHandler(
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator,
        ILogger<LoginCommandHandler> logger)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
        _logger = logger;
    }

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var pilot = await _context.Pilots
            .FirstOrDefaultAsync(p => p.Username == request.Username, cancellationToken);

        if (pilot is null)
        {
            // Still run a hash verification against a dummy hash so this path costs roughly
            // the same as the "pilot exists, password wrong" path below — otherwise the early
            // return here would make username enumeration observable via response timing.
            _passwordHasher.VerifyHashedPassword(new Pilot(), DummyPasswordHash, request.Password);
            _logger.LogWarning("Login failed for username {Username}: no such pilot", request.Username);
            throw new UnauthorizedAccessException("Invalid username or password.");
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(pilot, pilot.PasswordHash, request.Password);

        if (verificationResult == PasswordVerificationResult.Failed)
        {
            _logger.LogWarning("Login failed for username {Username}: bad password", request.Username);
            throw new UnauthorizedAccessException("Invalid username or password.");
        }

        var (token, expiresAtUtc) = _jwtTokenGenerator.GenerateToken(pilot);

        var refreshToken = OpaqueTokenGenerator.Generate();
        pilot.RefreshTokenHash = TokenHasher.Hash(refreshToken);
        pilot.RefreshTokenExpiresAtUtc = DateTime.UtcNow.Add(RefreshTokenLifetime);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pilot {PilotId} ({Username}) logged in", pilot.Id, pilot.Username);

        return new AuthResponseDto(token, expiresAtUtc, pilot.Id, pilot.Rank.ToString(), refreshToken);
    }
}
