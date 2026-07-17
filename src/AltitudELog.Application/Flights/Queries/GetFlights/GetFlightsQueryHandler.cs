using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Flights.Queries.GetFlights;

public class GetFlightsQueryHandler : IRequestHandler<GetFlightsQuery, List<FlightDto>>
{
    private readonly IApplicationDbContext _context;

    public GetFlightsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<FlightDto>> Handle(GetFlightsQuery request, CancellationToken cancellationToken)
    {
        return await _context.Flights
            .AsNoTracking()
            .Select(f => new FlightDto
            {
                Id = f.Id,
                OriginICAO = f.OriginICAO,
                DestinationICAO = f.DestinationICAO,
                FlightTime = f.FlightTime,
                AircraftType = f.AircraftType,
                Date = f.Date,
                METARInfo = f.METARInfo
            })
            .ToListAsync(cancellationToken);
    }
}
