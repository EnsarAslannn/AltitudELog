using AltitudELog.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AltitudELog.Infrastructure.Persistence.Configurations;

public class CrewConfiguration : IEntityTypeConfiguration<Crew>
{
    public void Configure(EntityTypeBuilder<Crew> builder)
    {
        builder.ToTable("Crew");

        builder.HasKey(c => c.Id);

        builder.HasIndex(c => c.PilotId);

        builder.Property(c => c.DutyRole)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasIndex(c => new { c.FlightId, c.PilotId })
            .IsUnique();

        builder.HasOne(c => c.Flight)
            .WithMany(f => f.CrewAssignments)
            .HasForeignKey(c => c.FlightId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Pilot)
            .WithMany(p => p.CrewAssignments)
            .HasForeignKey(c => c.PilotId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
