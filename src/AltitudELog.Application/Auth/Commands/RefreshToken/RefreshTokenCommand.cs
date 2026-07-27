using AltitudELog.Application.Auth.Commands.Login;
using MediatR;

namespace AltitudELog.Application.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string RefreshToken) : IRequest<AuthResponseDto>;
