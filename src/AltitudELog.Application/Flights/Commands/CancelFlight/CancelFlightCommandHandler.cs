using AltitudELog.Application.Common.Caching;
using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Flights.Commands.CancelFlight;

public class CancelFlightCommandHandler : IRequestHandler<CancelFlightCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<CancelFlightCommandHandler> _logger;

    public CancelFlightCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<CancelFlightCommandHandler> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task Handle(CancelFlightCommand request, CancellationToken cancellationToken)
    {
        var flight = await _context.Flights.FirstOrDefaultAsync(f => f.Id == request.FlightId, cancellationToken)
            ?? throw new NotFoundException($"Flight '{request.FlightId}' does not exist.");

        if (flight.IsCancelled)
        {
            throw new InvalidOperationException($"Flight '{request.FlightId}' is already cancelled.");
        }

        flight.IsCancelled = true;
        flight.CancelledAtUtc = DateTime.UtcNow;
        flight.CancelledByPilotId = _currentUserService.PilotId;

        await _context.SaveChangesAsync(cancellationToken);

        var crewPilotIds = await _context.Crew
            .Where(c => c.FlightId == request.FlightId)
            .Select(c => c.PilotId)
            .ToListAsync(cancellationToken);

        request.CacheKeysToInvalidate =
            [.. request.CacheKeysToInvalidate, .. crewPilotIds.Select(CacheKeys.PilotProfile)];

        _logger.LogInformation(
            "Flight {FlightId} cancelled by pilot {PilotId}", flight.Id, flight.CancelledByPilotId);
    }
}
