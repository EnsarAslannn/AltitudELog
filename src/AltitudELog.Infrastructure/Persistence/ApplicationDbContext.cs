using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Common;
using AltitudELog.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUserService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService) : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<Flight> Flights => Set<Flight>();
    public DbSet<Pilot> Pilots => Set<Pilot>();
    public DbSet<Crew> Crew => Set<Crew>();
    public DbSet<CRMReport> CRMReports => Set<CRMReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampAudit();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        StampAudit();
        return base.SaveChanges();
    }

    /// <summary>
    /// Fills the audit columns from the acting pilot, here rather than in each handler so a new
    /// command cannot forget to. The pilot id is null for anything that runs without a request
    /// behind it — a Hangfire job, a startup migration — which is a fact worth recording as null
    /// rather than papering over.
    /// </summary>
    private void StampAudit()
    {
        var now = DateTime.UtcNow;
        var pilotId = _currentUserService.PilotId;

        foreach (var entry in ChangeTracker.Entries<IModificationAudited>())
        {
            switch (entry.State)
            {
                case EntityState.Added when entry.Entity is IAuditableEntity created:
                    created.CreatedAtUtc = now;
                    created.CreatedByPilotId = pilotId;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAtUtc = now;
                    entry.Entity.UpdatedByPilotId = pilotId;
                    break;
            }
        }
    }
}
