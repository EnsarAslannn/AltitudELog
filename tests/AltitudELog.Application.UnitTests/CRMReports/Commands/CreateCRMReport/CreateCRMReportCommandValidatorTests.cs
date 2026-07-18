using AltitudELog.Application.CRMReports.Commands.CreateCRMReport;
using AltitudELog.Application.UnitTests.TestUtilities;
using AltitudELog.Domain.Entities;
using AltitudELog.Domain.Enums;
using FluentValidation.TestHelper;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.UnitTests.CRMReports.Commands.CreateCRMReport;

public class CreateCRMReportCommandValidatorTests
{
    private static TestApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestApplicationDbContext(options);
    }

    private static Flight NewFlight() => new()
    {
        Id = Guid.NewGuid(),
        OriginICAO = "LTFM",
        DestinationICAO = "EGLL",
        FlightTime = TimeSpan.FromHours(4),
        AircraftType = "A350",
        Date = DateOnly.FromDateTime(DateTime.UtcNow)
    };

    private static CreateCRMReportCommand ValidCommand(Guid flightId) => new(
        flightId, "Unstable approach", "Description of the event.", false, SeverityLevel.Medium);

    [Fact]
    public async Task Should_Pass_When_Flight_Exists()
    {
        await using var context = CreateContext();
        var flight = NewFlight();
        context.Flights.Add(flight);
        await context.SaveChangesAsync();

        var validator = new CreateCRMReportCommandValidator(context);

        var result = await validator.TestValidateAsync(ValidCommand(flight.Id));

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public async Task Should_HaveError_When_Flight_Does_Not_Exist()
    {
        await using var context = CreateContext();

        var validator = new CreateCRMReportCommandValidator(context);

        var result = await validator.TestValidateAsync(ValidCommand(Guid.NewGuid()));

        result.ShouldHaveValidationErrorFor(c => c.FlightId);
    }
}
