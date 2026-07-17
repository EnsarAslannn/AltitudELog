using AltitudELog.Domain.Enums;
using MediatR;

namespace AltitudELog.Application.Auth.Commands.Register;

public record RegisterCommand(
    string Username,
    string Password,
    string Name,
    string LicenseNumber,
    PilotRank Rank
) : IRequest<Guid>;
