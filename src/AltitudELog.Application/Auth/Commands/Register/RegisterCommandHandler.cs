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

        var licenseNumberTaken = await _context.Pilots
            .AnyAsync(p => p.LicenseNumber == request.LicenseNumber, cancellationToken);

        if (licenseNumberTaken)
        {
            throw new InvalidOperationException($"License number '{request.LicenseNumber}' is already registered.");
        }

        var pilot = new Pilot
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            LicenseNumber = request.LicenseNumber,
            // Honour the requested rank, guarding against out-of-range enum values.
            Rank = Enum.IsDefined(request.Rank) ? request.Rank : PilotRank.Trainee,
            Username = request.Username
        };

        pilot.PasswordHash = _passwordHasher.HashPassword(pilot, request.Password);

        _context.Pilots.Add(pilot);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            throw new InvalidOperationException("Username or license number is already registered.", ex);
        }

        _logger.LogInformation(
            "Pilot {PilotId} registered with username {Username}", pilot.Id, pilot.Username);

        return pilot.Id;
    }
}
