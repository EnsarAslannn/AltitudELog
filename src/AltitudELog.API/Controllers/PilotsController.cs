using AltitudELog.Application.Pilots.Commands.UpdatePilotCertificates;
using AltitudELog.Application.Pilots.Queries.GetPilotProfile;
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

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<PilotProfileDto>> GetProfile(Guid id, CancellationToken cancellationToken)
    {
        var profile = await _mediator.Send(new GetPilotProfileQuery(id), cancellationToken);
        return profile is null ? NotFound() : Ok(profile);
    }

    [HttpPut("me/certificates")]
    [Authorize]
    public async Task<IActionResult> UpdateMyCertificates(
        UpdatePilotCertificatesCommand command, CancellationToken cancellationToken)
    {
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }
}
