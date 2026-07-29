using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Entities;
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
        // Every figure below is derived from the *filtered* set, not the whole table. With a
        // filter bar on screen, global tiles next to a filtered list would just be confusing —
        // and TotalCount has to match the filtered rows or pagination breaks. With no filters
        // applied this is identical to the pre-filter behaviour.
        var flights = ApplyFilters(_context.Flights.AsNoTracking(), request);

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

        var items = await ApplySort(flights, request)
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

    private static IQueryable<Flight> ApplyFilters(IQueryable<Flight> flights, GetFlightsQuery request)
    {
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            // ToLower().Contains rather than EF.Functions.ILike: ILike lives in the Npgsql
            // package, and Application deliberately takes no provider dependency. This
            // translates to lower(col) LIKE '%term%' on Postgres and works under the InMemory
            // provider the unit tests use.
            var term = request.Search.Trim().ToLowerInvariant();

            flights = flights.Where(f =>
                f.OriginICAO.ToLower().Contains(term)
                || f.DestinationICAO.ToLower().Contains(term)
                || f.AircraftType.ToLower().Contains(term));
        }

        if (request.DateFrom is { } dateFrom)
        {
            flights = flights.Where(f => f.Date >= dateFrom);
        }

        if (request.DateTo is { } dateTo)
        {
            flights = flights.Where(f => f.Date <= dateTo);
        }

        if (!string.IsNullOrWhiteSpace(request.OriginICAO))
        {
            var origin = request.OriginICAO.Trim().ToUpperInvariant();
            flights = flights.Where(f => f.OriginICAO == origin);
        }

        if (!string.IsNullOrWhiteSpace(request.DestinationICAO))
        {
            var destination = request.DestinationICAO.Trim().ToUpperInvariant();
            flights = flights.Where(f => f.DestinationICAO == destination);
        }

        if (!string.IsNullOrWhiteSpace(request.AircraftType))
        {
            var aircraftType = request.AircraftType.Trim();
            flights = flights.Where(f => f.AircraftType == aircraftType);
        }

        if (request.IsCancelled is { } isCancelled)
        {
            flights = flights.Where(f => f.IsCancelled == isCancelled);
        }

        return flights;
    }

    // Id is always the final tiebreaker: without it, rows sharing a sort value can be returned in
    // a different order per page, so the same flight shows up twice or not at all while paging.
    private static IOrderedQueryable<Flight> ApplySort(IQueryable<Flight> flights, GetFlightsQuery request)
    {
        var descending = request.SortDescending;

        return request.SortBy switch
        {
            FlightSortField.FlightTime => descending
                ? flights.OrderByDescending(f => f.FlightTime).ThenByDescending(f => f.Id)
                : flights.OrderBy(f => f.FlightTime).ThenBy(f => f.Id),
            FlightSortField.OriginICAO => descending
                ? flights.OrderByDescending(f => f.OriginICAO).ThenByDescending(f => f.Id)
                : flights.OrderBy(f => f.OriginICAO).ThenBy(f => f.Id),
            FlightSortField.DestinationICAO => descending
                ? flights.OrderByDescending(f => f.DestinationICAO).ThenByDescending(f => f.Id)
                : flights.OrderBy(f => f.DestinationICAO).ThenBy(f => f.Id),
            FlightSortField.AircraftType => descending
                ? flights.OrderByDescending(f => f.AircraftType).ThenByDescending(f => f.Id)
                : flights.OrderBy(f => f.AircraftType).ThenBy(f => f.Id),
            _ => descending
                ? flights.OrderByDescending(f => f.Date).ThenByDescending(f => f.Id)
                : flights.OrderBy(f => f.Date).ThenBy(f => f.Id)
        };
    }
}
