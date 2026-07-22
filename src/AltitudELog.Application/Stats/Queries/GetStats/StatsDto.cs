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
}
