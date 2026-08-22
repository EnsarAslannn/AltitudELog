namespace AltitudELog.Application.Common.Exceptions;

/// <summary>
/// The caller is authenticated but is not allowed to touch this particular resource. Distinct from
/// <see cref="UnauthorizedAccessException"/> (mapped to 401, "we don't know who you are"): re-authenticating
/// would not help, so it maps to 403.
/// </summary>
public class ForbiddenAccessException : Exception
{
    public ForbiddenAccessException(string message) : base(message)
    {
    }
}
