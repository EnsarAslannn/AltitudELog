using AltitudELog.Domain.Enums;

namespace AltitudELog.Application.Stats.Queries.GetStats;

public class StatsDto
{
    public int TotalFlights { get; init; }
    public int FlightsThisMonth { get; init; }
    public int TotalPilots { get; init; }
    public Dictionary<PilotRank, int> PilotsByRank { get; init; } = [];
    public int TotalCrmReports { get; init; }
    public Dictionary<SeverityLevel, int> CrmReportsBySeverity { get; init; } = [];
    public List<ExpiringCertificationDto> ExpiringCertifications { get; init; } = [];
    public List<MonthlyCrmTrendDto> CrmTrendByMonth { get; init; } = [];
}

public class ExpiringCertificationDto
{
    public Guid PilotId { get; init; }
    public string PilotName { get; init; } = string.Empty;
    public DateOnly? LicenseExpiryDate { get; init; }
    public DateOnly? MedicalExpiryDate { get; init; }
}

public class MonthlyCrmTrendDto
{
    public int Year { get; init; }
    public int Month { get; init; }
    public Dictionary<SeverityLevel, int> CountsBySeverity { get; init; } = [];
}
