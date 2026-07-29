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
        var firstOfMonth = new DateOnly(today.Year, today.Month, 1);
        var firstOfNextMonth = firstOfMonth.AddMonths(1);

        // Counts every row Items pages through — cancelled flights stay in the list (shown with a
        // badge via FlightDto.IsCancelled), so excluding them here would make the page count
        // disagree with the rows actually returned.
        var totalCount = await flights.CountAsync(cancellationToken);

        // The dashboard tiles exclude cancelled flights, matching GetStatsQuery,
        // GetPilotProfileQuery and GetPilotLogbookQuery — otherwise they disagree with the stats
        // page as soon as anything is cancelled.
        var activeCount = await flights.CountAsync(f => !f.IsCancelled, cancellationToken);

        // Half-open range rather than Year/Month equality: the latter translates to date_part()
        // on the column, which no index can serve.
        var thisMonthCount = await flights
            .CountAsync(
                f => !f.IsCancelled && f.Date >= firstOfMonth && f.Date < firstOfNextMonth,
                cancellationToken);

        var distinctAircraftTypeCount = await flights
            .Where(f => !f.IsCancelled)
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
            items,
            totalCount,
            request.PageNumber,
            request.PageSize,
            activeCount,
            thisMonthCount,
            distinctAircraftTypeCount);
    }
}
