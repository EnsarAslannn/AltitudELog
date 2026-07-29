using AltitudELog.Application.Stats.Queries.GetStats;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

[ApiController]
[Route("[controller]")]
[Produces("application/json")]
public class StatsController : ControllerBase
{
    private readonly IMediator _mediator;

    public StatsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Aggregate counts for the command dashboard, including certificates near expiry.</summary>
    [HttpGet]
    [Authorize(Roles = "Captain,ChiefPilot")]
    [ProducesResponseType(typeof(StatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<StatsDto>> GetStats(CancellationToken cancellationToken)
    {
        var stats = await _mediator.Send(new GetStatsQuery(), cancellationToken);
        return Ok(stats);
    }
}
