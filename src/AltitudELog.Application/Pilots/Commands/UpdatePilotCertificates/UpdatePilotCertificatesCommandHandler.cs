using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Pilots.Commands.UpdatePilotCertificates;

public class UpdatePilotCertificatesCommandHandler : IRequestHandler<UpdatePilotCertificatesCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<UpdatePilotCertificatesCommandHandler> _logger;

    public UpdatePilotCertificatesCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<UpdatePilotCertificatesCommandHandler> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
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

        request.ResolvedPilotId = pilotId;

        _logger.LogInformation("Pilot {PilotId} updated certificate expiry dates", pilotId);
    }
}
