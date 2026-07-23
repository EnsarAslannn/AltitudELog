using AltitudELog.Domain.Enums;

namespace AltitudELog.Application.Pilots.Queries.GetPilotLogbook;

public class PilotLogbookDto
{
    public Guid PilotId { get; init; }
    public string PilotName { get; init; } = string.Empty;
    public string LicenseNumber { get; init; } = string.Empty;
    public TimeSpan TotalHours { get; init; }
    public List<LogbookFlightDto> Flights { get; init; } = [];
}

public class LogbookFlightDto
{
    public DateOnly Date { get; init; }
    public string OriginICAO { get; init; } = string.Empty;
    public string DestinationICAO { get; init; } = string.Empty;
    public string AircraftType { get; init; } = string.Empty;
    public DutyRole DutyRole { get; init; }
    public TimeSpan FlightTime { get; init; }
}
