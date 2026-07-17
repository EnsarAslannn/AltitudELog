using AltitudELog.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AltitudELog.Infrastructure.Persistence.Configurations;

public class PilotConfiguration : IEntityTypeConfiguration<Pilot>
{
    public void Configure(EntityTypeBuilder<Pilot> builder)
    {
        builder.ToTable("Pilots");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.LicenseNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => p.LicenseNumber)
            .IsUnique();

        builder.Property(p => p.Rank)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(p => p.Username)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(p => p.Username)
            .IsUnique();

        builder.Property(p => p.PasswordHash)
            .IsRequired()
            .HasMaxLength(500);
    }
}
