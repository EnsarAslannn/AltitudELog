namespace AltitudELog.Domain.Entities;

public class Flight
{
    public Guid Id { get; set; }
    public string OriginICAO { get; set; } = string.Empty;
    public string DestinationICAO { get; set; } = string.Empty;
    public TimeSpan FlightTime { get; set; }
    public string AircraftType { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public string? METARInfo { get; set; }

    public ICollection<Crew> CrewAssignments { get; set; } = new List<Crew>();
    public ICollection<CRMReport> CRMReports { get; set; } = new List<CRMReport>();
}
