using AltitudELog.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AltitudELog.Infrastructure.Persistence.Configurations;

public class CRMReportConfiguration : IEntityTypeConfiguration<CRMReport>
{
    public void Configure(EntityTypeBuilder<CRMReport> builder)
    {
        builder.ToTable("CRMReports");

        builder.HasKey(r => r.Id);

        builder.HasIndex(r => r.FlightId);
        builder.HasIndex(r => r.ReporterId);

        // The safety-review list is filtered by status far more often than by anything else — an
        // open-reports queue is the whole point of it — and every row carries one of three values.
        builder.HasIndex(r => r.Status);

        builder.Property(r => r.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(r => r.Description)
            .IsRequired()
            .HasMaxLength(4000);

        builder.Property(r => r.IsAnonymous)
            .IsRequired();

        builder.Property(r => r.SeverityLevel)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(r => r.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(r => r.CreatedDate)
            .IsRequired();

        builder.HasOne(r => r.Flight)
            .WithMany(f => f.CRMReports)
            .HasForeignKey(r => r.FlightId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Reporter)
            .WithMany()
            .HasForeignKey(r => r.ReporterId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
