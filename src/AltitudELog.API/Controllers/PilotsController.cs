using AltitudELog.Application.Pilots.Queries.GetPilots;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

[ApiController]
[Route("[controller]")]
public class PilotsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PilotsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<PilotDto>>> GetAll(CancellationToken cancellationToken)
    {
        var pilots = await _mediator.Send(new GetPilotsQuery(), cancellationToken);
        return Ok(pilots);
    }
}
