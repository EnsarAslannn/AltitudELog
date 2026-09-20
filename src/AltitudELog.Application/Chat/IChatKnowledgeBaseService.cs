namespace AltitudELog.Application.Chat;

public interface IChatKnowledgeBaseService
{
    ChatResponse Answer(ChatRequest request);
}
