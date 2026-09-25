namespace AltitudELog.Domain.Entities;

public class ChatInteraction
{
    public Guid Id { get; set; }
    public string? UnansweredQuestion { get; set; }
    public string Language { get; set; } = "tr";
    public string? Page { get; set; }
    public bool IsAnswered { get; set; }
    public bool? IsHelpful { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
