using System.Security.Cryptography;

namespace AltitudELog.Application.Common.Security;

// Generates high-entropy, URL-safe opaque tokens (e.g. refresh tokens) for handing to a
// client. Only TokenHasher's hash of the returned value is ever persisted.
public static class OpaqueTokenGenerator
{
    public static string Generate()
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(tokenBytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }
}
