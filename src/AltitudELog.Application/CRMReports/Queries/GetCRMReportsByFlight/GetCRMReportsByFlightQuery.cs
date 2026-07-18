using AltitudELog.Application.Common.Caching;
using MediatR;

namespace AltitudELog.Application.CRMReports.Queries.GetCRMReportsByFlight;

public record GetCRMReportsByFlightQuery(Guid FlightId) : IRequest<List<CRMReportDto>>, ICacheableQuery
{
    public string CacheKey => CacheKeys.CrmReportsByFlight(FlightId);
    public TimeSpan? Expiry => TimeSpan.FromMinutes(5);
}
