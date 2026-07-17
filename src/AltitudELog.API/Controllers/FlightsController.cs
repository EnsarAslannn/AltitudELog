using AltitudELog.Application.Flights.Commands.CreateFlight;
using AltitudELog.Application.Flights.Queries.GetFlights;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

[ApiController]
[Route("[controller]")]
public class FlightsController : ControllerBase
{
    private readonly IMediator _mediator;

    public FlightsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [Authorize(Roles = "Captain")]
    public async Task<ActionResult<Guid>> Create(CreateFlightCommand command, CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id }, id);
    }

    [HttpGet]
    public async Task<ActionResult<List<FlightDto>>> GetAll(CancellationToken cancellationToken)
    {
        var flights = await _mediator.Send(new GetFlightsQuery(), cancellationToken);
        return Ok(flights);
    }
}
