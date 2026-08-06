namespace AltitudELog.Application.Flights.Queries.GetFlights;

public record FlightsPageResult(
    List<FlightDto> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int ActiveCount,
    int ThisMonthCount,
    int DistinctAircraftTypeCount);
