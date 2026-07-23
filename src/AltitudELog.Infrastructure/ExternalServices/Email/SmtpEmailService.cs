using AltitudELog.Application.Common.Interfaces;
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
        var host = _configuration["Email:SmtpHost"];
        var port = _configuration.GetValue<int>("Email:SmtpPort");
        var username = _configuration["Email:SmtpUsername"];
        var password = _configuration["Email:SmtpPassword"];
        var fromAddress = _configuration["Email:FromAddress"];
        var frontendBaseUrl = _configuration["Frontend:BaseUrl"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromAddress))
        {
            throw new InvalidOperationException("SMTP is not configured (Email:SmtpHost/FromAddress missing).");
        }

        var resetLink = $"{frontendBaseUrl}/reset-password?token={Uri.EscapeDataString(resetToken)}";

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(fromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "AltitudELog - Şifre Sıfırlama";
        message.Body = new TextPart("plain")
        {
            Text = $"Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın (1 saat geçerlidir):\n\n{resetLink}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz."
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, SecureSocketOptions.StartTlsWhenAvailable, cancellationToken);
        if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
        {
            await client.AuthenticateAsync(username, password, cancellationToken);
        }
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        _logger.LogInformation("Password reset email sent to {Email}", toEmail);
    }
}
