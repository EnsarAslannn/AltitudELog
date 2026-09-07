using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace AltitudELog.Infrastructure.ExternalServices.Email;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken)
    {
        var frontendBaseUrl = _configuration["Frontend:BaseUrl"];
        var resetLink = $"{frontendBaseUrl}/reset-password?token={Uri.EscapeDataString(resetToken)}";

        var body =
            $"Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın (1 saat geçerlidir):\n\n{resetLink}\n\n"
            + "Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.";

        await SendAsync(toEmail, "AltitudELog - Şifre Sıfırlama", body, cancellationToken);

        _logger.LogInformation("Password reset email sent to {Email}", toEmail);
    }

    public async Task SendCertificateExpiryEmailAsync(
        string toEmail,
        string pilotName,
        IReadOnlyCollection<CertificateExpiryNotice> notices,
        CancellationToken cancellationToken)
    {
        var lines = notices
            .OrderBy(n => n.DaysRemaining)
            .Select(n => $"- {Label(n.Kind)}: {n.ExpiryDate:dd.MM.yyyy} ({Remaining(n.DaysRemaining)})");

        var body =
            $"Sayın {pilotName},\n\n"
            + "Aşağıdaki belgelerinizin geçerlilik süresi dolmak üzere:\n\n"
            + string.Join("\n", lines)
            + "\n\nGeçerlilik tarihlerinizi AltitudELog profilinizden güncelleyebilirsiniz.";

        await SendAsync(toEmail, "AltitudELog - Sertifika Geçerlilik Uyarısı", body, cancellationToken);

        _logger.LogInformation("Certificate expiry email sent to {Email}", toEmail);
    }

    private async Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken)
    {
        var host = _configuration["Email:SmtpHost"];
        var port = _configuration.GetValue<int>("Email:SmtpPort");
        var username = _configuration["Email:SmtpUsername"];
        var password = _configuration["Email:SmtpPassword"];
        var fromAddress = _configuration["Email:FromAddress"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromAddress))
        {
            throw new InvalidOperationException("SMTP is not configured (Email:SmtpHost/FromAddress missing).");
        }

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(fromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("plain") { Text = body };

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, SecureSocketOptions.StartTlsWhenAvailable, cancellationToken);
        if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
        {
            await client.AuthenticateAsync(username, password, cancellationToken);
        }
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }

    private static string Label(CertificateKind kind) => kind switch
    {
        CertificateKind.License => "Uçuş lisansı",
        CertificateKind.Medical => "Sağlık sertifikası (medical)",
        _ => kind.ToString()
    };

    private static string Remaining(int daysRemaining) => daysRemaining == 0
        ? "bugün doluyor"
        : $"{daysRemaining} gün kaldı";
}
