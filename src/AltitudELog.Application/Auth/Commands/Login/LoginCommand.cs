using MediatR;

namespace AltitudELog.Application.Auth.Commands.Login;

public record LoginCommand(string Username, string Password) : IRequest<AuthResponseDto>;
