using AltitudELog.Domain.Enums;

namespace AltitudELog.Application.Pilots.Queries.GetPilots;

public class PilotDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string LicenseNumber { get; init; } = string.Empty;
    public PilotRank Rank { get; init; }
    public string Username { get; init; } = string.Empty;
}
