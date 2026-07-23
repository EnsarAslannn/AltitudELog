using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Pilots.Queries.GetPilotProfile;

public class GetPilotProfileQueryHandler : IRequestHandler<GetPilotProfileQuery, PilotProfileDto?>
{
    private readonly IApplicationDbContext _context;

    public GetPilotProfileQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PilotProfileDto?> Handle(GetPilotProfileQuery request, CancellationToken cancellationToken)
    {
        var pilot = await _context.Pilots
            .AsNoTracking()
            .Where(p => p.Id == request.PilotId)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.LicenseNumber,
                p.Rank,
                p.Username,
                p.LicenseExpiryDate,
                p.MedicalExpiryDate
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (pilot is null)
        {
            return null;
        }

        var flights = await _context.Crew
            .AsNoTracking()
            .Where(c => c.PilotId == request.PilotId)
            .Select(c => new PilotFlightDto
            {
                FlightId = c.Flight.Id,
                OriginICAO = c.Flight.OriginICAO,
                DestinationICAO = c.Flight.DestinationICAO,
                Date = c.Flight.Date,
                FlightTime = c.Flight.FlightTime,
                AircraftType = c.Flight.AircraftType,
                DutyRole = c.DutyRole
            })
            .ToListAsync(cancellationToken);

        var hoursByAircraftType = flights
            .GroupBy(f => f.AircraftType)
            .Select(g => new AircraftHoursDto
            {
                AircraftType = g.Key,
                FlightCount = g.Count(),
                TotalHours = TimeSpan.FromTicks(g.Sum(f => f.FlightTime.Ticks))
            })
            .OrderByDescending(a => a.TotalHours)
            .ToList();

        var recentFlights = flights
            .OrderByDescending(f => f.Date)
            .Take(5)
            .ToList();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currencyCutoff = today.AddDays(-90);
        var flightsLast90Days = flights.Where(f => f.Date >= currencyCutoff).ToList();
        var lastFlightDate = flights.Count > 0 ? flights.Max(f => f.Date) : (DateOnly?)null;

        return new PilotProfileDto
        {
            Id = pilot.Id,
            Name = pilot.Name,
            LicenseNumber = pilot.LicenseNumber,
            Rank = pilot.Rank,
            Username = pilot.Username,
            TotalFlights = flights.Count,
            TotalFlightHours = TimeSpan.FromTicks(flights.Sum(f => f.FlightTime.Ticks)),
            HoursByAircraftType = hoursByAircraftType,
            RecentFlights = recentFlights,
            FlightsLast90Days = flightsLast90Days.Count,
            HoursLast90Days = TimeSpan.FromTicks(flightsLast90Days.Sum(f => f.FlightTime.Ticks)),
            LastFlightDate = lastFlightDate,
            IsCurrent = lastFlightDate is not null && lastFlightDate >= currencyCutoff,
            LicenseExpiryDate = pilot.LicenseExpiryDate,
            MedicalExpiryDate = pilot.MedicalExpiryDate
        };
    }
}
