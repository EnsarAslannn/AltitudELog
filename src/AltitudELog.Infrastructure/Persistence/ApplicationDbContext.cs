using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Flight> Flights => Set<Flight>();
    public DbSet<Pilot> Pilots => Set<Pilot>();
    public DbSet<Crew> Crew => Set<Crew>();
    public DbSet<CRMReport> CRMReports => Set<CRMReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
