using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.Pilots.Commands.UpdatePilotCertificates;

// Deliberately carries no PilotId in the wire contract — the handler resolves the caller from
// ICurrentUserService, so a pilot can only ever edit their own certificate dates. The handler
// stashes the resolved id in ResolvedPilotId solely so CacheKeysToInvalidate (read by
// CacheInvalidationBehavior after the handler runs, via the same command instance) can build
// the per-pilot cache key without it being client-suppliable.
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
