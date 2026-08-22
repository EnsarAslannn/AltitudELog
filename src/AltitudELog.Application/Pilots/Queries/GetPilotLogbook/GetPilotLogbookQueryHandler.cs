using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Application.Common.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Pilots.Queries.GetPilotLogbook;

public class GetPilotLogbookQueryHandler : IRequestHandler<GetPilotLogbookQuery, PilotLogbookDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetPilotLogbookQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<PilotLogbookDto?> Handle(GetPilotLogbookQuery request, CancellationToken cancellationToken)
    {
        if (request.PilotId != _currentUser.PilotId && !PilotRankPolicy.IsCommandRank(_currentUser.Rank))
        {
            throw new ForbiddenAccessException(
                "A logbook can only be exported by the pilot it belongs to, or by a Captain or Chief Pilot.");
        }

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
