using System.Security.Cryptography;

namespace AltitudELog.Application.Common.Security;

public static class OpaqueTokenGenerator
{
    public static string Generate()
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(tokenBytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }
}
