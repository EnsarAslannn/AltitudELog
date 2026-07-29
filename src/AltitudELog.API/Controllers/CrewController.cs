using AltitudELog.Application.Crew.Commands.CreateCrew;
using AltitudELog.Application.Crew.Queries.GetCrewByFlight;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
[Produces("application/json")]
[ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
public class CrewController : ControllerBase
{
    private readonly IMediator _mediator;

    public CrewController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Assigns a pilot to a flight with a flight-specific duty role. A pilot can only be assigned
    /// to a given flight once — a repeat answers 409.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Captain,ChiefPilot")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<Guid>> Create(CreateCrewCommand command, CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(command, cancellationToken);
        return Ok(id);
    }

    /// <summary>Lists the crew assigned to a flight.</summary>
    [HttpGet("flight/{flightId}")]
    [ProducesResponseType(typeof(List<CrewDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CrewDto>>> GetByFlight(Guid flightId, CancellationToken cancellationToken)
    {
        var crew = await _mediator.Send(new GetCrewByFlightQuery(flightId), cancellationToken);
        return Ok(crew);
    }
}
