using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Pilots.Queries.GetPilots;

public class GetPilotsQueryHandler : IRequestHandler<GetPilotsQuery, List<PilotDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPilotsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<PilotDto>> Handle(GetPilotsQuery request, CancellationToken cancellationToken)
    {
        return await _context.Pilots
            .AsNoTracking()
            .Select(p => new PilotDto
            {
                Id = p.Id,
                Name = p.Name,
                LicenseNumber = p.LicenseNumber,
                Rank = p.Rank,
                Username = p.Username
            })
            .ToListAsync(cancellationToken);
    }
}
