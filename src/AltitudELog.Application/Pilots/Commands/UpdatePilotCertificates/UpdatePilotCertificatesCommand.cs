using MediatR;

namespace AltitudELog.Application.Pilots.Commands.UpdatePilotCertificates;

// Deliberately carries no PilotId — the handler resolves the caller from
// ICurrentUserService, so a pilot can only ever edit their own certificate dates.
public record UpdatePilotCertificatesCommand(
    DateOnly? LicenseExpiryDate,
    DateOnly? MedicalExpiryDate
) : IRequest;
