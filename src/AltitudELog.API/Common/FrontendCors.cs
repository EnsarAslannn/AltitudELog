using Microsoft.Extensions.Configuration;

namespace AltitudELog.API.Common;

public static class FrontendCors
{
    public const string PolicyName = "FrontendCorsPolicy";

    public static IServiceCollection AddFrontendCors(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:5180"];

        services.AddCors(options =>
        {
            options.AddPolicy(PolicyName, policy => policy
                .WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod());
        });

        return services;
    }
}
