using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Models;
using AltitudELog.Application.Pilots.Jobs;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using AwesomeAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace AltitudELog.Application.UnitTests.Pilots.Jobs;

public class NotifyExpiringCertificatesJobTests
{
    private static readonly DateOnly Today = DateOnly.FromDateTime(DateTime.UtcNow);

    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Pilot NewPilot(
        string? email = "pilot@example.com",
        DateOnly? licenseExpiry = null,
        DateOnly? medicalExpiry = null) => new()
        {
            Id = Guid.NewGuid(),
            Name = "Test Pilot",
            LicenseNumber = $"LIC-{Guid.NewGuid():N}",
            Rank = PilotRank.Captain,
            Username = $"pilot_{Guid.NewGuid():N}",
            PasswordHash = "hash",
            Email = email,
            LicenseExpiryDate = licenseExpiry,
            MedicalExpiryDate = medicalExpiry
        };

    private static NotifyExpiringCertificatesJob NewJob(
        TestApplicationDbContext context, IEmailService emailService) =>
        new(context, emailService, Substitute.For<ILogger<NotifyExpiringCertificatesJob>>());

    [Theory]
    [InlineData(30)]
    [InlineData(14)]
    [InlineData(7)]
    [InlineData(3)]
    [InlineData(1)]
    [InlineData(0)]
    public async Task ExecuteAsync_Should_Notify_On_Each_Threshold_Day(int daysRemaining)
    {
        await using var context = CreateContext();
        context.Pilots.Add(NewPilot(licenseExpiry: Today.AddDays(daysRemaining)));
        await context.SaveChangesAsync();

        var emailService = Substitute.For<IEmailService>();

        await NewJob(context, emailService).ExecuteAsync(CancellationToken.None);

        await emailService.Received(1).SendCertificateExpiryEmailAsync(
            "pilot@example.com",
            Arg.Any<string>(),
            Arg.Is<IReadOnlyCollection<CertificateExpiryNotice>>(n =>
                n.Count == 1
                && n.Single().Kind == CertificateKind.License
                && n.Single().DaysRemaining == daysRemaining),
            Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(29)]
    [InlineData(31)]
    [InlineData(2)]
    public async Task ExecuteAsync_Should_Stay_Silent_On_A_Non_Threshold_Day(int daysRemaining)
    {
        await using var context = CreateContext();
        context.Pilots.Add(NewPilot(licenseExpiry: Today.AddDays(daysRemaining)));
        await context.SaveChangesAsync();

        var emailService = Substitute.For<IEmailService>();

        await NewJob(context, emailService).ExecuteAsync(CancellationToken.None);

        await emailService.DidNotReceiveWithAnyArgs().SendCertificateExpiryEmailAsync(
            default!, default!, default!, default);
    }

    [Fact]
    public async Task ExecuteAsync_Should_Ignore_Certificates_That_Already_Lapsed()
    {
        await using var context = CreateContext();
        context.Pilots.Add(NewPilot(licenseExpiry: Today.AddDays(-1)));
        await context.SaveChangesAsync();

        var emailService = Substitute.For<IEmailService>();

        await NewJob(context, emailService).ExecuteAsync(CancellationToken.None);

        await emailService.DidNotReceiveWithAnyArgs().SendCertificateExpiryEmailAsync(
            default!, default!, default!, default);
    }

    [Fact]
    public async Task ExecuteAsync_Should_Send_One_Mail_Carrying_Both_Certificates()
    {
        await using var context = CreateContext();
        context.Pilots.Add(NewPilot(licenseExpiry: Today.AddDays(7), medicalExpiry: Today.AddDays(30)));
        await context.SaveChangesAsync();

        var emailService = Substitute.For<IEmailService>();

        await NewJob(context, emailService).ExecuteAsync(CancellationToken.None);

        await emailService.Received(1).SendCertificateExpiryEmailAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Is<IReadOnlyCollection<CertificateExpiryNotice>>(n =>
                n.Count == 2
                && n.Any(x => x.Kind == CertificateKind.License && x.DaysRemaining == 7)
                && n.Any(x => x.Kind == CertificateKind.Medical && x.DaysRemaining == 30)),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ExecuteAsync_Should_Skip_Pilots_Without_An_Email()
    {
        await using var context = CreateContext();
        context.Pilots.Add(NewPilot(email: null, licenseExpiry: Today.AddDays(7)));
        await context.SaveChangesAsync();

        var emailService = Substitute.For<IEmailService>();

        await NewJob(context, emailService).ExecuteAsync(CancellationToken.None);

        await emailService.DidNotReceiveWithAnyArgs().SendCertificateExpiryEmailAsync(
            default!, default!, default!, default);
    }

    [Fact]
    public async Task ExecuteAsync_Should_Keep_Going_When_One_Pilots_Mail_Fails()
    {
        await using var context = CreateContext();
        context.Pilots.Add(NewPilot(email: "broken@example.com", licenseExpiry: Today.AddDays(7)));
        context.Pilots.Add(NewPilot(email: "reachable@example.com", licenseExpiry: Today.AddDays(7)));
        await context.SaveChangesAsync();

        var emailService = Substitute.For<IEmailService>();
        emailService
            .SendCertificateExpiryEmailAsync(
                "broken@example.com",
                Arg.Any<string>(),
                Arg.Any<IReadOnlyCollection<CertificateExpiryNotice>>(),
                Arg.Any<CancellationToken>())
            .Returns(Task.FromException(new InvalidOperationException("SMTP is not configured.")));

        var act = () => NewJob(context, emailService).ExecuteAsync(CancellationToken.None);

        await act.Should().NotThrowAsync();

        await emailService.Received(1).SendCertificateExpiryEmailAsync(
            "reachable@example.com",
            Arg.Any<string>(),
            Arg.Any<IReadOnlyCollection<CertificateExpiryNotice>>(),
            Arg.Any<CancellationToken>());
    }
}
