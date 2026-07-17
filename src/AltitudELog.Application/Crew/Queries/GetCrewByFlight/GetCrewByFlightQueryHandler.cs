using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Crew.Queries.GetCrewByFlight;

public class GetCrewByFlightQueryHandler : IRequestHandler<GetCrewByFlightQuery, List<CrewDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCrewByFlightQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CrewDto>> Handle(GetCrewByFlightQuery request, CancellationToken cancellationToken)
    {
        return await _context.Crew
            .AsNoTracking()
            .Where(c => c.FlightId == request.FlightId)
            .Select(c => new CrewDto
            {
                Id = c.Id,
                FlightId = c.FlightId,
                PilotId = c.PilotId,
                PilotName = c.Pilot.Name,
                DutyRole = c.DutyRole
            })
            .ToListAsync(cancellationToken);
    }
}
