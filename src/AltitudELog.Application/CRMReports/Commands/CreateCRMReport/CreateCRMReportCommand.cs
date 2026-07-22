using AltitudELog.Application.Common.Caching;
using AltitudELog.Domain.Enums;
using MediatR;

namespace AltitudELog.Application.CRMReports.Commands.CreateCRMReport;

public record CreateCRMReportCommand(
    Guid FlightId,
    string Title,
    string Description,
    bool IsAnonymous,
    SeverityLevel SeverityLevel
) : IRequest<Guid>, ICacheInvalidatorCommand
{
    public string[] CacheKeysToInvalidate => [CacheKeys.CrmReportsByFlight(FlightId), CacheKeys.Stats];
}
