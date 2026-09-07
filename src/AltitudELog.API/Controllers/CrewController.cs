using AltitudELog.Application.Crew.Commands.CreateCrew;
using AltitudELog.Application.Crew.Commands.RemoveCrew;
using AltitudELog.Application.Crew.Commands.UpdateCrew;
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

    /// <summary>
    /// Changes a crew member's duty role. The pilot behind the assignment cannot be swapped here —
    /// that is a removal plus a fresh assignment. Answers 409 if the flight is already cancelled.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Captain,ChiefPilot")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, UpdateCrewCommand command, CancellationToken cancellationToken)
    {
        await _mediator.Send(command with { Id = id }, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Removes a pilot from a flight's crew. Answers 409 if the flight is already cancelled.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Captain,ChiefPilot")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Remove(Guid id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new RemoveCrewCommand(id), cancellationToken);
        return NoContent();
    }
}
