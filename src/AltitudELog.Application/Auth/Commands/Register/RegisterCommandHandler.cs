using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Auth.Commands.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly PasswordHasher<Pilot> _passwordHasher = new();

    public RegisterCommandHandler(IApplicationDbContext context)
    {
        _context = context;
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
            Rank = request.Rank,
            Username = request.Username
        };

        pilot.PasswordHash = _passwordHasher.HashPassword(pilot, request.Password);

        _context.Pilots.Add(pilot);
        await _context.SaveChangesAsync(cancellationToken);

        return pilot.Id;
    }
}
