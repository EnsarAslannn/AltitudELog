using FluentValidation;

namespace AltitudELog.Application.Auth.Commands.Login;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(c => c.Username)
            .NotEmpty();

        RuleFor(c => c.Password)
            .NotEmpty()
            .MaximumLength(100);
    }
}
