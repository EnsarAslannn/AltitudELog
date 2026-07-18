using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Auth.Commands.Register;

public record RegisterCommand(
    string Username,
    string Password,
    string Name,
    string LicenseNumber
) : IRequest<Guid>, ICacheInvalidatorCommand
{
    public string[] CacheKeysToInvalidate => [CacheKeys.AllPilots];
}
