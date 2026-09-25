using AltitudELog.Application.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

[ApiController]
[Route("api/chat/unanswered")]
[Authorize(Roles = "Captain,ChiefPilot")]
public class ChatInsightsController : ControllerBase
{
    private readonly IChatInteractionService _interactions;

    public ChatInsightsController(IChatInteractionService interactions)
    {
        _interactions = interactions;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UnansweredChatQuestionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<UnansweredChatQuestionDto>>> Get(
        [FromQuery] int take = 50,
        CancellationToken cancellationToken = default)
    {
        var questions = await _interactions.GetUnansweredAsync(take, cancellationToken);
        return Ok(questions);
    }
}
