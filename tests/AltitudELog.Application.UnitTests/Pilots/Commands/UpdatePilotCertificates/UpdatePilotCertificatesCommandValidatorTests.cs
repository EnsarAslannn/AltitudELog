using AltitudELog.Application.Pilots.Commands.UpdatePilotCertificates;
using FluentValidation.TestHelper;

namespace AltitudELog.Application.UnitTests.Pilots.Commands.UpdatePilotCertificates;

public class UpdatePilotCertificatesCommandValidatorTests
{
    private readonly UpdatePilotCertificatesCommandValidator _validator = new();

    [Fact]
    public void Should_Pass_When_Both_Dates_Are_Null()
    {
        var result = _validator.TestValidate(new UpdatePilotCertificatesCommand(null, null));

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Should_Pass_For_Reasonable_Expiry_Dates()
    {
        var command = new UpdatePilotCertificatesCommand(
            LicenseExpiryDate: DateOnly.FromDateTime(DateTime.UtcNow).AddYears(2),
            MedicalExpiryDate: DateOnly.FromDateTime(DateTime.UtcNow).AddMonths(6));

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Should_Pass_For_Already_Expired_Dates()
    {
        var command = new UpdatePilotCertificatesCommand(
            LicenseExpiryDate: DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-1),
            MedicalExpiryDate: DateOnly.FromDateTime(DateTime.UtcNow).AddMonths(-3));

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Should_HaveError_When_LicenseExpiryDate_Is_Unreasonably_Far_In_The_Future()
    {
        var command = new UpdatePilotCertificatesCommand(
            LicenseExpiryDate: DateOnly.FromDateTime(DateTime.UtcNow).AddYears(51),
            MedicalExpiryDate: null);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.LicenseExpiryDate);
    }

    [Fact]
    public void Should_HaveError_When_MedicalExpiryDate_Is_Unreasonably_Far_In_The_Future()
    {
        var command = new UpdatePilotCertificatesCommand(
            LicenseExpiryDate: null,
            MedicalExpiryDate: DateOnly.FromDateTime(DateTime.UtcNow).AddYears(51));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.MedicalExpiryDate);
    }
}
