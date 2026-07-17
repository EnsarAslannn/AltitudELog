using AltitudELog.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AltitudELog.Application.CRMReports.Queries.GetCRMReportsByFlight;

public class GetCRMReportsByFlightQueryHandler : IRequestHandler<GetCRMReportsByFlightQuery, List<CRMReportDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCRMReportsByFlightQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CRMReportDto>> Handle(GetCRMReportsByFlightQuery request, CancellationToken cancellationToken)
    {
        return await _context.CRMReports
            .AsNoTracking()
            .Where(r => r.FlightId == request.FlightId)
            .Select(r => new CRMReportDto
            {
                Id = r.Id,
                FlightId = r.FlightId,
                Title = r.Title,
                Description = r.Description,
                IsAnonymous = r.IsAnonymous,
                SeverityLevel = r.SeverityLevel,
                CreatedDate = r.CreatedDate,
                ReporterId = r.IsAnonymous ? null : r.ReporterId,
                ReporterName = r.IsAnonymous ? null : r.Reporter!.Name
            })
            .ToListAsync(cancellationToken);
    }
}
