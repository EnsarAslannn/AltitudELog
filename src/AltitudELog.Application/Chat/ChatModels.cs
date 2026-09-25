namespace AltitudELog.Application.Chat;

public sealed record ChatHistoryMessage(string Role, string Content);

public sealed record ChatRequest(
    string Message,
    string Language,
    IReadOnlyList<ChatHistoryMessage> History,
    ChatPageContext? Context = null);

public sealed record ChatPageContext(string Page, string? EntityId = null);

public sealed record ChatSource(string Title, string Url);

public sealed record UnansweredChatQuestionDto(
    Guid Id,
    string Question,
    string Language,
    string? Page,
    DateTime CreatedAtUtc,
    bool? IsHelpful);

public sealed record ChatResponse(
    string Answer,
    IReadOnlyList<ChatSource> Sources,
    IReadOnlyList<string> Suggestions,
    bool UsedAi,
    bool IsAnswered = true,
    Guid? InteractionId = null);
