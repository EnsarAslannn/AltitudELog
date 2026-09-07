namespace AltitudELog.Domain.Enums;

/// <summary>
/// Where a CRM safety report sits in its review. A report that can only be filed is a suggestion
/// box; the status is what turns the feature into a loop that closes.
/// </summary>
public enum CRMReportStatus
{
    Open,
    UnderReview,
    Closed
}
