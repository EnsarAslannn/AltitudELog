namespace AltitudELog.Application.Auth.Commands.Login;

public record AuthResponseDto(
    string Token,
    DateTime ExpiresAtUtc,
    Guid PilotId,
    string Rank
);
