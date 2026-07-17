using AltitudELog.Domain.Enums;

namespace AltitudELog.Domain.Entities;

public class Crew
{
    public Guid Id { get; set; }

    public Guid FlightId { get; set; }
    public Flight Flight { get; set; } = null!;

    public Guid PilotId { get; set; }
    public Pilot Pilot { get; set; } = null!;

    public DutyRole DutyRole { get; set; }
}
