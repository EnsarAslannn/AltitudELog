using AltitudELog.Domain.Enums;

namespace AltitudELog.Domain.Entities;

public class Pilot
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public PilotRank Rank { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateOnly? LicenseExpiryDate { get; set; }
    public DateOnly? MedicalExpiryDate { get; set; }

    public ICollection<Crew> CrewAssignments { get; set; } = new List<Crew>();
}
