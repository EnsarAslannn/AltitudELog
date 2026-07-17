namespace AltitudELog.Application.Flights.Queries.GetFlights;

public class FlightDto
{
    public Guid Id { get; init; }
    public string OriginICAO { get; init; } = string.Empty;
    public string DestinationICAO { get; init; } = string.Empty;
    public TimeSpan FlightTime { get; init; }
    public string AircraftType { get; init; } = string.Empty;
    public DateOnly Date { get; init; }
    public string? METARInfo { get; init; }
}
