using AltitudELog.Infrastructure.Persistence;
using Hangfire;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using NSubstitute;
using Npgsql;
using Respawn;
using Testcontainers.PostgreSql;
using Testcontainers.Redis;

namespace AltitudELog.IntegrationTests.Infrastructure;

public class IntegrationTestWebAppFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgresContainer = new PostgreSqlBuilder("postgres:17")
        .Build();

    private readonly RedisContainer _redisContainer = new RedisBuilder("redis:alpine")
        .Build();

    private NpgsqlConnection _respawnConnection = null!;
    private Respawner _respawner = null!;

    public IBackgroundJobClient BackgroundJobClient { get; } = Substitute.For<IBackgroundJobClient>();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = _postgresContainer.GetConnectionString(),
                ["ConnectionStrings:Redis"] = _redisContainer.GetConnectionString(),
                ["Jwt:Key"] = "IntegrationTestSigningKeyAtLeast32CharsLong!",
                ["Jwt:Issuer"] = "AltitudELog.Tests",
                ["Jwt:Audience"] = "AltitudELog.Tests.Clients",
                ["Jwt:ExpiryMinutes"] = "60",
                ["Hangfire:DashboardUsername"] = "test-admin",
                ["Hangfire:DashboardPassword"] = "test-password"
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.Replace(ServiceDescriptor.Singleton(BackgroundJobClient));
        });
    }

    async Task IAsyncLifetime.InitializeAsync()
    {
        await _postgresContainer.StartAsync();
        await _redisContainer.StartAsync();

        using (var scope = Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await context.Database.MigrateAsync();
        }

        _respawnConnection = new NpgsqlConnection(_postgresContainer.GetConnectionString());
        await _respawnConnection.OpenAsync();

        _respawner = await Respawner.CreateAsync(_respawnConnection, new RespawnerOptions
        {
            SchemasToInclude = ["public"],
            TablesToIgnore = ["__EFMigrationsHistory"],
            DbAdapter = DbAdapter.Postgres
        });
    }

    public Task ResetDatabaseAsync() => _respawner.ResetAsync(_respawnConnection);

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _respawnConnection.DisposeAsync();
        await _postgresContainer.DisposeAsync();
        await _redisContainer.DisposeAsync();
        await base.DisposeAsync();
    }
}
