namespace AltitudELog.Application.Chat;

public interface IPersonalChatService
{
    Task<ChatResponse?> TryAnswerAsync(ChatRequest request, CancellationToken cancellationToken);
}
