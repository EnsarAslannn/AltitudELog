using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Pilots.Commands.UpdatePilotCertificates;

public record UpdatePilotCertificatesCommand(
    DateOnly? LicenseExpiryDate,
    DateOnly? MedicalExpiryDate
) : IRequest, ICacheInvalidatorCommand
{
    internal Guid ResolvedPilotId { get; set; }

    public string[] CacheKeysToInvalidate =>
        ResolvedPilotId == Guid.Empty
            ? [CacheKeys.Stats]
            : [CacheKeys.PilotProfile(ResolvedPilotId), CacheKeys.Stats];
}
