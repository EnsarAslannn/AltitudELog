using AltitudELog.Application.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

[ApiController]
[Route("api/chat/personal")]
[Authorize]
public class PersonalChatController : ControllerBase
{
    private const int MaximumMessageLength = 500;
    private const int MaximumHistoryMessages = 20;
    private const int MaximumHistoryMessageLength = 1_000;

    private readonly IChatKnowledgeBaseService _knowledgeBase;
    private readonly IPersonalChatService _personalChat;
    private readonly IChatInteractionService _interactions;

    public PersonalChatController(
        IChatKnowledgeBaseService knowledgeBase,
        IPersonalChatService personalChat,
        IChatInteractionService interactions)
    {
        _knowledgeBase = knowledgeBase;
        _personalChat = personalChat;
        _interactions = interactions;
    }

    /// <summary>
    /// Answers read-only questions about the authenticated pilot's own flights and certificates.
    /// Falls back to the local product knowledge base when the question is not personal.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ChatResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ChatResponse>> Post(
        ChatRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            ModelState.AddModelError(nameof(request.Message), "Message is required.");
        }
        else if (request.Message.Length > MaximumMessageLength)
        {
            ModelState.AddModelError(
                nameof(request.Message),
                $"Message cannot exceed {MaximumMessageLength} characters.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var history = (request.History ?? [])
            .Where(message =>
                !string.IsNullOrWhiteSpace(message.Content) &&
                (message.Role.Equals("user", StringComparison.OrdinalIgnoreCase) ||
                 message.Role.Equals("assistant", StringComparison.OrdinalIgnoreCase)))
            .TakeLast(MaximumHistoryMessages)
            .Select(message => message with
            {
                Content = message.Content[..Math.Min(message.Content.Length, MaximumHistoryMessageLength)]
            })
            .ToArray();
        var normalizedRequest = request with
        {
            Message = request.Message.Trim(),
            Language = request.Language.Equals("en", StringComparison.OrdinalIgnoreCase) ? "en" : "tr",
            History = history
        };

        var personalAnswer = await _personalChat.TryAnswerAsync(normalizedRequest, cancellationToken);
        var response = personalAnswer ?? _knowledgeBase.Answer(normalizedRequest);
        return Ok(await _interactions.RecordAsync(normalizedRequest, response, cancellationToken));
    }
}
