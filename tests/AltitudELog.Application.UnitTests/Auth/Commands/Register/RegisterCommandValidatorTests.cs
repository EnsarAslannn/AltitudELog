using AltitudELog.Application.Auth.Commands.Register;
using FluentValidation.TestHelper;

namespace AltitudELog.Application.UnitTests.Auth.Commands.Register;

public class RegisterCommandValidatorTests
{
    private readonly RegisterCommandValidator _validator = new();

    private static RegisterCommand ValidCommand() => new(
        Username: "jdoe",
        Password: "P@ssw0rd123!",
        Name: "Jane Doe",
        LicenseNumber: "LIC-12345",
        Email: "jdoe@example.com");

    [Fact]
    public void Should_Pass_For_Valid_Command()
    {
        var result = _validator.TestValidate(ValidCommand());

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Should_HaveError_When_Username_Is_Empty()
    {
        var command = ValidCommand() with { Username = "" };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Username);
    }

    [Fact]
    public void Should_HaveError_When_Username_Exceeds_MaxLength()
    {
        var command = ValidCommand() with { Username = new string('u', 101) };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Username);
    }

    [Theory]
    [InlineData("")]
    [InlineData("short")]
    public void Should_HaveError_When_Password_Is_Too_Short(string password)
    {
        var command = ValidCommand() with { Password = password };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Password);
    }

    [Fact]
    public void Should_HaveError_When_Password_Exceeds_MaxLength()
    {
        var command = ValidCommand() with { Password = new string('p', 101) };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Password);
    }

    [Fact]
    public void Should_HaveError_When_Name_Is_Empty()
    {
        var command = ValidCommand() with { Name = "" };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Name);
    }

    [Fact]
    public void Should_HaveError_When_LicenseNumber_Is_Empty()
    {
        var command = ValidCommand() with { LicenseNumber = "" };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.LicenseNumber);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    public void Should_HaveError_When_Email_Is_Invalid(string email)
    {
        var command = ValidCommand() with { Email = email };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(c => c.Email);
    }
}
