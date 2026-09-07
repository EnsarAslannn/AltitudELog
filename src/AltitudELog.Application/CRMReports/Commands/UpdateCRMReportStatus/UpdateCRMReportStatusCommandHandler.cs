using AltitudELog.Application.Common.Caching;
using AltitudELog.Application.Common.Exceptions;
using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AltitudELog.Application.CRMReports.Commands.UpdateCRMReportStatus;

public class UpdateCRMReportStatusCommandHandler : IRequestHandler<UpdateCRMReportStatusCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<UpdateCRMReportStatusCommandHandler> _logger;

    public UpdateCRMReportStatusCommandHandler(
        IApplicationDbContext context, ILogger<UpdateCRMReportStatusCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Handle(UpdateCRMReportStatusCommand request, CancellationToken cancellationToken)
    {
        var report = await _context.CRMReports.FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException($"CRM report '{request.Id}' does not exist.");

        var previousStatus = report.Status;
        report.Status = request.Status;

        // Who moved it and when is stamped by the audit trail in ApplicationDbContext.SaveChanges.
        await _context.SaveChangesAsync(cancellationToken);

        request.CacheKeysToInvalidate =
            [.. request.CacheKeysToInvalidate, CacheKeys.CrmReportsByFlight(report.FlightId)];

        _logger.LogInformation(
            "CRM report {ReportId} moved from {PreviousStatus} to {Status}",
            report.Id, previousStatus, report.Status);
    }
}
