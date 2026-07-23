using FluentValidation;

namespace AltitudELog.Application.Auth.Commands.ResetPassword;

public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(c => c.Token)
            .NotEmpty();

        RuleFor(c => c.NewPassword)
            .NotEmpty()
            .MinimumLength(8);
    }
}
