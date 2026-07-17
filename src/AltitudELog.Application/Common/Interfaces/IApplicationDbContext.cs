using AltitudELog.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Flight> Flights { get; }
    DbSet<Pilot> Pilots { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
