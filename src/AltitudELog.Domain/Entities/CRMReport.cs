using AltitudELog.Domain.Common;
using AltitudELog.Domain.Enums;

namespace AltitudELog.Domain.Entities;

public class CRMReport : IModificationAudited
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsAnonymous { get; set; }
    public SeverityLevel SeverityLevel { get; set; }
    public CRMReportStatus Status { get; set; }
    public DateTime CreatedDate { get; set; }

    /// <summary>
    /// Who last moved this report along its review, and when. There is no creation half here —
    /// <see cref="ReporterId"/> and <see cref="CreatedDate"/> already carry it.
    /// </summary>
    public DateTime? UpdatedAtUtc { get; set; }
    public Guid? UpdatedByPilotId { get; set; }

    public Guid FlightId { get; set; }
    public Flight Flight { get; set; } = null!;

    public Guid? ReporterId { get; set; }
    public Pilot? Reporter { get; set; }
}
