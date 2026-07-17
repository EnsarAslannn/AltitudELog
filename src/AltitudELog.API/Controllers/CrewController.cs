using AltitudELog.Application.Crew.Commands.CreateCrew;
using AltitudELog.Application.Crew.Queries.GetCrewByFlight;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class CrewController : ControllerBase
{
    private readonly IMediator _mediator;

    public CrewController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [Authorize(Roles = "Captain")]
    public async Task<ActionResult<Guid>> Create(CreateCrewCommand command, CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(command, cancellationToken);
        return Ok(id);
    }

    [HttpGet("flight/{flightId}")]
    public async Task<ActionResult<List<CrewDto>>> GetByFlight(Guid flightId, CancellationToken cancellationToken)
    {
        var crew = await _mediator.Send(new GetCrewByFlightQuery(flightId), cancellationToken);
        return Ok(crew);
    }
}
