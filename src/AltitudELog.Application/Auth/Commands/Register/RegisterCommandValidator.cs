using FluentValidation;

namespace AltitudELog.Application.Auth.Commands.Register;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(c => c.Username)
            .NotEmpty()
            .MaximumLength(100);

        // MinimumLength matches ResetPasswordCommandValidator, so a password set at
        // registration can't be weaker than one set via password reset. MaximumLength
        // bounds the input fed to PasswordHasher's CPU-bound KDF (an unbounded string
        // would otherwise be a cheap DoS vector).
        RuleFor(c => c.Password)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(100);

        RuleFor(c => c.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(c => c.LicenseNumber)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(c => c.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);
    }
}
