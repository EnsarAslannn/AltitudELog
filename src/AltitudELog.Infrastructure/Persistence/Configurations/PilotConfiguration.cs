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

        builder.Property(p => p.Email)
            .HasMaxLength(256);

        builder.HasIndex(p => p.Email)
            .IsUnique();

        builder.Property(p => p.PasswordResetTokenHash)
            .HasMaxLength(500);

        builder.Property(p => p.RefreshTokenHash)
            .HasMaxLength(500);

        // Both token flows look a pilot up *by hash* (RefreshTokenCommandHandler,
        // ResetPasswordCommandHandler), so without these every token refresh is a sequential scan
        // of Pilots. Filtered, because the columns are null for every pilot not mid-flow.
        builder.Property(p => p.PreviousRefreshTokenHash)
            .HasMaxLength(500);

        builder.HasIndex(p => p.RefreshTokenHash)
            .HasDatabaseName("IX_Pilots_RefreshTokenHash")
            .HasFilter("\"RefreshTokenHash\" IS NOT NULL");

        // RefreshTokenCommandHandler looks a pilot up by either hash in one query, so the
        // previous-token column needs its own index or reuse detection reintroduces the
        // sequential scan the current-token index was added to remove.
        builder.HasIndex(p => p.PreviousRefreshTokenHash)
            .HasDatabaseName("IX_Pilots_PreviousRefreshTokenHash")
            .HasFilter("\"PreviousRefreshTokenHash\" IS NOT NULL");

        builder.HasIndex(p => p.PasswordResetTokenHash)
            .HasDatabaseName("IX_Pilots_PasswordResetTokenHash")
            .HasFilter("\"PasswordResetTokenHash\" IS NOT NULL");
    }
}
