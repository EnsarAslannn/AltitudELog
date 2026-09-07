using AltitudELog.Domain.Common;

namespace AltitudELog.Domain.Entities;

public class Flight : IAuditableEntity
{
    public Guid Id { get; set; }
    public string OriginICAO { get; set; } = string.Empty;
    public string DestinationICAO { get; set; } = string.Empty;
    public TimeSpan FlightTime { get; set; }
    public string AircraftType { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public string? METARInfo { get; set; }
    public bool IsCancelled { get; set; }

    /// <summary>
    /// Who cancelled the flight, and when. Kept separately from the <c>UpdatedBy</c> audit pair
    /// even though a cancelled flight admits no further updates: cancellation is the one decision
    /// on this record anyone will later be asked to account for, and reading it out of a generic
    /// "last modified" column means relying on that guard never being relaxed.
    /// </summary>
    public DateTime? CancelledAtUtc { get; set; }
    public Guid? CancelledByPilotId { get; set; }

    public DateTime? CreatedAtUtc { get; set; }
    public Guid? CreatedByPilotId { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public Guid? UpdatedByPilotId { get; set; }

    public ICollection<Crew> CrewAssignments { get; set; } = new List<Crew>();
    public ICollection<CRMReport> CRMReports { get; set; } = new List<CRMReport>();
}
