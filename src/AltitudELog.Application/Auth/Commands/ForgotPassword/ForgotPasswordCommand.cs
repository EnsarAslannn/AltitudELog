using MediatR;

namespace AltitudELog.Application.Auth.Commands.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest;
