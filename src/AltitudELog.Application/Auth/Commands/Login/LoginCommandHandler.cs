using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly PasswordHasher<Pilot> _passwordHasher = new();

    public LoginCommandHandler(IApplicationDbContext context, IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var pilot = await _context.Pilots
            .FirstOrDefaultAsync(p => p.Username == request.Username, cancellationToken);

        if (pilot is null)
        {
            throw new UnauthorizedAccessException("Invalid username or password.");
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(pilot, pilot.PasswordHash, request.Password);

        if (verificationResult == PasswordVerificationResult.Failed)
        {
            throw new UnauthorizedAccessException("Invalid username or password.");
        }

        var (token, expiresAtUtc) = _jwtTokenGenerator.GenerateToken(pilot);

        return new AuthResponseDto(token, expiresAtUtc, pilot.Id, pilot.Rank.ToString());
    }
}
