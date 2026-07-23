using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Stats.Queries.GetStats;

public class GetStatsQueryHandler : IRequestHandler<GetStatsQuery, StatsDto>
{
    private const int ExpiryWarningDays = 30;

    private readonly IApplicationDbContext _context;

    public GetStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<StatsDto> Handle(GetStatsQuery request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var totalFlights = await _context.Flights.CountAsync(cancellationToken);
        var flightsThisMonth = await _context.Flights
            .CountAsync(f => f.Date.Year == today.Year && f.Date.Month == today.Month, cancellationToken);

        var totalPilots = await _context.Pilots.CountAsync(cancellationToken);
        var pilotsByRank = await _context.Pilots
            .GroupBy(p => p.Rank)
            .Select(g => new { Rank = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var totalCrmReports = await _context.CRMReports.CountAsync(cancellationToken);
        var crmReportsBySeverity = await _context.CRMReports
            .GroupBy(r => r.SeverityLevel)
            .Select(g => new { Severity = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var expiryThreshold = today.AddDays(ExpiryWarningDays);
        var expiringCertifications = await _context.Pilots
            .Where(p =>
                (p.LicenseExpiryDate != null && p.LicenseExpiryDate <= expiryThreshold) ||
                (p.MedicalExpiryDate != null && p.MedicalExpiryDate <= expiryThreshold))
            .Select(p => new ExpiringCertificationDto
            {
                PilotId = p.Id,
                PilotName = p.Name,
                LicenseExpiryDate = p.LicenseExpiryDate,
                MedicalExpiryDate = p.MedicalExpiryDate
            })
            .ToListAsync(cancellationToken);

        expiringCertifications = expiringCertifications
            .OrderBy(c => Soonest(c.LicenseExpiryDate, c.MedicalExpiryDate))
            .ToList();

        var trendCutoff = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-5);
        var crmTrendRaw = await _context.CRMReports
            .Where(r => r.CreatedDate >= trendCutoff)
            .GroupBy(r => new { r.CreatedDate.Year, r.CreatedDate.Month, r.SeverityLevel })
            .Select(g => new { g.Key.Year, g.Key.Month, g.Key.SeverityLevel, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var crmTrendByMonth = new List<MonthlyCrmTrendDto>();
        for (var i = 5; i >= 0; i--)
        {
            var bucket = new DateOnly(today.Year, today.Month, 1).AddMonths(-i);
            var counts = Enum.GetValues<SeverityLevel>().ToDictionary(s => s, _ => 0);
            foreach (var entry in crmTrendRaw.Where(e => e.Year == bucket.Year && e.Month == bucket.Month))
            {
                counts[entry.SeverityLevel] = entry.Count;
            }

            crmTrendByMonth.Add(new MonthlyCrmTrendDto
            {
                Year = bucket.Year,
                Month = bucket.Month,
                CountsBySeverity = counts
            });
        }

        return new StatsDto
        {
            TotalFlights = totalFlights,
            FlightsThisMonth = flightsThisMonth,
            TotalPilots = totalPilots,
            PilotsByRank = pilotsByRank.ToDictionary(x => x.Rank, x => x.Count),
            TotalCrmReports = totalCrmReports,
            CrmReportsBySeverity = crmReportsBySeverity.ToDictionary(x => x.Severity, x => x.Count),
            ExpiringCertifications = expiringCertifications,
            CrmTrendByMonth = crmTrendByMonth
        };
    }

    private static DateOnly Soonest(DateOnly? license, DateOnly? medical)
    {
        if (license is null) return medical!.Value;
        if (medical is null) return license.Value;
        return license.Value < medical.Value ? license.Value : medical.Value;
    }
}
