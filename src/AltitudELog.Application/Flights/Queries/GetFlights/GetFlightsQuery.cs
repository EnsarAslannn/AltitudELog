using MediatR;

namespace AltitudELog.Application.Flights.Queries.GetFlights;

public record GetFlightsQuery : IRequest<FlightsPageResult>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;

    /// <summary>
    /// Free-text match across origin, destination and aircraft type. Case-insensitive and
    /// substring-based, so "ltf" finds LTFM and LTFJ, and "a3" finds A320 and A350.
    /// </summary>
    public string? Search { get; init; }

    /// <summary>Inclusive lower bound on <c>Flight.Date</c>.</summary>
    public DateOnly? DateFrom { get; init; }

    /// <summary>Inclusive upper bound on <c>Flight.Date</c>.</summary>
    public DateOnly? DateTo { get; init; }

    /// <summary>Exact ICAO match on the departure airport.</summary>
    public string? OriginICAO { get; init; }

    /// <summary>Exact ICAO match on the arrival airport.</summary>
    public string? DestinationICAO { get; init; }

    /// <summary>Exact match on <c>Flight.AircraftType</c>.</summary>
    public string? AircraftType { get; init; }

    /// <summary>
    /// Null (the default) returns active and cancelled flights alike, which is the behaviour
    /// callers had before filtering existed.
    /// </summary>
    public bool? IsCancelled { get; init; }

    public FlightSortField SortBy { get; init; } = FlightSortField.Date;

    public bool SortDescending { get; init; } = true;
}
