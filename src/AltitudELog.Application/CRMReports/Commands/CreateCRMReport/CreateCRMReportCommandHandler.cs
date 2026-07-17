using AltitudELog.Application.Common.Interfaces;
using MediatR;

namespace AltitudELog.Application.CRMReports.Commands.CreateCRMReport;

public class CreateCRMReportCommandHandler : IRequestHandler<CreateCRMReportCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateCRMReportCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Guid> Handle(CreateCRMReportCommand request, CancellationToken cancellationToken)
    {
        var reporterId = _currentUserService.PilotId
            ?? throw new UnauthorizedAccessException("No authenticated pilot found for this request.");

        var report = new AltitudELog.Domain.Entities.CRMReport
        {
            Id = Guid.NewGuid(),
            FlightId = request.FlightId,
            Title = request.Title,
            Description = request.Description,
            IsAnonymous = request.IsAnonymous,
            SeverityLevel = request.SeverityLevel,
            CreatedDate = DateTime.UtcNow,
            ReporterId = reporterId
        };

        _context.CRMReports.Add(report);
        await _context.SaveChangesAsync(cancellationToken);

        return report.Id;
    }
}
