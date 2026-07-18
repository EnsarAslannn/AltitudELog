using System.Security.Cryptography;
using System.Text;
using Hangfire.Dashboard;

namespace AltitudELog.API.Common;

public class HangfireBasicAuthFilter : IDashboardAuthorizationFilter
{
    private readonly IConfiguration _configuration;

    public HangfireBasicAuthFilter(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        var authHeader = httpContext.Request.Headers.Authorization.FirstOrDefault();

        if (authHeader is null || !authHeader.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
        {
            Challenge(httpContext);
            return false;
        }

        string username;
        string password;
        try
        {
            var encoded = authHeader["Basic ".Length..];
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
            var separatorIndex = decoded.IndexOf(':');
            if (separatorIndex < 0)
            {
                Challenge(httpContext);
                return false;
            }

            username = decoded[..separatorIndex];
            password = decoded[(separatorIndex + 1)..];
        }
        catch (FormatException)
        {
            Challenge(httpContext);
            return false;
        }

        var expectedUsername = _configuration["Hangfire:DashboardUsername"];
        var expectedPassword = _configuration["Hangfire:DashboardPassword"];

        if (string.IsNullOrEmpty(expectedUsername) || string.IsNullOrEmpty(expectedPassword))
        {
            Challenge(httpContext);
            return false;
        }

        var usernameMatches = FixedTimeEquals(username, expectedUsername);
        var passwordMatches = FixedTimeEquals(password, expectedPassword);

        if (usernameMatches && passwordMatches)
        {
            return true;
        }

        Challenge(httpContext);
        return false;
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        var leftBytes = Encoding.UTF8.GetBytes(left);
        var rightBytes = Encoding.UTF8.GetBytes(right);
        return CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }

    private static void Challenge(HttpContext httpContext)
    {
        httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
        httpContext.Response.Headers.WWWAuthenticate = "Basic realm=\"Hangfire Dashboard\"";
    }
}
