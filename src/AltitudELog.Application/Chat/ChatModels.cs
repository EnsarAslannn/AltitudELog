namespace AltitudELog.Application.Chat;

public sealed record ChatHistoryMessage(string Role, string Content);

public sealed record ChatRequest(
    string Message,
    string Language,
    IReadOnlyList<ChatHistoryMessage> History);

public sealed record ChatSource(string Title, string Url);

public sealed record ChatResponse(
    string Answer,
    IReadOnlyList<ChatSource> Sources,
    IReadOnlyList<string> Suggestions,
    bool UsedAi);
