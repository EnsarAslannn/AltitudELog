using System.Security.Cryptography;
using System.Text;

namespace AltitudELog.Application.Common.Security;

// Hashes high-entropy random tokens (e.g. password-reset tokens) before storage.
// A fast hash is correct here — unlike a user-chosen password, the token is
// already cryptographically random, so it doesn't need PasswordHasher's slow KDF.
public static class TokenHasher
{
    public static string Hash(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hash);
    }
}
