using AltitudELog.API.Common.Export;
using AltitudELog.Application.Pilots.Commands.UpdatePilotCertificates;
using AltitudELog.Application.Pilots.Queries.GetPilotLogbook;
using AltitudELog.Application.Pilots.Queries.GetPilotProfile;
using AltitudELog.Application.Pilots.Queries.GetPilots;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

[ApiController]
[Route("[controller]")]
[Produces("application/json")]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
public class PilotsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PilotsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Lists pilots, for the crew-assignment picker.</summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(List<PilotDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PilotDto>>> GetAll(CancellationToken cancellationToken)
    {
        var pilots = await _mediator.Send(new GetPilotsQuery(), cancellationToken);
        return Ok(pilots);
    }

    /// <summary>
    /// A pilot's profile, with hours, currency and certificate expiry derived from their
    /// non-cancelled crewed flights.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(PilotProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PilotProfileDto>> GetProfile(Guid id, CancellationToken cancellationToken)
    {
        var profile = await _mediator.Send(new GetPilotProfileQuery(id), cancellationToken);
        return profile is null ? NotFound() : Ok(profile);
    }

    /// <summary>
    /// Downloads a pilot's logbook as CSV or PDF. Restricted to the pilot it belongs to, or to a
    /// Captain or Chief Pilot — unlike the profile above, this is the pilot's full personal flight
    /// record rather than the currency figures flight ops need to see.
    /// </summary>
    [HttpGet("{id:guid}/logbook")]
    [Authorize]
    [Produces("text/csv", "application/pdf")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportLogbook(Guid id, [FromQuery] string format, CancellationToken cancellationToken)
    {
        if (format is not ("csv" or "pdf"))
        {
            return BadRequest("format must be 'csv' or 'pdf'.");
        }

        var logbook = await _mediator.Send(new GetPilotLogbookQuery(id), cancellationToken);
        if (logbook is null)
        {
            return NotFound();
        }

        return format == "csv"
            ? File(CsvLogbookWriter.Write(logbook), "text/csv", $"logbook-{id}.csv")
            : File(PdfLogbookWriter.Write(logbook), "application/pdf", $"logbook-{id}.pdf");
    }

    /// <summary>
    /// Updates the caller's own licence and medical expiry dates. Scoped to the authenticated
    /// pilot by design — the command carries no pilot id a client could point elsewhere.
    /// </summary>
    [HttpPut("me/certificates")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateMyCertificates(
        UpdatePilotCertificatesCommand command, CancellationToken cancellationToken)
    {
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }
}
