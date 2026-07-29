namespace AltitudELog.Application.Flights.Queries.GetFlights;

/// <summary>
/// Sortable columns for <see cref="GetFlightsQuery"/>. An enum rather than a free-text column
/// name so a caller can't smuggle an arbitrary expression into the ORDER BY, and so an unknown
/// value fails validation with a 400 instead of silently falling back to a default order.
/// </summary>
public enum FlightSortField
{
    Date,
    FlightTime,
    OriginICAO,
    DestinationICAO,
    AircraftType
}
