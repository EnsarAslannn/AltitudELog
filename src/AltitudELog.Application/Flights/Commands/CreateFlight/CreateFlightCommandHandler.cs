using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Entities;
using MediatR;

namespace AltitudELog.Application.Flights.Commands.CreateFlight;

public class CreateFlightCommandHandler : IRequestHandler<CreateFlightCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateFlightCommandHandler(IApplicationDbContext context)
    {
        _context = context;
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

        return flight.Id;
    }
}
