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
    public string? Email { get; set; }
    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetTokenExpiresAtUtc { get; set; }
    public string? RefreshTokenHash { get; set; }
    public DateTime? RefreshTokenExpiresAtUtc { get; set; }

    /// <summary>
    /// The token this session's current one replaced. Kept solely so a replayed token can be
    /// recognised: rotation means an old token matches no pilot at all, so without this there is
    /// no way to tell a stolen-and-replayed token from a random string, and no way to know whose
    /// session to revoke.
    /// </summary>
    public string? PreviousRefreshTokenHash { get; set; }

    /// <summary>
    /// When the session began — set at login and carried across rotations, never bumped by a
    /// refresh. Without it, refreshing once a week keeps a session (and a stolen token) alive
    /// forever, because each rotation pushes the sliding expiry out again.
    /// </summary>
    public DateTime? RefreshTokenSessionStartedAtUtc { get; set; }
    public DateOnly? LicenseExpiryDate { get; set; }
    public DateOnly? MedicalExpiryDate { get; set; }

    public ICollection<Crew> CrewAssignments { get; set; } = new List<Crew>();
}
