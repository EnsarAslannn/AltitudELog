using System.Text.RegularExpressions;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.Chat;

public sealed partial class ChatInteractionService : IChatInteractionService
{
    private const int MaximumStoredQuestionLength = 500;
    private static readonly HashSet<string> AllowedPages =
        ["flight", "pilot", "dashboard", "safety-reports", "admin-stats"];

    private readonly IApplicationDbContext _context;

    public ChatInteractionService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ChatResponse> RecordAsync(
        ChatRequest request,
        ChatResponse response,
        CancellationToken cancellationToken)
    {
        var interaction = new ChatInteraction
        {
            Id = Guid.NewGuid(),
            UnansweredQuestion = response.IsAnswered ? null : Anonymize(request.Message),
            Language = request.Language.Equals("en", StringComparison.OrdinalIgnoreCase) ? "en" : "tr",
            Page = request.Context is not null && AllowedPages.Contains(request.Context.Page)
                ? request.Context.Page
                : null,
            IsAnswered = response.IsAnswered,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.ChatInteractions.Add(interaction);
        await _context.SaveChangesAsync(cancellationToken);
        return response with { InteractionId = interaction.Id };
    }

    public async Task<bool> SetFeedbackAsync(
        Guid interactionId,
        bool helpful,
        CancellationToken cancellationToken)
    {
        var interaction = await _context.ChatInteractions
            .FirstOrDefaultAsync(item => item.Id == interactionId, cancellationToken);
        if (interaction is null)
        {
            return false;
        }

        interaction.IsHelpful = helpful;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<UnansweredChatQuestionDto>> GetUnansweredAsync(
        int take,
        CancellationToken cancellationToken)
    {
        var limit = Math.Clamp(take, 1, 100);
        return await _context.ChatInteractions
            .AsNoTracking()
            .Where(item => !item.IsAnswered && item.UnansweredQuestion != null)
            .OrderByDescending(item => item.CreatedAtUtc)
            .Take(limit)
            .Select(item => new UnansweredChatQuestionDto(
                item.Id,
                item.UnansweredQuestion!,
                item.Language,
                item.Page,
                item.CreatedAtUtc,
                item.IsHelpful))
            .ToListAsync(cancellationToken);
    }

    private static string Anonymize(string question)
    {
        var result = EmailRegex().Replace(question.Trim(), "[email]");
        result = GuidRegex().Replace(result, "[id]");
        result = LongNumberRegex().Replace(result, "[number]");
        return result[..Math.Min(result.Length, MaximumStoredQuestionLength)];
    }

    [GeneratedRegex(@"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex EmailRegex();

    [GeneratedRegex(@"\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex GuidRegex();

    [GeneratedRegex(@"\b\d{4,}\b", RegexOptions.CultureInvariant)]
    private static partial Regex LongNumberRegex();
}
