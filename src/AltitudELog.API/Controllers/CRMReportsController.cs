using AltitudELog.Application.CRMReports.Commands.CreateCRMReport;
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
}
