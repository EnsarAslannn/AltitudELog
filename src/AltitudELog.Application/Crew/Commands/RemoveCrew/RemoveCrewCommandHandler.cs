using AltitudELog.Application.Common.Caching;
using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Crew.Commands.RemoveCrew;

public class RemoveCrewCommandHandler : IRequestHandler<RemoveCrewCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<RemoveCrewCommandHandler> _logger;

    public RemoveCrewCommandHandler(IApplicationDbContext context, ILogger<RemoveCrewCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Handle(RemoveCrewCommand request, CancellationToken cancellationToken)
    {
        var assignment = await _context.Crew.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException($"Crew assignment '{request.Id}' does not exist.");

        var flightIsCancelled = await _context.Flights
            .AnyAsync(f => f.Id == assignment.FlightId && f.IsCancelled, cancellationToken);

        if (flightIsCancelled)
        {
            throw new InvalidOperationException(
                $"Flight '{assignment.FlightId}' is cancelled and its crew cannot be changed.");
        }

        var flightId = assignment.FlightId;
        var pilotId = assignment.PilotId;

        _context.Crew.Remove(assignment);
        await _context.SaveChangesAsync(cancellationToken);

        request.CacheKeysToInvalidate = [CacheKeys.CrewByFlight(flightId), CacheKeys.PilotProfile(pilotId)];

        _logger.LogInformation("Pilot {PilotId} removed from flight {FlightId}", pilotId, flightId);
    }
}
