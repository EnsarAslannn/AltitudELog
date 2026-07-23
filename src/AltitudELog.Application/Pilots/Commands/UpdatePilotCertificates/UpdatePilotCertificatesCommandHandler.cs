using AltitudELog.Application.Common.Caching;
using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Pilots.Commands.UpdatePilotCertificates;

public class UpdatePilotCertificatesCommandHandler : IRequestHandler<UpdatePilotCertificatesCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDistributedCache _cache;
    private readonly ILogger<UpdatePilotCertificatesCommandHandler> _logger;

    public UpdatePilotCertificatesCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IDistributedCache cache,
        ILogger<UpdatePilotCertificatesCommandHandler> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _cache = cache;
        _logger = logger;
    }

    public async Task Handle(UpdatePilotCertificatesCommand request, CancellationToken cancellationToken)
    {
        var pilotId = _currentUserService.PilotId
            ?? throw new UnauthorizedAccessException("No authenticated pilot found for this request.");

        var pilot = await _context.Pilots
            .FirstOrDefaultAsync(p => p.Id == pilotId, cancellationToken)
            ?? throw new UnauthorizedAccessException("No authenticated pilot found for this request.");

        pilot.LicenseExpiryDate = request.LicenseExpiryDate;
        pilot.MedicalExpiryDate = request.MedicalExpiryDate;

        await _context.SaveChangesAsync(cancellationToken);

        try
        {
            await _cache.RemoveAsync(CacheKeys.PilotProfile(pilotId), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex, "Failed to invalidate cache key {CacheKey}; continuing without cache.",
                CacheKeys.PilotProfile(pilotId));
        }

        _logger.LogInformation("Pilot {PilotId} updated certificate expiry dates", pilotId);
    }
}
