using AltitudELog.Application.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

public sealed record ChatFeedbackRequest(bool Helpful);

[ApiController]
[Route("api/chat/feedback")]
public class ChatFeedbackController : ControllerBase
{
    private readonly IChatInteractionService _interactions;

    public ChatFeedbackController(IChatInteractionService interactions)
    {
        _interactions = interactions;
    }

    [HttpPost("{interactionId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Post(
        Guid interactionId,
        ChatFeedbackRequest request,
        CancellationToken cancellationToken)
    {
        var updated = await _interactions.SetFeedbackAsync(
            interactionId,
            request.Helpful,
            cancellationToken);
        return updated ? NoContent() : NotFound();
    }
}
