using AltitudELog.Application.Stats.Queries.GetStats;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

[ApiController]
[Route("[controller]")]
public class StatsController : ControllerBase
{
    private readonly IMediator _mediator;

    public StatsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [Authorize(Roles = "Captain,ChiefPilot")]
    public async Task<ActionResult<StatsDto>> GetStats(CancellationToken cancellationToken)
    {
        var stats = await _mediator.Send(new GetStatsQuery(), cancellationToken);
        return Ok(stats);
    }
}
