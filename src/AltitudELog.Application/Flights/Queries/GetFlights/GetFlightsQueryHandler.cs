using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Flights.Queries.GetFlights;

public class GetFlightsQueryHandler : IRequestHandler<GetFlightsQuery, FlightsPageResult>
{
    private readonly IApplicationDbContext _context;

    public GetFlightsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<FlightsPageResult> Handle(GetFlightsQuery request, CancellationToken cancellationToken)
    {
        var flights = _context.Flights.AsNoTracking();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var totalCount = await flights.CountAsync(cancellationToken);
        var thisMonthCount = await flights
            .CountAsync(f => f.Date.Year == today.Year && f.Date.Month == today.Month, cancellationToken);
        var distinctAircraftTypeCount = await flights
            .Select(f => f.AircraftType)
            .Distinct()
            .CountAsync(cancellationToken);

        var items = await flights
            .OrderByDescending(f => f.Date)
            .ThenByDescending(f => f.Id)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
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
            .ToListAsync(cancellationToken);

        return new FlightsPageResult(
            items, totalCount, request.PageNumber, request.PageSize, thisMonthCount, distinctAircraftTypeCount);
    }
}
