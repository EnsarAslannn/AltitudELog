using AltitudELog.Domain.Entities;

namespace AltitudELog.Application.Common.Security;

/// <summary>
/// One place for the refresh-token session rules, so Login, RefreshToken, Logout and
/// ResetPassword can't drift apart on which fields make up a session.
/// </summary>
public static class RefreshTokenPolicy
{
    /// <summary>Sliding window: how long a single issued token stays usable.</summary>
    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(7);

    /// <summary>
    /// Hard ceiling on a session regardless of how often it is refreshed. Rotation alone only
    /// bounds a stolen token to the next legitimate refresh; without this ceiling an attacker who
    /// keeps refreshing never has to log in again.
    /// </summary>
    public static readonly TimeSpan AbsoluteLifetime = TimeSpan.FromDays(30);

    /// <summary>Starts a fresh session. Only Login should call this.</summary>
    public static string StartSession(Pilot pilot, DateTime nowUtc)
    {
        var refreshToken = OpaqueTokenGenerator.Generate();

        pilot.RefreshTokenHash = TokenHasher.Hash(refreshToken);
        pilot.RefreshTokenExpiresAtUtc = nowUtc.Add(Lifetime);
        pilot.RefreshTokenSessionStartedAtUtc = nowUtc;
        pilot.PreviousRefreshTokenHash = null;

        return refreshToken;
    }

    /// <summary>
    /// Issues the next token in an existing session, keeping the outgoing hash so a replay of it
    /// can be recognised. The session start deliberately carries over unchanged.
    ///
    /// These three fields must move together as one atomic step, which is why <c>Pilot</c> carries
    /// an <c>xmin</c> concurrency token: two concurrent refreshes with the same valid token would
    /// otherwise both pass the reuse check and both rotate, and the second write would leave
    /// <see cref="Pilot.PreviousRefreshTokenHash"/> pointing at a token that is still live — so the
    /// next legitimate refresh looks like a replay and revokes a healthy session. With the token in
    /// place the loser's save throws instead, and the caller is answered 401.
    /// </summary>
    public static string Rotate(Pilot pilot, DateTime nowUtc)
    {
        var refreshToken = OpaqueTokenGenerator.Generate();

        pilot.PreviousRefreshTokenHash = pilot.RefreshTokenHash;
        pilot.RefreshTokenHash = TokenHasher.Hash(refreshToken);
        pilot.RefreshTokenExpiresAtUtc = nowUtc.Add(Lifetime);

        return refreshToken;
    }

    /// <summary>Ends the session outright — logout, password reset, or detected token reuse.</summary>
    public static void RevokeSession(Pilot pilot)
    {
        pilot.RefreshTokenHash = null;
        pilot.RefreshTokenExpiresAtUtc = null;
        pilot.PreviousRefreshTokenHash = null;
        pilot.RefreshTokenSessionStartedAtUtc = null;
    }

    /// <summary>True once the session has outlived <see cref="AbsoluteLifetime"/>.</summary>
    public static bool HasExceededAbsoluteLifetime(Pilot pilot, DateTime nowUtc) =>
        pilot.RefreshTokenSessionStartedAtUtc is { } startedAt
        && nowUtc - startedAt > AbsoluteLifetime;
}
