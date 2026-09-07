using AltitudELog.Application.CRMReports.Commands.CreateCRMReport;
using AltitudELog.Application.CRMReports.Commands.UpdateCRMReportStatus;
using AltitudELog.Application.CRMReports.Queries.GetCRMReports;
using AltitudELog.Application.CRMReports.Queries.GetCRMReportsByFlight;
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
public class CRMReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CRMReportsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Files a CRM safety report against a flight. The reporter is always recorded from the
    /// caller's token, including for anonymous reports — anonymity is enforced when reports are
    /// presented, not by discarding who filed them.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Guid>> Create(CreateCRMReportCommand command, CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(command, cancellationToken);
        return Ok(id);
    }

    /// <summary>Lists the CRM reports filed against a flight.</summary>
    [HttpGet("flight/{flightId}")]
    [ProducesResponseType(typeof(List<CRMReportDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CRMReportDto>>> GetByFlight(Guid flightId, CancellationToken cancellationToken)
    {
        var reports = await _mediator.Send(new GetCRMReportsByFlightQuery(flightId), cancellationToken);
        return Ok(reports);
    }

    /// <summary>
    /// The safety-review queue: reports across every flight, filtered by status, severity, date or
    /// flight and paged. Restricted to a command rank — the per-flight list stays open to any
    /// pilot, but a searchable index of every report filed is a safety-management view.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Captain,ChiefPilot")]
    [ProducesResponseType(typeof(CRMReportsPageResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CRMReportsPageResult>> GetAll(
        [FromQuery] GetCRMReportsQuery query, CancellationToken cancellationToken)
    {
        var reports = await _mediator.Send(query, cancellationToken);
        return Ok(reports);
    }

    /// <summary>
    /// Moves a report along its review (Open → UnderReview → Closed, in any order). The report's
    /// own account of what happened is not editable — only where it sits in the review is.
    /// </summary>
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Captain,ChiefPilot")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        Guid id, UpdateCRMReportStatusCommand command, CancellationToken cancellationToken)
    {
        await _mediator.Send(command with { Id = id }, cancellationToken);
        return NoContent();
    }
}
