using AltitudELog.Application.Common.Security;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AltitudELog.Infrastructure.Persistence;
using AltitudELog.IntegrationTests.Infrastructure;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AltitudELog.IntegrationTests.Auth;

[Collection("Integration")]
public class RefreshTokenConcurrencyTests : IAsyncLifetime
{
    private readonly IntegrationTestWebAppFactory _factory;

    public RefreshTokenConcurrencyTests(IntegrationTestWebAppFactory factory)
    {
        _factory = factory;
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<Guid> SeedPilotWithSessionAsync()
    {
        var pilotId = Guid.NewGuid();

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var pilot = new Pilot
        {
            Id = pilotId,
            Name = "Test Pilot",
            LicenseNumber = $"LIC-{Guid.NewGuid():N}",
            Rank = PilotRank.Captain,
            Username = $"pilot_{Guid.NewGuid():N}",
            PasswordHash = "hash"
        };

        RefreshTokenPolicy.StartSession(pilot, DateTime.UtcNow);
        context.Pilots.Add(pilot);
        await context.SaveChangesAsync();

        return pilotId;
    }

    [Fact]
    public async Task Interleaved_Rotations_Of_The_Same_Session_Throw_DbUpdateConcurrencyException()
    {
        var pilotId = await SeedPilotWithSessionAsync();

        using var scopeA = _factory.Services.CreateScope();
        using var scopeB = _factory.Services.CreateScope();
        var contextA = scopeA.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var contextB = scopeB.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var pilotA = await contextA.Pilots.SingleAsync(p => p.Id == pilotId);
        var pilotB = await contextB.Pilots.SingleAsync(p => p.Id == pilotId);

        RefreshTokenPolicy.Rotate(pilotA, DateTime.UtcNow);
        await contextA.SaveChangesAsync();

        RefreshTokenPolicy.Rotate(pilotB, DateTime.UtcNow);
        var act = () => contextB.SaveChangesAsync();

        await act.Should().ThrowAsync<DbUpdateConcurrencyException>();
    }

    [Fact]
    public async Task Losing_A_Rotation_Race_Leaves_The_Winner_Session_Intact()
    {
        var pilotId = await SeedPilotWithSessionAsync();

        using var scopeA = _factory.Services.CreateScope();
        using var scopeB = _factory.Services.CreateScope();
        var contextA = scopeA.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var contextB = scopeB.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var pilotA = await contextA.Pilots.SingleAsync(p => p.Id == pilotId);
        var pilotB = await contextB.Pilots.SingleAsync(p => p.Id == pilotId);

        var winningToken = RefreshTokenPolicy.Rotate(pilotA, DateTime.UtcNow);
        await contextA.SaveChangesAsync();

        RefreshTokenPolicy.Rotate(pilotB, DateTime.UtcNow);
        try
        {
            await contextB.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
        }

        using var verifyScope = _factory.Services.CreateScope();
        var verifyContext = verifyScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var stored = await verifyContext.Pilots.AsNoTracking().SingleAsync(p => p.Id == pilotId);

        stored.RefreshTokenHash.Should().Be(TokenHasher.Hash(winningToken));
        stored.PreviousRefreshTokenHash.Should().NotBe(stored.RefreshTokenHash);
    }
}
