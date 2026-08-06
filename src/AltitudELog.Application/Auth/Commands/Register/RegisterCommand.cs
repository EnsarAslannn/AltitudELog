using AltitudELog.Application.Common.Caching;
using AltitudELog.Domain.Enums;
using MediatR;

namespace AltitudELog.Application.Auth.Commands.Register;

public record RegisterCommand(
    string Username,
    string Password,
    string Name,
    string LicenseNumber,
    string Email,
    PilotRank Rank = PilotRank.Trainee,
    DateOnly? LicenseExpiryDate = null,
    DateOnly? MedicalExpiryDate = null
) : IRequest<Guid>, ICacheInvalidatorCommand
{
    public string[] CacheKeysToInvalidate => [CacheKeys.AllPilots, CacheKeys.Stats];
}
