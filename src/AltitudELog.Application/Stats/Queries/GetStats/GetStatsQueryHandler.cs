using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Stats.Queries.GetStats;

public class GetStatsQueryHandler : IRequestHandler<GetStatsQuery, StatsDto>
{
    private readonly IApplicationDbContext _context;

    public GetStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<StatsDto> Handle(GetStatsQuery request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var totalFlights = await _context.Flights.CountAsync(f => !f.IsCancelled, cancellationToken);
        var flightsThisMonth = await _context.Flights
            .CountAsync(f => !f.IsCancelled && f.Date.Year == today.Year && f.Date.Month == today.Month, cancellationToken);

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

        return new StatsDto
        {
            TotalFlights = totalFlights,
            FlightsThisMonth = flightsThisMonth,
            TotalPilots = totalPilots,
            PilotsByRank = pilotsByRank.ToDictionary(x => x.Rank, x => x.Count),
            TotalCrmReports = totalCrmReports,
            CrmReportsBySeverity = crmReportsBySeverity.ToDictionary(x => x.Severity, x => x.Count)
        };
    }
}
