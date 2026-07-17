using AltitudELog.Domain.Enums;

namespace AltitudELog.Application.CRMReports.Queries.GetCRMReportsByFlight;

public class CRMReportDto
{
    public Guid Id { get; init; }
    public Guid FlightId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public bool IsAnonymous { get; init; }
    public SeverityLevel SeverityLevel { get; init; }
    public DateTime CreatedDate { get; init; }
    public Guid? ReporterId { get; init; }
    public string? ReporterName { get; init; }
}
