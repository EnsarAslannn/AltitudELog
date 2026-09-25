using AltitudELog.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AltitudELog.Infrastructure.Persistence.Configurations;

public class ChatInteractionConfiguration : IEntityTypeConfiguration<ChatInteraction>
{
    public void Configure(EntityTypeBuilder<ChatInteraction> builder)
    {
        builder.ToTable("ChatInteractions");
        builder.HasKey(interaction => interaction.Id);

        builder.Property(interaction => interaction.UnansweredQuestion)
            .HasMaxLength(500);
        builder.Property(interaction => interaction.Language)
            .IsRequired()
            .HasMaxLength(2);
        builder.Property(interaction => interaction.Page)
            .HasMaxLength(50);
        builder.Property(interaction => interaction.IsAnswered)
            .IsRequired();
        builder.Property(interaction => interaction.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(interaction => new { interaction.IsAnswered, interaction.CreatedAtUtc });
    }
}
