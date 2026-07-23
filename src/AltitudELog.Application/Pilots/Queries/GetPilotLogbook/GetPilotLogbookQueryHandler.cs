using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Pilots.Queries.GetPilotLogbook;

public class GetPilotLogbookQueryHandler : IRequestHandler<GetPilotLogbookQuery, PilotLogbookDto?>
{
    private readonly IApplicationDbContext _context;

    public GetPilotLogbookQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PilotLogbookDto?> Handle(GetPilotLogbookQuery request, CancellationToken cancellationToken)
    {
        var pilot = await _context.Pilots
            .AsNoTracking()
            .Where(p => p.Id == request.PilotId)
            .Select(p => new { p.Id, p.Name, p.LicenseNumber })
            .FirstOrDefaultAsync(cancellationToken);

        if (pilot is null)
        {
            return null;
        }

        var flights = await _context.Crew
            .AsNoTracking()
            .Where(c => c.PilotId == request.PilotId && !c.Flight.IsCancelled)
            .OrderBy(c => c.Flight.Date)
            .Select(c => new LogbookFlightDto
            {
                Date = c.Flight.Date,
                OriginICAO = c.Flight.OriginICAO,
                DestinationICAO = c.Flight.DestinationICAO,
                AircraftType = c.Flight.AircraftType,
                DutyRole = c.DutyRole,
                FlightTime = c.Flight.FlightTime
            })
            .ToListAsync(cancellationToken);

        return new PilotLogbookDto
        {
            PilotId = pilot.Id,
            PilotName = pilot.Name,
            LicenseNumber = pilot.LicenseNumber,
            TotalHours = TimeSpan.FromTicks(flights.Sum(f => f.FlightTime.Ticks)),
            Flights = flights
        };
    }
}
