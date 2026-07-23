using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Flights.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Flights.Commands.UpdateFlight;

public class UpdateFlightCommandHandler : IRequestHandler<UpdateFlightCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IPublisher _publisher;
    private readonly ILogger<UpdateFlightCommandHandler> _logger;

    public UpdateFlightCommandHandler(
        IApplicationDbContext context, IPublisher publisher, ILogger<UpdateFlightCommandHandler> logger)
    {
        _context = context;
        _publisher = publisher;
        _logger = logger;
    }

    public async Task Handle(UpdateFlightCommand request, CancellationToken cancellationToken)
    {
        var flight = await _context.Flights.FirstOrDefaultAsync(f => f.Id == request.FlightId, cancellationToken)
            ?? throw new InvalidOperationException($"Flight '{request.FlightId}' does not exist.");

        var originChanged = !string.Equals(flight.OriginICAO, request.OriginICAO, StringComparison.OrdinalIgnoreCase);

        flight.OriginICAO = request.OriginICAO;
        flight.DestinationICAO = request.DestinationICAO;
        flight.FlightTime = request.FlightTime;
        flight.AircraftType = request.AircraftType;
        flight.Date = request.Date;

        if (originChanged)
        {
            flight.METARInfo = null;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Flight {FlightId} updated", flight.Id);

        if (originChanged)
        {
            await _publisher.Publish(new FlightUpdatedEvent(flight.Id, flight.OriginICAO), cancellationToken);
        }
    }
}
