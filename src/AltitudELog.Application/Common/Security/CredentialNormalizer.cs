namespace AltitudELog.Application.Common.Security;

/// <summary>
/// Canonical form for the two credentials pilots are looked up by.
///
/// Postgres's default collation is case-sensitive, and both <c>Pilots.Username</c> and
/// <c>Pilots.Email</c> carry unique indexes — so without normalising, "Ensar" and "ensar" are two
/// separate accounts, someone who registers as "Ensar" cannot log in as "ensar", and
/// forgot-password silently does nothing for a differently-cased address (it answers 204 either
/// way by design, so the user gets no clue why no mail arrived).
///
/// Every write and every lookup must go through these — a normalised write with an unnormalised
/// lookup is worse than neither.
/// </summary>
public static class CredentialNormalizer
{
    // Invariant rather than current-culture: under a Turkish culture "I".ToLower() is "ı", so the
    // same username would normalise differently depending on the server's locale.
    public static string NormalizeUsername(string username) => username.Trim().ToLowerInvariant();

    public static string? NormalizeEmail(string? email) =>
        string.IsNullOrWhiteSpace(email) ? email : email.Trim().ToLowerInvariant();
}
