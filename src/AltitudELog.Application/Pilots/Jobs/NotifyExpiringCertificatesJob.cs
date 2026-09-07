using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Models;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.Pilots.Jobs;

/// <summary>
/// Daily sweep that warns pilots whose licence or medical is about to lapse. Without it the expiry
/// dates on <c>Pilot</c> are inert data: they render on the profile, but nothing reaches a pilot who
/// isn't looking at the page.
///
/// Notices fire on <em>exact</em> day counts (<see cref="NoticeDaysBefore"/>) rather than on a
/// "within 30 days" window, because a daily job over a window would mail the same pilot every day
/// for a month. Exact days keep it to at most six mails per certificate and need no extra
/// "last notified" column — the run date is the state. The trade-off is that a run missed entirely
/// (server down all day) skips that day's notices rather than catching up, which is the right
/// failure for a reminder: a stale warning sent late is worse than the next threshold arriving.
///
/// Not retried automatically. A failure here is almost always SMTP being unreachable or
/// unconfigured, which a retry minutes later won't fix, and a bounded per-pilot catch below already
/// keeps one bad address from costing the rest of the batch their warning.
/// </summary>
[AutomaticRetry(Attempts = 0)]
public class NotifyExpiringCertificatesJob
{
    public const string RecurringJobId = "pilot-certificate-expiry-notifications";

    /// <summary>Days-remaining values that trigger a notice. 0 means "expires today".</summary>
    internal static readonly int[] NoticeDaysBefore = [30, 14, 7, 3, 1, 0];

    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<NotifyExpiringCertificatesJob> _logger;

    public NotifyExpiringCertificatesJob(
        IApplicationDbContext context,
        IEmailService emailService,
        ILogger<NotifyExpiringCertificatesJob> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var horizon = today.AddDays(NoticeDaysBefore.Max());

        // The window is as wide as the furthest threshold; the exact-day filter runs in memory
        // afterwards, since DateOnly.DayNumber arithmetic doesn't translate to SQL.
        var candidates = await _context.Pilots
            .AsNoTracking()
            .Where(p => p.Email != null
                && ((p.LicenseExpiryDate != null && p.LicenseExpiryDate >= today && p.LicenseExpiryDate <= horizon)
                    || (p.MedicalExpiryDate != null && p.MedicalExpiryDate >= today && p.MedicalExpiryDate <= horizon)))
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Email,
                p.LicenseExpiryDate,
                p.MedicalExpiryDate
            })
            .ToListAsync(cancellationToken);

        var sent = 0;
        var failed = 0;

        foreach (var pilot in candidates)
        {
            var notices = new List<CertificateExpiryNotice>(2);
            AddNoticeIfDue(notices, CertificateKind.License, pilot.LicenseExpiryDate, today);
            AddNoticeIfDue(notices, CertificateKind.Medical, pilot.MedicalExpiryDate, today);

            if (notices.Count == 0)
            {
                continue;
            }

            try
            {
                await _emailService.SendCertificateExpiryEmailAsync(
                    pilot.Email!, pilot.Name, notices, cancellationToken);

                sent++;

                _logger.LogInformation(
                    "Certificate expiry notice sent to pilot {PilotId} for {CertificateCount} certificate(s)",
                    pilot.Id, notices.Count);
            }
            catch (Exception ex)
            {
                failed++;

                _logger.LogWarning(
                    ex, "Certificate expiry notice could not be delivered to pilot {PilotId}", pilot.Id);
            }
        }

        _logger.LogInformation(
            "Certificate expiry sweep finished for {Date}: {Sent} sent, {Failed} failed, {Scanned} pilot(s) in window",
            today, sent, failed, candidates.Count);
    }

    private static void AddNoticeIfDue(
        List<CertificateExpiryNotice> notices, CertificateKind kind, DateOnly? expiryDate, DateOnly today)
    {
        if (expiryDate is not { } expiry)
        {
            return;
        }

        var daysRemaining = expiry.DayNumber - today.DayNumber;

        if (NoticeDaysBefore.Contains(daysRemaining))
        {
            notices.Add(new CertificateExpiryNotice(kind, expiry, daysRemaining));
        }
    }
}
