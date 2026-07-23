using AltitudELog.API.Common.Export;
using AltitudELog.Application.Pilots.Queries.GetPilotLogbook;
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

    [HttpGet("{id:guid}/logbook")]
    [Authorize]
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
}
