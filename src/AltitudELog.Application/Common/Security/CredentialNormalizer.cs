namespace AltitudELog.Application.Common.Security;

/// <summary>
/// Canonical form for the three <c>Pilots</c> columns that carry a unique index.
///
/// Postgres's default collation is case-sensitive, so without normalising, "Ensar" and "ensar" are
/// two separate accounts, someone who registers as "Ensar" cannot log in as "ensar", and
/// forgot-password silently does nothing for a differently-cased address (it answers 204 either
/// way by design, so the user gets no clue why no mail arrived).
///
/// Every write and every lookup must go through these — a normalised write with an unnormalised
/// lookup is worse than neither.
/// </summary>
public static class CredentialNormalizer
{
    public static string NormalizeUsername(string username) => username.Trim().ToLowerInvariant();

    public static string? NormalizeEmail(string? email) =>
        string.IsNullOrWhiteSpace(email) ? email : email.Trim().ToLowerInvariant();

    /// <summary>
    /// Upper-cased rather than lower-cased, unlike the two above: a licence number is never typed
    /// back in as a credential, but it <em>is</em> displayed verbatim on the profile, the pilot
    /// list and the logbook PDF, where "TR-1234" is the conventional rendering and "tr-1234" reads
    /// as a bug. The direction is irrelevant to uniqueness as long as it is applied consistently.
    /// </summary>
    public static string NormalizeLicenseNumber(string licenseNumber) =>
        licenseNumber.Trim().ToUpperInvariant();
}
