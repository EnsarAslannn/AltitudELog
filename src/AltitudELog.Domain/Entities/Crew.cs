using AltitudELog.Domain.Common;
using AltitudELog.Domain.Enums;

namespace AltitudELog.Domain.Entities;

public class Crew : IAuditableEntity
{
    public Guid Id { get; set; }

    public Guid FlightId { get; set; }
    public Flight Flight { get; set; } = null!;

    public Guid PilotId { get; set; }
    public Pilot Pilot { get; set; } = null!;

    public DutyRole DutyRole { get; set; }

    public DateTime? CreatedAtUtc { get; set; }
    public Guid? CreatedByPilotId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public Guid? UpdatedByPilotId { get; set; }
}
