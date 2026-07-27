using FluentValidation;

namespace AltitudELog.Application.Auth.Commands.Login;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(c => c.Username)
            .NotEmpty();

        // No MinimumLength here — an existing account's password could predate any
        // strength policy. MaximumLength still guards PasswordHasher's CPU-bound KDF
        // against an oversized input.
        RuleFor(c => c.Password)
            .NotEmpty()
            .MaximumLength(100);
    }
}
