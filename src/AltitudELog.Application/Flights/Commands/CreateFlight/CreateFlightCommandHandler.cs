using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Flights.Commands.CreateFlight;

public class CreateFlightCommandHandler : IRequestHandler<CreateFlightCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreateFlightCommandHandler> _logger;

    public CreateFlightCommandHandler(IApplicationDbContext context, ILogger<CreateFlightCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Guid> Handle(CreateFlightCommand request, CancellationToken cancellationToken)
    {
        var flight = new Flight
        {
            Id = Guid.NewGuid(),
            OriginICAO = request.OriginICAO,
            DestinationICAO = request.DestinationICAO,
            FlightTime = request.FlightTime,
            AircraftType = request.AircraftType,
            Date = request.Date,
            METARInfo = request.METARInfo
        };

        _context.Flights.Add(flight);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Flight {FlightId} created: {Origin} -> {Destination}", flight.Id, flight.OriginICAO, flight.DestinationICAO);

        return flight.Id;
    }
}
