using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Infrastructure.ExternalServices.Metar;
using AltitudELog.Infrastructure.Identity;
using AltitudELog.Infrastructure.Persistence;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace AltitudELog.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        // Parse the full StackExchange.Redis connection string so managed Redis
        // (e.g. Railway) with a password works — `host:port,password=…`. Fail-fast
        // timeouts are layered on top; the caching pipeline stays fail-open.
        var redisOptions = ConfigurationOptions.Parse(configuration.GetConnectionString("Redis")!);
        redisOptions.ConnectTimeout = 200;
        redisOptions.SyncTimeout = 200;
        redisOptions.AsyncTimeout = 200;
        redisOptions.ConnectRetry = 0;
        redisOptions.AbortOnConnectFail = true;

        services.AddStackExchangeRedisCache(options =>
        {
            options.ConfigurationOptions = redisOptions;
        });

        services.AddHealthChecks()
            .AddNpgSql(configuration.GetConnectionString("DefaultConnection")!, name: "postgresql")
            .AddRedis(configuration.GetConnectionString("Redis")!, name: "redis");

        services.AddHttpClient<IMetarService, NoaaMetarService>(client =>
        {
            client.BaseAddress = new Uri("https://aviationweather.gov/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(opt => opt.UseNpgsqlConnection(
                configuration.GetConnectionString("DefaultConnection"))));

        services.AddHangfireServer();

        return services;
    }
}
