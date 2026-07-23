using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Flights.Queries.GetFlights;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Flights.Queries.GetFlightById;

public class GetFlightByIdQueryHandler : IRequestHandler<GetFlightByIdQuery, FlightDto?>
{
    private readonly IApplicationDbContext _context;

    public GetFlightByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<FlightDto?> Handle(GetFlightByIdQuery request, CancellationToken cancellationToken)
    {
        return await _context.Flights
            .AsNoTracking()
            .Where(f => f.Id == request.FlightId)
            .Select(f => new FlightDto
            {
                Id = f.Id,
                OriginICAO = f.OriginICAO,
                DestinationICAO = f.DestinationICAO,
                FlightTime = f.FlightTime,
                AircraftType = f.AircraftType,
                Date = f.Date,
                METARInfo = f.METARInfo,
                IsCancelled = f.IsCancelled
            })
            .FirstOrDefaultAsync(cancellationToken);
    }
}
