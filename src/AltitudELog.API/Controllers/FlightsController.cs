using AltitudELog.Application.Flights.Commands.CancelFlight;
using AltitudELog.Application.Flights.Commands.CreateFlight;
using AltitudELog.Application.Flights.Commands.UpdateFlight;
using AltitudELog.Application.Flights.Queries.GetFlightById;
using AltitudELog.Application.Flights.Queries.GetFlights;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

[ApiController]
[Route("[controller]")]
[Produces("application/json")]
[ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
public class FlightsController : ControllerBase
{
    private readonly IMediator _mediator;

    public FlightsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Logs a flight. METAR is not accepted here — it is fetched asynchronously by a background
    /// job after the flight is saved, so it appears on a subsequent read rather than in this
    /// response.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Captain,ChiefPilot")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Guid>> Create(CreateFlightCommand command, CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    /// <summary>
    /// Lists flights, newest first. Supports free-text search, date-range/airport/aircraft/status
    /// filters and sorting; see <see cref="GetFlightsQuery"/> for the full set.
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(FlightsPageResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<FlightsPageResult>> GetAll(
        [FromQuery] GetFlightsQuery query, CancellationToken cancellationToken)
    {
        var flights = await _mediator.Send(query, cancellationToken);
        return Ok(flights);
    }

    /// <summary>Returns a single flight.</summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(FlightDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FlightDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var flight = await _mediator.Send(new GetFlightByIdQuery(id), cancellationToken);
        return flight is null ? NotFound() : Ok(flight);
    }

    /// <summary>
    /// Updates a flight. Answers 409 if the flight is already cancelled, or if another request
    /// modified it first (the row carries an optimistic-concurrency token).
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Captain,ChiefPilot")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, UpdateFlightCommand command, CancellationToken cancellationToken)
    {
        await _mediator.Send(command with { FlightId = id }, cancellationToken);
        return NoContent();
    }

    /// <summary>Cancels a flight. One-way: an already-cancelled flight answers 409.</summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = "Captain,ChiefPilot")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new CancelFlightCommand(id), cancellationToken);
        return NoContent();
    }
}
