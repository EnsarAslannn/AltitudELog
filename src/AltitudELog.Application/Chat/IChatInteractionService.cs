namespace AltitudELog.Application.Chat;

public interface IChatInteractionService
{
    Task<ChatResponse> RecordAsync(
        ChatRequest request,
        ChatResponse response,
        CancellationToken cancellationToken);

    Task<bool> SetFeedbackAsync(Guid interactionId, bool helpful, CancellationToken cancellationToken);

    Task<IReadOnlyList<UnansweredChatQuestionDto>> GetUnansweredAsync(
        int take,
        CancellationToken cancellationToken);
}
