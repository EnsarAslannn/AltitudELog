using AltitudELog.Domain.Enums;

namespace AltitudELog.Application.Crew.Queries.GetCrewByFlight;

public class CrewDto
{
    public Guid Id { get; init; }
    public Guid FlightId { get; init; }
    public Guid PilotId { get; init; }
    public string PilotName { get; init; } = string.Empty;
    public DutyRole DutyRole { get; init; }
}
