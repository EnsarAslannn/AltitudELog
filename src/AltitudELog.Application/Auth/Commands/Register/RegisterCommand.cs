using AltitudELog.Application.Common.Caching;
using AltitudELog.Domain.Enums;
using MediatR;

namespace AltitudELog.Application.Auth.Commands.Register;

public record RegisterCommand(
    string Username,
    string Password,
    string Name,
    string LicenseNumber,
    // Self-selected at registration. Optional for backward compatibility; defaults to
    // Trainee when omitted. (This is a deliberate demo choice — the app previously forced
    // Trainee to prevent privilege escalation; here we let visitors pick their rank so they
    // can try Captain-only features.)
    PilotRank Rank = PilotRank.Trainee
) : IRequest<Guid>, ICacheInvalidatorCommand
{
    public string[] CacheKeysToInvalidate => [CacheKeys.AllPilots];
}
