using AltitudELog.Application.Common.Models;

namespace AltitudELog.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken);

    Task SendCertificateExpiryEmailAsync(
        string toEmail,
        string pilotName,
        IReadOnlyCollection<CertificateExpiryNotice> notices,
        CancellationToken cancellationToken);
}
