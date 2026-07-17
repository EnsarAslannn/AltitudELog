using AltitudELog.Application.CRMReports.Commands.CreateCRMReport;
using AltitudELog.Application.CRMReports.Queries.GetCRMReportsByFlight;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AltitudELog.API.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class CRMReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CRMReportsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> Create(CreateCRMReportCommand command, CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(command, cancellationToken);
        return Ok(id);
    }

    [HttpGet("flight/{flightId}")]
    public async Task<ActionResult<List<CRMReportDto>>> GetByFlight(Guid flightId, CancellationToken cancellationToken)
    {
        var reports = await _mediator.Send(new GetCRMReportsByFlightQuery(flightId), cancellationToken);
        return Ok(reports);
    }
}
