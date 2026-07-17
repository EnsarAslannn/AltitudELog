using AltitudELog.Domain.Enums;

namespace AltitudELog.Domain.Entities;

public class CRMReport
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsAnonymous { get; set; }
    public SeverityLevel SeverityLevel { get; set; }
    public DateTime CreatedDate { get; set; }

    public Guid FlightId { get; set; }
    public Flight Flight { get; set; } = null!;

    public Guid? ReporterId { get; set; }
    public Pilot? Reporter { get; set; }
}
