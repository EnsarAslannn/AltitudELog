namespace AltitudELog.Application.Flights.Queries.GetFlights;

// TotalCount is the pagination denominator and so must count exactly what Items pages through —
// cancelled flights included, since they stay in the list with a badge. ActiveCount is the
// dashboard tile figure and excludes them, matching GetStatsQuery's TotalFlights. Keeping the two
// separate is what stops the tiles disagreeing with the stats page without breaking paging.
public record FlightsPageResult(
    List<FlightDto> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int ActiveCount,
    int ThisMonthCount,
    int DistinctAircraftTypeCount);
