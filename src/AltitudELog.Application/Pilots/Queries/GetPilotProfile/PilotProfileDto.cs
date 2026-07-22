using AltitudELog.Domain.Enums;

namespace AltitudELog.Application.Pilots.Queries.GetPilotProfile;

public class PilotProfileDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string LicenseNumber { get; init; } = string.Empty;
    public PilotRank Rank { get; init; }
    public string Username { get; init; } = string.Empty;
    public int TotalFlights { get; init; }
    public TimeSpan TotalFlightHours { get; init; }
    public List<AircraftHoursDto> HoursByAircraftType { get; init; } = [];
    public List<PilotFlightDto> RecentFlights { get; init; } = [];
}

public class AircraftHoursDto
{
    public string AircraftType { get; init; } = string.Empty;
    public int FlightCount { get; init; }
    public TimeSpan TotalHours { get; init; }
}

public class PilotFlightDto
{
    public Guid FlightId { get; init; }
    public string OriginICAO { get; init; } = string.Empty;
    public string DestinationICAO { get; init; } = string.Empty;
    public DateOnly Date { get; init; }
    public TimeSpan FlightTime { get; init; }
    public string AircraftType { get; init; } = string.Empty;
    public DutyRole DutyRole { get; init; }
}
