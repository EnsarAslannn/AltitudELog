using AltitudELog.Domain.Enums;
using MediatR;

namespace AltitudELog.Application.CRMReports.Queries.GetCRMReports;

/// <summary>
/// The safety-review queue: every report across every flight, filtered and paged. The per-flight
/// query answers "what happened on this flight"; this one answers "what is still open", which is
/// the question nobody could ask before.
/// </summary>
public record GetCRMReportsQuery : IRequest<CRMReportsPageResult>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;

    /// <summary>Free-text match across title and description. Case-insensitive, substring-based.</summary>
    public string? Search { get; init; }

    /// <summary>Null (the default) returns reports in every status.</summary>
    public CRMReportStatus? Status { get; init; }

    /// <summary>Null (the default) returns reports at every severity.</summary>
    public SeverityLevel? SeverityLevel { get; init; }

    /// <summary>Inclusive lower bound on the filing date (UTC).</summary>
    public DateOnly? DateFrom { get; init; }

    /// <summary>Inclusive upper bound on the filing date (UTC).</summary>
    public DateOnly? DateTo { get; init; }

    /// <summary>Narrows the queue to one flight, for a review that starts from a flight record.</summary>
    public Guid? FlightId { get; init; }

    public CRMReportSortField SortBy { get; init; } = CRMReportSortField.CreatedDate;

    public bool SortDescending { get; init; } = true;
}
