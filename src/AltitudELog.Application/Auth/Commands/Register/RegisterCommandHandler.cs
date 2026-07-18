using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Auth.Commands.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<RegisterCommandHandler> _logger;
    private readonly PasswordHasher<Pilot> _passwordHasher = new();

    public RegisterCommandHandler(IApplicationDbContext context, ILogger<RegisterCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Guid> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var usernameTaken = await _context.Pilots
            .AnyAsync(p => p.Username == request.Username, cancellationToken);

        if (usernameTaken)
        {
            throw new InvalidOperationException($"Username '{request.Username}' is already taken.");
        }

        var pilot = new Pilot
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            LicenseNumber = request.LicenseNumber,
            Rank = PilotRank.Trainee,
            Username = request.Username
        };

        pilot.PasswordHash = _passwordHasher.HashPassword(pilot, request.Password);

        _context.Pilots.Add(pilot);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Pilot {PilotId} registered with username {Username}", pilot.Id, pilot.Username);

        return pilot.Id;
    }
}
