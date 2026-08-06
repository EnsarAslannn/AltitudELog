using System.Security.Cryptography;
using System.Text;

namespace AltitudELog.Application.Common.Security;

public static class TokenHasher
{
    public static string Hash(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hash);
    }
}
