using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Crew.Commands.CreateCrew;

public class CreateCrewCommandHandler : IRequestHandler<CreateCrewCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreateCrewCommandHandler> _logger;

    public CreateCrewCommandHandler(IApplicationDbContext context, ILogger<CreateCrewCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Guid> Handle(CreateCrewCommand request, CancellationToken cancellationToken)
    {
        var flightExists = await _context.Flights
            .AnyAsync(f => f.Id == request.FlightId, cancellationToken);

        if (!flightExists)
        {
            throw new NotFoundException($"Flight '{request.FlightId}' does not exist.");
        }

        var pilotExists = await _context.Pilots
            .AnyAsync(p => p.Id == request.PilotId, cancellationToken);

        if (!pilotExists)
        {
            throw new NotFoundException($"Pilot '{request.PilotId}' does not exist.");
        }

        var alreadyAssigned = await _context.Crew
            .AnyAsync(c => c.FlightId == request.FlightId && c.PilotId == request.PilotId, cancellationToken);

        if (alreadyAssigned)
        {
            throw new InvalidOperationException("This pilot is already assigned to this flight.");
        }

        var crew = new AltitudELog.Domain.Entities.Crew
        {
            Id = Guid.NewGuid(),
            FlightId = request.FlightId,
            PilotId = request.PilotId,
            DutyRole = request.DutyRole
        };

        _context.Crew.Add(crew);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            throw new InvalidOperationException("This pilot is already assigned to this flight.", ex);
        }

        _logger.LogInformation(
            "Pilot {PilotId} assigned to flight {FlightId} as {DutyRole}", crew.PilotId, crew.FlightId, crew.DutyRole);

        return crew.Id;
    }
}
