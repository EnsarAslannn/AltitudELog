using FluentValidation;

namespace AltitudELog.Application.Auth.Commands.ResetPassword;

public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(c => c.Token)
            .NotEmpty();

        // MaximumLength matters as much as MinimumLength here: this endpoint is anonymous and the
        // handler feeds the value straight to PasswordHasher, so an unbounded string is a cheap
        // DoS vector. Same cap and rationale as RegisterCommandValidator/LoginCommandValidator.
        RuleFor(c => c.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(100);
    }
}
