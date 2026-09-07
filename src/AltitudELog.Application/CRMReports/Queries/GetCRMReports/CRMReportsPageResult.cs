namespace AltitudELog.Application.CRMReports.Queries.GetCRMReports;

/// <summary>
/// Every count here reflects the <em>filtered</em> set, matching <c>FlightsPageResult</c>:
/// <c>TotalCount</c> has to, since it is the pagination denominator, and tiles that ignored the
/// filters would contradict the list sitting beside them.
/// </summary>
public record CRMReportsPageResult(
    List<CRMReportListItemDto> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int OpenCount,
    int UnderReviewCount,
    int CriticalOpenCount);
