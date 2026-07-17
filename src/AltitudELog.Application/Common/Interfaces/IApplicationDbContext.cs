using AltitudELog.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Flight> Flights { get; }
    DbSet<Pilot> Pilots { get; }
    DbSet<AltitudELog.Domain.Entities.Crew> Crew { get; }
    DbSet<CRMReport> CRMReports { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
