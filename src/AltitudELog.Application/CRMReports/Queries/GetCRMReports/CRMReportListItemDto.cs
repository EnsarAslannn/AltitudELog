using AltitudELog.Domain.Enums;

namespace AltitudELog.Application.CRMReports.Queries.GetCRMReports;

/// <summary>
/// A queue row. Carries the flight's route and date inline so the list reads without a lookup per
/// row — the reviewer needs to know which flight a report belongs to before opening it.
/// </summary>
public class CRMReportListItemDto
{
    public Guid Id { get; init; }
    public Guid FlightId { get; init; }
    public string OriginICAO { get; init; } = string.Empty;
    public string DestinationICAO { get; init; } = string.Empty;
    public DateOnly FlightDate { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public bool IsAnonymous { get; init; }
    public SeverityLevel SeverityLevel { get; init; }
    public CRMReportStatus Status { get; init; }
    public DateTime CreatedDate { get; init; }
    public DateTime? UpdatedAtUtc { get; init; }
    public Guid? ReporterId { get; init; }
    public string? ReporterName { get; init; }
}
