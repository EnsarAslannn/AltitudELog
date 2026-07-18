using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.UnitTests.TestUtilities;

public class TestApplicationDbContext : DbContext, IApplicationDbContext
{
    public TestApplicationDbContext(DbContextOptions<TestApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Flight> Flights => Set<Flight>();
    public DbSet<Pilot> Pilots => Set<Pilot>();
    public DbSet<AltitudELog.Domain.Entities.Crew> Crew => Set<AltitudELog.Domain.Entities.Crew>();
    public DbSet<CRMReport> CRMReports => Set<CRMReport>();
}
