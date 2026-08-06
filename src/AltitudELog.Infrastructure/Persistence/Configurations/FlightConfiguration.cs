using AltitudELog.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AltitudELog.Infrastructure.Persistence.Configurations;

public class FlightConfiguration : IEntityTypeConfiguration<Flight>
{
    public void Configure(EntityTypeBuilder<Flight> builder)
    {
        builder.ToTable("Flights");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.OriginICAO)
            .IsRequired()
            .HasMaxLength(4);

        builder.Property(f => f.DestinationICAO)
            .IsRequired()
            .HasMaxLength(4);

        builder.Property(f => f.AircraftType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(f => f.Date)
            .IsRequired();

        builder.Property(f => f.FlightTime)
            .IsRequired();

        builder.Property(f => f.METARInfo)
            .HasMaxLength(2000);

        builder.HasIndex(f => new { f.Date, f.Id })
            .HasDatabaseName("IX_Flights_Date_Id")
            .IsDescending(true, true);

        builder.Property<uint>("xmin").IsRowVersion();
    }
}
