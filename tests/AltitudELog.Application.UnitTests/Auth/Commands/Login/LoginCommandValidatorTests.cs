using AltitudELog.Application.Auth.Commands.Login;
using FluentValidation.TestHelper;

namespace AltitudELog.Application.UnitTests.Auth.Commands.Login;

public class LoginCommandValidatorTests
{
    private readonly LoginCommandValidator _validator = new();

    [Fact]
    public void Should_Pass_For_Valid_Command()
    {
        var result = _validator.TestValidate(new LoginCommand("jdoe", "whatever-they-typed"));

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Should_HaveError_When_Username_Is_Empty()
    {
        var result = _validator.TestValidate(new LoginCommand("", "password"));

        result.ShouldHaveValidationErrorFor(c => c.Username);
    }

    [Fact]
    public void Should_HaveError_When_Password_Is_Empty()
    {
        var result = _validator.TestValidate(new LoginCommand("jdoe", ""));

        result.ShouldHaveValidationErrorFor(c => c.Password);
    }

    [Fact]
    public void Should_HaveError_When_Password_Exceeds_MaxLength()
    {
        var result = _validator.TestValidate(new LoginCommand("jdoe", new string('p', 101)));

        result.ShouldHaveValidationErrorFor(c => c.Password);
    }
}
